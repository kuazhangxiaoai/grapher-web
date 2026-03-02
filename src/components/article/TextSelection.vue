<template>
  <div v-if="documentId" class="pdf-selection-container">
    <Viewport :document-id="documentId" style="overflow: hidden; width: 100%; height: 100%; padding: 10px">
      <Scroller :document-id="documentId">
        <template #default="{page}">
          <div
            v-if="Number(page.pageIndex) === currentPage"
            class="page-container"
          >
            <PagePointerProvider :document-id="documentId" :page-index="page.pageIndex">
              <RenderLayer
                  :document-id="documentId"
                  :page-index="page.pageIndex"
                  :scale="1"
                  style="pointer-events: none"
              />
              <SelectionLayer :document-id="documentId" :page-index="page.pageIndex">
              </SelectionLayer>
              <!-- 下划线叠加层：根据 marksToDraw 在当前页绘制 -->
              <HighlightLayer ref="highlightRef" :document-id="documentId" :page-index="page.pageIndex"/>
            </PagePointerProvider>
          </div>
        </template>
      </Scroller>
    </Viewport>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {v4 as uuid} from "uuid"
import {Viewport} from '@embedpdf/plugin-viewport/vue';
import {Scroller, useScroll} from '@embedpdf/plugin-scroll/vue';
import {RenderLayer} from '@embedpdf/plugin-render/vue';
import {PagePointerProvider} from '@embedpdf/plugin-interaction-manager/vue';
import {SelectionLayer, useSelectionCapability} from '@embedpdf/plugin-selection/vue';
import {useTextStore} from '@/store/useTextStore';
import {type Mark, MarkColor, MarkType, type Rect} from "@/configs/text"
import HighlightLayer from "@/components/article/HighlightLayer.vue";

const props = withDefaults(
  defineProps<{
    documentId?: string | null;
    currentPage?: number;
    articleId?: string;
    topicId?: string;
    domainId?: string;
  }>(),
  { currentPage: 0 },
);

// 用 computed 保持响应式，解构 props 会丢失响应性导致翻页不重新渲染
const currentPage = computed(() => props.currentPage ?? 0);
const highlightRef = ref<InstanceType<typeof HighlightLayer> | null>(null);
// 翻页后需要视口到当前页
const { provides: scrollScope, state: scrollState } = useScroll(() => props.documentId);
const scrollScopeRef = computed(() => scrollScope.value);
const textStore = useTextStore();
const selectedMark = ref<Mark | null>(null);
const selectedRects = ref<Rect[] | null>([]);
/** 需要绘制下划线的 mark 列表（用于 drawMark 后持久显示） */
const marksToDraw = ref<Mark[]>([]);
// 根据 embedpdf 的 scroll 状态计算并同步总页数到 store
watch(
  () => scrollState.value?.totalPages,
  (totalPages) => {
    if (totalPages != null && totalPages > 0) {
      textStore.setTotalPages(totalPages);
    }
  },
  { immediate: true },
);
watch(
  () => props.currentPage,
  (page) => {
    const scope = scrollScopeRef.value;
    if (scope != null && page != null) {
      // embedpdf 的 pageNumber 是 1-based，我们 currentPage 是 0-based
      scope.scrollToPage({ pageNumber: page + 1, behavior: 'smooth' });
    }
  },
  { immediate: true },
);

const { provides: selectionCapability } = useSelectionCapability();
const selection = computed(() => selectionCapability.value?.forDocument(props.documentId));
const hasSelection = ref(false);
const selectedText = ref('');
const copied = ref(false);
const menuCopied = ref(false);

const emit = defineEmits<{ (e: 'selection-change', payload: Mark): void }>();

let unsubscribeSelectionChange: (() => void) | undefined;
let unsubscribeEndSelection: (() => void) | undefined;

/** 获取选区的文本和坐标 */
const getSelectionContentAndCoordinates = () => {
  const scope = selection.value;
  if (!scope) {
    return { content: '', coordinates: [] };
  }
  const rects = scope.getBoundingRects?.() ?? [];
  const coordinates = rects.map((r) => ({
    page: r.page,
    rect: r.rect,
  }));
  return {
    content: selectedText.value,
    coordinates,
  };
};

/** 在当前 PDF 上绘制 mark 的下划线（加入绘制列表并在叠加层显示） */
const drawMark = (mark: Mark) => {
  const rects = mark.rects;
  rects.forEach((rect) => {
    const x0 = rect.x0;
    const y0 = rect.y1 - 5;
    const length = rect.x1 - rect.x0;
    const lineness = 2

    //highlightRef.value?.drawline(x0, y0, length, lineness, mark.color);
    highlightRef.value?.drawRectangle(rect.x0, rect.y0, rect.width, rect.height, 3, mark.color)
  })
};

// PDF 页面坐标系：原点在左下，y 向上；SVG viewBox 原点在左上，y 向下。需做 Y 轴翻转。
const PDF_PAGE_HEIGHT = 792;

/** 当前页用于下划线 SVG 的线段数据（x0, y, x1, color, key），y 已转换为 SVG 坐标系 */
const underlinePathsForPage = (pageIndex: number) => {
  const list: Array<{ x0: number; y: number; x1: number; color: string; key: string }> = [];
  for (const mark of marksToDraw.value) {
    const color = mark.color ?? MarkColor.editing;
    for (const rect of mark.rects ?? []) {
      if (rect.page !== pageIndex) continue;
      // 下划线取矩形下缘：PDF 中为 rect.y0（较小 y）；转为 SVG：svgY = pageHeight - pdfY
      const svgY = PDF_PAGE_HEIGHT - rect.y0;
      list.push({
        x0: rect.x0,
        y: svgY,
        x1: rect.x1,
        color,
        key: `${mark.id}-${rect.page}-${rect.x0}-${rect.y0}`,
      });
    }
  }
  return list;
};

onMounted(() => {
  if (!selection.value) return;

  unsubscribeSelectionChange = selection.value.onSelectionChange(
      (selectionRange: SelectionRangeX | null) => {
        hasSelection.value = !!selectionRange;
        if (!selectionRange) {
          selectedText.value = '';
          selectedMark.value = null;
          selectedRects.value = [];
        }
      },
  );

  unsubscribeEndSelection = selection.value.onEndSelection(() => {
    const scope = selection.value!;
    const rects = scope.getBoundingRects?.() ?? [];
    selectedRects.value = rects.map((r) => {
      const o = r.rect.origin ?? { x: 0, y: 0 };
      const s = r.rect.size ?? { width: 0, height: 0 };
      return {
        x0: o.x,
        y0: o.y,
        x1: o.x + s.width,
        y1: o.y + s.height,
        width: s.width,
        height: s.height,
        page: r.page,
      } as Rect;
    });
    const textTask = scope.getSelectedText();
    textTask.wait((textLines) => {
      selectedText.value = textLines.join('\n');
      const mark: Mark = {
        id: uuid(),
        content: selectedText.value,
        rects: selectedRects.value ?? [],
        articleId: props.articleId ?? '',
        type: MarkType.editing,
        color: MarkColor.editing,
      };
      selectedMark.value = mark;
      emit('selection-change', mark);
      drawMark(mark);
    });
  });
});

defineExpose({
  selectedText,
  selectedMark,
  hasSelection,
  marksToDraw,
  drawMark,
  getSelectionContentAndCoordinates,
});

onUnmounted(() => {
  unsubscribeSelectionChange?.();
  unsubscribeEndSelection?.();
});

const handleCopy = () => {
  selection.value?.copyToClipboard();
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const handleCopyFromMenu = () => {
  selection.value?.copyToClipboard();
  selection.value?.clear();
  menuCopied.value = true;
  setTimeout(() => {
    menuCopied.value = false;
  }, 1500);
};

watch([() => props.documentId, () => props.currentPage], () => {

});

</script>

<style scoped lang="scss">
.pdf-selection-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.viewport {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: #e5e7eb;
  overflow: hidden;
}

.page-container{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
}

.mark-underline-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.scroller{
  padding: 10px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

</style>
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

/** 将 embedpdf 的 getHighlightRects 转为我们的 Rect[]（每行/每段一个矩形） */
const highlightRectsToOurRects = (highlightRects: Record<number, { origin?: { x: number; y: number }; size?: { width: number; height: number } }[]>): Rect[] => {
  const list: Rect[] = [];
  for (const [pageStr, rects] of Object.entries(highlightRects)) {
    const page = Number(pageStr);
    for (const r of rects ?? []) {
      const o = r.origin ?? { x: 0, y: 0 };
      const s = r.size ?? { width: 0, height: 0 };
      list.push({
        x0: o.x,
        y0: o.y,
        x1: o.x + s.width,
        y1: o.y + s.height,
        width: s.width,
        height: s.height,
        page,
      });
    }
  }
  return list;
};

/** 获取选区的文本和坐标（使用 getHighlightRects，跨行时每行一个矩形） */
const getSelectionContentAndCoordinates = () => {
  const scope = selection.value;
  if (!scope) {
    return { content: '', coordinates: [] };
  }
  const highlightRects = scope.getHighlightRects?.() ?? {};
  const rects = highlightRectsToOurRects(highlightRects as Record<number, { origin?: { x: number; y: number }; size?: { width: number; height: number } }[]>);
  const coordinates = rects.map((r) => ({
    page: r.page,
    rect: { origin: { x: r.x0, y: r.y0 }, size: { width: r.width, height: r.height } },
  }));
  return {
    content: selectedText.value,
    coordinates,
  };
};

/** 在当前 PDF 上绘制 mark 的下划线（加入绘制列表并在叠加层显示） */
const drawMark = (mark: Mark) => {
  const rects = mark.rects;
  rects.forEach((r) => {
    //highlightRef.value?.drawLine(x0, y0, length, lineness, mark.color);
    highlightRef.value?.drawRectangle(r.x0, r.y0, r.width, r.height, 2, mark.color, mark.type);
  })
};

const clearMark = () => {
  highlightRef.value?.clear?.();
}

const clearEditing = () => {
  highlightRef.value?.clearEditing?.();
}

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
    // 使用 getHighlightRects 获取每行/每段一个矩形；getBoundingRects 只返回每页一个外包矩形，跨行会合并成一条
    const highlightRects = scope.getHighlightRects?.() ?? {};
    selectedRects.value = highlightRectsToOurRects(highlightRects as Record<number, { origin?: { x: number; y: number }; size?: { width: number; height: number } }[]>);
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
      console.log('selection-change:', mark);
    });
  });
});

defineExpose({
  selectedText,
  selectedMark,
  hasSelection,
  marksToDraw,
  drawMark,
  clearMark,
  clearEditing,
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
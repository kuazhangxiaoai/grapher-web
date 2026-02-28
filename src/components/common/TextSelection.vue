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
            </PagePointerProvider>
          </div>
        </template>
      </Scroller>
    </Viewport>
  </div>
</template>
<script setup lang="ts">
import {ref, onMounted, onUnmounted, computed, watch} from 'vue';
import { Viewport } from '@embedpdf/plugin-viewport/vue';
import { Scroller, useScroll } from '@embedpdf/plugin-scroll/vue';
import { RenderLayer } from '@embedpdf/plugin-render/vue';
import { PagePointerProvider } from '@embedpdf/plugin-interaction-manager/vue';
import { SelectionLayer, useSelectionCapability } from '@embedpdf/plugin-selection/vue';
import { useTextStore } from '@/store/useTextStore';

const props = withDefaults(
  defineProps<{
    documentId?: string | null;
    currentPage?: number;
  }>(),
  { currentPage: 0 },
);

// 用 computed 保持响应式，解构 props 会丢失响应性导致翻页不重新渲染
const currentPage = computed(() => props.currentPage ?? 0);

// 翻页后需要视口到当前页
const { provides: scrollScope, state: scrollState } = useScroll(() => props.documentId);
const scrollScopeRef = computed(() => scrollScope.value);
const textStore = useTextStore();

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

let unsubscribeSelectionChange: (() => void) | undefined;
let unsubscribeEndSelection: (() => void) | undefined;

onMounted(() => {
  if (!selection.value) return;

  unsubscribeSelectionChange = selection.value.onSelectionChange(
      (selectionRange: SelectionRangeX | null) => {
        hasSelection.value = !!selectionRange;
        if (!selectionRange) {
          selectedText.value = '';
        }
      },
  );

  unsubscribeEndSelection = selection.value.onEndSelection(() => {
    const textTask = selection.value!.getSelectedText();
    textTask.wait((textLines) => {
      selectedText.value = textLines.join('\n');
    });
  });
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

.scroller{
  padding: 10px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

</style>
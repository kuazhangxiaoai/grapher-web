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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Viewport } from '@embedpdf/plugin-viewport/vue';
import { Scroller } from '@embedpdf/plugin-scroll/vue';
import { RenderLayer } from '@embedpdf/plugin-render/vue';
import { PagePointerProvider } from '@embedpdf/plugin-interaction-manager/vue';
import { SelectionLayer, useSelectionCapability } from '@embedpdf/plugin-selection/vue';

const props = withDefaults(
  defineProps<{
    documentId?: string | null;
    currentPage?: number;
  }>(),
  { currentPage: 0 },
);

const { documentId, currentPage } = props;

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
    }, ignore);
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
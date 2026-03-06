<template>
  <div v-if="isLoading || !engine" class="loading-pane">
    Loading PDF Engine...
  </div>
  <div v-else-if="!props.src" class="loading-pane">
    暂无 PDF 文档
  </div>
  <div v-else class="text-processor-root">
    <EmbedPDF :key="props.src" :engine="engine" :plugins="pluginRef" v-slot="{ activeDocumentId }">
      <DocumentContent v-if="activeDocumentId" :document-id="activeDocumentId" :current-page="props.page" v-slot="{ isLoaded }">
        <TextSelection
          ref="textSelectionRef"
          v-if="isLoaded"
          :document-id="activeDocumentId"
          :current-page="currentPage"
          :article-id="props.articleId"
          :topic-id="props.topicId"
          :domain-id="props.domainId"
          @selection-change="$emit('selection-change', $event)"
        />
      </DocumentContent>
    </EmbedPDF>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import { usePdfiumEngine } from '@embedpdf/engines/vue';
import { EmbedPDF } from '@embedpdf/core/vue';
import { createPluginRegistration } from '@embedpdf/core';
import { init, WrappedPdfiumModule } from '@embedpdf/pdfium';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport/vue';
import { ScrollPluginPackage } from '@embedpdf/plugin-scroll/vue';
import { DocumentContent, DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/vue';
import { RenderPluginPackage } from '@embedpdf/plugin-render/vue';
import { InteractionManagerPluginPackage} from '@embedpdf/plugin-interaction-manager/vue';
import { SelectionPluginPackage } from '@embedpdf/plugin-selection/vue';
import TextSelection from "@/components/article/TextSelection.vue";
import type { Mark } from "@/configs/text";

//const { engine, isLoading } = usePdfiumEngine({wasmUrl: "http://localhost:8090/pdf/pdfium.wasm"}); => product.env
const { engine, isLoading } = usePdfiumEngine();


const props = defineProps<{
  src?: string | null;
  page?: number;
  articleId?: string | null;
  topicId?: string | null;
  domainId?: string | null;
}>();

defineEmits(["selection-change"]);
const currentPage = ref(0);
const textSelectionRef = ref<InstanceType<typeof TextSelection> | null>(null);

/** 在 PDF 上绘制下划线（转发给 TextSelection.drawMark） */
const drawMark = (mark: Mark) => {
  textSelectionRef.value?.drawMark?.(mark);
};

const clearMark = () => {
  textSelectionRef.value?.clearMark?.();
}

const clearEditing = () => {
  textSelectionRef.value?.clearEditing?.();
}
defineExpose({ drawMark, clearMark, clearEditing });

/** 根据 src 构建插件配置，确保 EmbedPDF 初始化时即有有效 plugins（官方示例为顶层常量） */
const pluginRef = computed(() => [
  createPluginRegistration(DocumentManagerPluginPackage, {
    initialDocuments: [{ url: props.src }],
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
  createPluginRegistration(InteractionManagerPluginPackage),
  createPluginRegistration(SelectionPluginPackage),
]);

watch([() => props.src, () => props.page], () => {
  currentPage.value = props.page ?? 1;
});

</script>

<style scoped>
.text-processor-root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.loading-pane {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
:deep(.viewport) {
  width: 100%;
  height: 100%;
  padding: 10px;
  background-color: #f1f3f5;
  overflow: hidden;
  touch-action: none;
}
:deep(.viewport) :deep(.scroller),
:deep(.viewport) :deep([class*="scroll"]) {
  touch-action: none;
  overscroll-behavior: none;
}
:deep(.selection-menu) {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px;
}
:deep(.selection-copy-btn) {
  padding: 4px 12px;
  font-size: 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}
:deep(.selection-copy-btn:hover) {
  background: #e8e8e8;
}
.scroller{
  padding: 10px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

</style>

<template>
  <div v-if="isLoading || !engine" class="loading-pane">
    Loading PDF Engine...
  </div>
  <div v-else class="text-processor-root">
    <EmbedPDF :engine="engine" :plugins="pluginRef" v-slot="{ activeDocumentId }">
      <DocumentContent v-if="activeDocumentId" :document-id="activeDocumentId" :current-page="props.page" v-slot="{ isLoaded }">
        <TextSelection v-if="isLoaded" :document-id="activeDocumentId" :current-page="currentPage" />
      </DocumentContent>
    </EmbedPDF>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from 'vue';
import { usePdfiumEngine } from '@embedpdf/engines/vue';
import { EmbedPDF } from '@embedpdf/core/vue';
import { createPluginRegistration } from '@embedpdf/core';

import { ViewportPluginPackage } from '@embedpdf/plugin-viewport/vue';
import { ScrollPluginPackage } from '@embedpdf/plugin-scroll/vue';
import { DocumentContent, DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/vue';
import { RenderPluginPackage } from '@embedpdf/plugin-render/vue';
import { InteractionManagerPluginPackage} from '@embedpdf/plugin-interaction-manager/vue';
import { SelectionPluginPackage } from '@embedpdf/plugin-selection/vue';
import TextSelection from "@/components/common/TextSelection.vue";

const { engine, isLoading } = usePdfiumEngine();
const pluginRef = ref(null)
const props = defineProps<{
  src?: string | null;
  page?: number;
}>();
const currentPage = ref(0);

onMounted(()=>{
  const plugins = [
    createPluginRegistration(DocumentManagerPluginPackage, {
      initialDocuments: [{ url: props.src }],
    }),
    createPluginRegistration(ViewportPluginPackage),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
    createPluginRegistration(InteractionManagerPluginPackage),
    createPluginRegistration(SelectionPluginPackage),
  ];
  pluginRef.value = plugins;
})

watch([() => props.src, () => props.page], () => {
  const plugins = [
    createPluginRegistration(DocumentManagerPluginPackage, {
      initialDocuments: [{ url: props.src }],
    }),
    createPluginRegistration(ViewportPluginPackage),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
    createPluginRegistration(InteractionManagerPluginPackage),
    createPluginRegistration(SelectionPluginPackage),
  ];
  pluginRef.value = plugins;
  currentPage.value = props.page;
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

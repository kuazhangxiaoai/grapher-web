<template>
  <div class="text-processor">

    <div v-if="src" class="pdf-viewer-wrap" @wheel.prevent>
      <PDFViewer id="pdfViewer"
        :key="src"
        :config="{
          src,
          tabBar: 'never',
          disabledCategories: [
            'document', 'page', 'panel', 'zoom', 'annotation', 'redaction',
            'tools', 'history',
          ],
        }"
        :style="{ height: '100%', minHeight: 0 }"
        @ready="handleReady"
      />
    </div>
    <div v-else class="pdf-placeholder">请选择或加载一个 PDF 文档进行预览。</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PDFViewer, type PluginRegistry } from "@embedpdf/vue-pdf-viewer";

defineProps<{
  src?: string | null;
}>();
const registry = ref<PluginRegistry | null>(null);
const documentId = ref<string | null>(null);
const docId = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);

function goPrev() {
  if (!docId.value || !registry.value) return;
  registry.value.getPlugin("scroll")?.provides()?.forDocument(docId.value)?.scrollToPreviousPage?.("smooth");
}
function goNext() {
  if (!docId.value || !registry.value) return;
  registry.value.getPlugin("scroll")?.provides()?.forDocument(docId.value)?.scrollToNextPage?.("smooth");
}

//清空工具栏
const clearToolBar = (r: PluginRegistry) => {
  // 隐藏 header/toolbar：清空主工具栏
  const ui = r.getPlugin("ui")?.provides();
  if (ui) {
    const schema = ui.getSchema?.();
    const toolbar = schema?.toolbars?.["main-toolbar"];
    if (toolbar) {
      ui.mergeSchema?.({
        toolbars: { "main-toolbar": { ...toolbar, items: [] } },
      });
    }
  }
}

//PDF加载完成响应函数
function handleReady(r: PluginRegistry) {
  registry.value = r;
  clearToolBar(r);
  const docManager = r.getPlugin("document-manager")?.provides();
  if (!docManager) return;
  // 文档打开时：获取 documentId 并注册选区监听
  const onDocOpen = (doc: { id: string }) => {
    documentId.value = doc.id;
    docId.value = doc.id;
    setupSelectionListener(doc.id, r);
    setupScrollListener(doc.id, r);
  };
  docManager.onDocumentOpened?.(onDocOpen);
  // 若文档已加载（如 config.src 预先指定），直接获取并监听
  const activeDoc = docManager.getActiveDocument?.();

const ids = document.getElementById("pdfViewer")
  console.log(ids,'.docManager')
  const container = document.querySelector("embedpdf-container").shadowRoot
  console.log(container );
  if (activeDoc?.id) onDocOpen(activeDoc);




}

function setupScrollListener(id: string, r: PluginRegistry) {
  const scroll = r.getPlugin("scroll")?.provides();
  scroll?.onPageChange?.((ev: { documentId: string; pageNumber: number; totalPages: number }) => {
    if (ev.documentId === id) {
      currentPage.value = ev.pageNumber;
      totalPages.value = ev.totalPages;
    }
  });
}

//建立监听=>获取选区文字
const setupSelectionListener = (docId: string, r: PluginRegistry)=>{
  const selection = r.getPlugin('selection')?.provides();
  const scope = selection?.forDocument(docId);

  // 选区结束时获取
  scope?.onEndSelection?.(async () => {
    const text = await scope.getSelectedText().toPromise();
    const formatted = scope.getFormattedSelection();
    console.log('选区文字:', text);
    formatted?.forEach(sel => {
      console.log(`页 ${sel.pageIndex}:`, sel.rect, sel.textLines);
    });
  });
}

</script>

<style scoped>
.text-processor {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}
.pdf-viewer-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 隐藏 PDFViewer 的 header/toolbar 区域 */
.text-processor :deep(header),
.text-processor :deep(nav),
.text-processor :deep([role="toolbar"]) {
  display: none !important;
}

/* 禁用滚动条：强制隐藏 PDFViewer 内部所有元素的滚动条 */
.pdf-viewer-wrap :deep(*::-webkit-scrollbar) {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.pdf-viewer-wrap :deep(*) {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

/* 去除 PDFViewer 内 #document-content 上的 overflow-hidden 效果 */
:deep(#pdfViewer #document-content .overflow-hidden){
  overflow: visible;
}
:deep(#document-content){
  background: #3dd2b0 !important;
}
.bg-bg-surface{
  background: #4caf50;
}
.pdf-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f8f9fa;
  font-size: 14px;
}

</style>

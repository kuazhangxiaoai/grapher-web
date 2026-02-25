<template>
  <div class="pdf-viewer" ref="viewerRef">
    <div id="pageContainer"></div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch} from "vue";
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const props = defineProps({
  src: {
    type: String,
    default: null,
    required: false
  }
})

const pdfDoc = ref(null)
const pageNum = ref(1)
const totalPageCount = ref(0)
const scale = 1

const loadText = async (pageIndex: number) => {
  const loadingTask = pdfjsLib.getDocument(props.src)
  pdfDoc.value = await loadingTask.promise
  totalPages.value = pdfDoc.value.numPages
  const page = await pdfDoc.value.getPage(pageIndex)
  renderPage(page, pageNum.value)
}
//渲染单页PDF
async function renderPage(page: any) {
  const viewport = page.getViewport({ scale });
  const outputScale = window.devicePixelRatio || 1;

  const pageContainer: HTMLElement = document.getElementById("pageContainer")!;
  pageContainer.className = "page-container";
  pageContainer.style.position = "relative";
  pageContainer.style.display = "inline-block";
  pageContainer.style.margin = "20px auto";
  pageContainer.style.width = viewport.width + "px";
  pageContainer.style.height = viewport.height + "px";
  pageContainer.innerHTML = "";

  // Canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";
  pageContainer.appendChild(canvas);

  // Text Layer
  const textLayerDiv: HTMLElement = document.createElement("div");
  textLayerDiv.className = "textLayer";
  textLayerDiv.style.position = "absolute";
  textLayerDiv.style.top = "0";
  textLayerDiv.style.left = "0";
  textLayerDiv.style.width = viewport.width + "px";
  textLayerDiv.style.height = viewport.height + "px";
  textLayerDiv.style.zIndex = "5";
  // 保持文字可选中
  textLayerDiv.style.pointerEvents = "auto";
  pageContainer.appendChild(textLayerDiv);

  // Highlight Layer
  const highlightLayerDiv: HTMLElement = document.createElement("div");
  highlightLayerDiv.className = "highlightLayer";
  highlightLayerDiv.style.position = "absolute";
  highlightLayerDiv.style.top = "0";
  highlightLayerDiv.style.left = "0";
  highlightLayerDiv.style.width = viewport.width + "px";
  highlightLayerDiv.style.height = viewport.height + "px";
  highlightLayerDiv.style.pointerEvents = "none"; // 允许鼠标事件穿透到文字层
  highlightLayerDiv.style.zIndex = "10";
  highlightLayerDiv.style.background = "rgba(0,0,0,0)";
  pageContainer.appendChild(highlightLayerDiv);

  // Canvas 渲染
  const renderContext = {
    canvasContext: context,
    viewport,
    transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
  };
  await page.render(renderContext).promise;

  // Text Layer 渲染
  const textContent = await page.getTextContent();
  const textLayer = pdfjsLib.renderTextLayer({
    textContent,
    container: textLayerDiv,
    viewport,
    textDivs: [],
    enhanceTextSelection: true,
  });
  await textLayer.promise;

  // 渲染高亮层
  //renderHightLightLayer(textContent, viewport, highlightLayerDiv, rects.value, index);
}

onMounted(() => {
  if(props.src != null) loadText(1)
})


</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  background-color: #3DD2B0;
}

</style>

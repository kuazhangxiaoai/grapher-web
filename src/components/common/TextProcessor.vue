<template>
  <div class="pdf-viewer" ref="viewerRef">
    <div id="pageContainer"></div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch} from "vue";
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = "/package/pdf.worker.min.js"

const props = defineProps({
  src: {
    type: String,
    default: null,
    required: false
  }
})

let pdfInstance = null
const pageNum = ref(1)
const totalPageCount = ref(0)
const scale = 1

const loadText = async (pageIndex: number) => {
  const loadingTask = pdfjsLib.getDocument({
    url: props.src,
    cMapUrl: "/package/cmaps/",
    cMapPacked: true,
    withCredentials: false
  })
  pdfInstance = await loadingTask.promise;
  const totalPages = await pdfInstance.numPages;
  const page = await pdfInstance.getPage(pageIndex);
  renderPage(page)
}

// 渲染单页 PDF：canvas 与 text 层同尺寸叠放，避免错位与“重影”
async function renderPage(page: any) {
  const scale = 1;
  const viewport = page.getViewport({ scale });
  const outputScale = window.devicePixelRatio || 1;

  const pageContainer: HTMLElement = document.getElementById("pageContainer")!;
  pageContainer.className = "page-container";
  pageContainer.style.position = "relative";
  pageContainer.style.display = "inline-block";
  pageContainer.style.margin = "20px auto";
  pageContainer.style.width = viewport.width + "px";
  pageContainer.style.height = viewport.height + "px";
  pageContainer.style.overflow = "hidden";
  pageContainer.innerHTML = "";

  // 1) Canvas：绝对定位铺满容器，与 text 层完全重合
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.className = "pdf-page-canvas";
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";
  canvas.style.display = "block";
  pageContainer.appendChild(canvas);

  // 2) Text Layer：与 canvas 同尺寸叠放，使用 pdf.js 官方类名以便样式生效
  const textLayerDiv: HTMLElement = document.createElement("div");
  textLayerDiv.className = "textLayer";
  textLayerDiv.style.position = "absolute";
  textLayerDiv.style.left = "0";
  textLayerDiv.style.top = "0";
  textLayerDiv.style.width = viewport.width + "px";
  textLayerDiv.style.height = viewport.height + "px";
  textLayerDiv.style.pointerEvents = "auto";
  pageContainer.appendChild(textLayerDiv);

  // 3) Highlight Layer
  const highlightLayerDiv: HTMLElement = document.createElement("div");
  highlightLayerDiv.className = "highlightLayer";
  highlightLayerDiv.style.position = "absolute";
  highlightLayerDiv.style.left = "0";
  highlightLayerDiv.style.top = "0";
  highlightLayerDiv.style.width = viewport.width + "px";
  highlightLayerDiv.style.height = viewport.height + "px";
  highlightLayerDiv.style.pointerEvents = "none";
  highlightLayerDiv.style.zIndex = "10";
  pageContainer.appendChild(highlightLayerDiv);

  // 先渲染 Canvas
  const renderContext = {
    canvasContext: context,
    viewport,
    transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
  };
  await page.render(renderContext).promise;

  // 再渲染 Text Layer（使用同一 viewport，保证与 canvas 重合）
  const textContent = await page.getTextContent();
  const textLayer = pdfjsLib.renderTextLayer({
    textContent,
    container: textLayerDiv,
    viewport,
    textDivs: [],
    enhanceTextSelection: true,
  });
  await textLayer.promise;
}

onMounted(() => {
  console.log(props.src)
  if(props.src != null) loadText(1)
})


</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  background-color: #f5f5f5;
}

.page-container {
  margin: 20px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  position: relative;
}

/* canvas 与 text 层同尺寸叠放，由 JS 设置 position:absolute + 相同宽高 */
.pdf-page-canvas {
  margin: 0;
}

/* 文本层：与 pdf.js 官方样式一致，保证与 canvas 重合；:deep 使动态插入的 span 也生效，避免重影 */
:deep(.textLayer) {
  position: absolute;
  text-align: initial;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 1;
  line-height: 1;
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
  pointer-events: auto;
}

:deep(.textLayer span),
:deep(.textLayer br) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

:deep(.textLayer span.markedContent) {
  top: 0;
  height: 0;
}

:deep(.textLayer ::selection) {
  background: rgba(0, 0, 255, 0.3);
}

.highlightBlock {
  border-radius: 2px;
  pointer-events: none;
  cursor: pointer;
}
</style>


<template>
  <div id="highlight" class="highlightLayer"></div>
</template>
<script setup lang="ts">
import {ref,onMounted, watch} from "vue"
import type {MarkColor, Rect} from "@/configs/text";

const props = defineProps<{
  documentId:string,
  currentPage: number,
}>();

const rectangle = ref<Rect>(null);

// 保存每个矩形的监听器引用，clear 时用 removeEventListener 移除
const rectangleListeners: { element: HTMLElement; handler: (e: MouseEvent) => void }[] = [];

const handleMouseMove = (e: MouseEvent, element: HTMLElement) => {
  const containerRect = element.getBoundingClientRect();
  const mouseX = e.clientX - containerRect.left;
  const mouseY = e.clientY - containerRect.top;
  element.style.cursor = "pointer";
};

const drawline = (x0:number, y0:number, length: number, lineness: number, color: MarkColor) => {
  const layerElem = document.getElementById("highlight");
  const lineElem = document.createElement("div");
  lineElem.className = "line";
  lineElem.style.position = "absolute";
  lineElem.style.pointerEvents="none";
  lineElem.style.backgroundColor = "transparent";
  lineElem.style.borderBottom = `2px solid ${color || "#3dd2b0"}`;
  lineElem.style.left = x0 + "px";
  lineElem.style.top = y0 + "px";
  lineElem.style.width = length + "px";
  lineElem.style.height = lineness + "px";
  layerElem.appendChild(lineElem);
}

const drawRectangle = (x0:number, y0:number, width: number, height: number, lineness: number, color: MarkColor) => {
  const layerElem = document.getElementById("highlight");
  const rectangleElem = document.createElement("div");
  rectangleElem.className = "rectangle";
  rectangleElem.style.position = "absolute";
  rectangleElem.style.pointerEvents = "auto";
  rectangleElem.style.backgroundColor = color;
  //rectangleElem.style.borderBottom = `2px solid ${color || "#3dd2b0"}`;
  rectangleElem.style.left = x0 + "px";
  rectangleElem.style.top = y0 + "px";
  rectangleElem.style.width = width + "px";
  rectangleElem.style.height = height + "px";
  rectangleElem.style.cursor = "pointer";
  const handler = (e: MouseEvent) => handleMouseMove(e, rectangleElem);
  rectangleElem.addEventListener("mousemove", handler);
  rectangleListeners.push({ element: rectangleElem, handler });
  layerElem.appendChild(rectangleElem);
  rectangle.value = {
    x0: x0,
    y0: y0,
    width: width,
    height: height,
  }
}

const clear = () => {
  const layerElem = document.getElementById("highlight");
  rectangleListeners.forEach(({ element, handler }) => {
    element.removeEventListener("mousemove", handler);
  });
  rectangleListeners.length = 0;
  layerElem.innerHTML = "";
}

onMounted(() => {
  // 不在 document 上监听，只在每个 rectangleElem 上监听，这样只在矩形范围内触发
})

defineExpose({drawline, drawRectangle, clear})
</script>


<style scoped lang="scss">
.highlightLayer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.0);
}

.line{
  border-radius: 2px;
  cursor: pointer;
}

.rectangle {
  pointer-events: auto;
  cursor: pointer;
}

</style>
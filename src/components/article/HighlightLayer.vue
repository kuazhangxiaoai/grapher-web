<template>
  <!-- 父层穿透：容器不参与命中，只有 .rectangle 子元素可点击 -->
  <div id="highlight" class="highlightLayer" style="pointer-events: none">
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import type { Rect } from "@/configs/text";
import { MarkType, MarkColor } from "@/configs/text";

const props = defineProps<{
  documentId:string,
  currentPage: number,
}>();

const rectangle = ref<Rect>(null);

// 保存每个矩形的监听器引用，clear 时用 removeEventListener 移除
const rectangleListeners: { element: HTMLElement; handler: (e: MouseEvent) => void }[] = [];
const lineListeners: { element: HTMLElement; handler: (e: MouseEvent) => void }[] = [];

const handleRectangleMouseMove = (e: MouseEvent, element: HTMLElement) => {
  element.style.cursor = "pointer";
};

const handleLineMouseMove = (e: MouseEvent, element: HTMLElement) => {
  const containerRect = element.getBoundingClientRect();
  const mouseX = e.clientX - containerRect.left;
  const mouseY = e.clientY - containerRect.top;

  const width = containerRect.width;
  const height = containerRect.height;

  if(mouseX > 0 && mouseX < width && mouseY > -30 && mouseY < height)
  {
    document.getElementById("highlight").style.cursor = "pointer";
  }
};

const drawLine = (x0:number, y0:number, length: number, lineness: number, color: MarkColor) => {
  const layerElem = document.getElementById("highlight");
  const lineElem = document.createElement("div");
  lineElem.className = "line";
  lineElem.style.position = "absolute";
  lineElem.style.backgroundColor = "transparent";
  lineElem.style.borderBottom = `2px solid ${color || "#3dd2b0"}`;
  lineElem.style.left = x0 + "px";
  lineElem.style.top = y0 + "px";
  lineElem.style.width = length + "px";
  lineElem.style.height = lineness + "px";
  const handler = (e: MouseEvent) => handleLineMouseMove(e, lineElem);
  lineListeners.push({element: lineElem, handler});
  layerElem.addEventListener("mousemove", handler);
  layerElem.appendChild(lineElem);
}

const drawRectangle = (x0:number, y0:number, width: number, height: number, lineness: number, color: MarkColor, type: MarkType) => {
  const layerElem = document.getElementById("highlight");
  const rectangleElem = document.createElement("div");
  rectangleElem.id = `${type}-${x0}-${y0}-${width}-${height}`;
  rectangleElem.className = "rectangle";
  rectangleElem.style.position = "absolute";
  rectangleElem.style.pointerEvents = "auto";
  const colorValue = typeof color === "string" ? color : (color ?? "#3dd2b0");
  // 从上到下仅 80%-90% 区段染色，其余透明
  rectangleElem.style.background = `linear-gradient(to bottom, transparent 0%, transparent 80%, ${colorValue} 80%, ${colorValue} 90%, transparent 90%, transparent 100%)`;
  rectangleElem.style.left = x0 + "px";
  rectangleElem.style.top = y0 + "px";
  rectangleElem.style.width = width + "px";
  rectangleElem.style.height = height + "px";
  rectangleElem.style.cursor = "pointer";
  const handler = (e: MouseEvent) => handleRectangleMouseMove(e, rectangleElem);
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

const removeRectangle = (x0:number, y0:number, width:number, height:number, type: MarkType) => {
  const id = `${type}-${x0}-${y0}-${width}-${height}`
  const layerElem = document.getElementById("highlight");
  const rectangleElem = document.getElementById(id)
  layerElem.removeChild(rectangleElem)
}

const clear = () => {
  const layerElem = document.getElementById("highlight");
  rectangleListeners.forEach(({ element, handler }) => {
    element.removeEventListener("mousemove", handler);
  });
  lineListeners.forEach(({ element, handler }) => {
    element.removeEventListener("mousemove", handler);
  })
  rectangleListeners.length = 0;
  lineListeners.length = 0;
  layerElem.innerHTML = "";
}

const clearEditing = () => {
  const layerElem = document.getElementById("highlight");
  Array.from(layerElem.children).forEach((child) => {
    const el = child as HTMLElement;
    const id = el.id;
    const eltype = Number(id.split("-")[0]);
    if (eltype === MarkType.editing && id) {
      //delete
      el.remove();
    }
  });
}

onMounted(() => {
  // 不在 document 上监听，只在每个 rectangleElem 上监听，这样只在矩形范围内触发
})

defineExpose({drawLine, drawRectangle, removeRectangle, clear, clearEditing});
</script>


<style scoped lang="scss">
/* 父层穿透：不参与命中，点击/悬停会落到下层或子元素 */
.highlightLayer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.0);
}

.line {
  border-radius: 2px;
  cursor: pointer;
}

.rectangle {
  pointer-events: auto;
  cursor: pointer;
}

</style>
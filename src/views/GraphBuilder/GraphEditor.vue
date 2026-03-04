<template>
  <div class="graph-editor">
    <div class="content-wrapper">{{ content }}</div>
    <EditorContainer
      ref="graphContainerRef"
      class="graph-canvas"
      :nodes="props.nodes"
      :edges="props.edges"
      @add-entity="onAddEntity"
      @node-drag-end="onNodeDragEnd"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef, computed } from "vue";
import GraphContainer from "@/components/graph/GraphContainer.vue";
import type { Mark } from "@/configs/text";
import EditorContainer from "@/components/editor/EditorContainer.vue";

const graphContainerRef = ref(null);

const emit = defineEmits<{
  (e: "add-entity", position: { x: number; y: number }): void;
  (e: "node-drag-end", data: { nodeId: string | number; position: { x: number; y: number }; data?: unknown }): void;
}>();

const props = withDefaults(
    defineProps<{
      nodes?: Array<{
        id: string | number;
        name?: string;
        type?: string;
        x?: number;
        y?: number;
        properties?: unknown;
      }>;
      edges?: Array<{
        source: string | number;
        target: string | number;
        data?: { name?: string; type?: string };
      }>;
      marks: Array<Mark> | null;
      articleId?: string | null;
      topicId?: string | null;
      domainId?: string | null;
    }>(),
    {
      nodes: () => [],
      edges: () => [],
      marks: () => null,
    }
);

// 将 marks 中的 content 字段拼接成一个字符串
const content = computed(() => {
  if (!props.marks || props.marks.length === 0) return "";
  return props.marks
    .map((mark) => mark.content ?? "")
    .join("");
});

const onAddEntity = (position: { x: number; y: number }) => {
  emit("add-entity", position);
};

const onNodeDragEnd = (data: { nodeId: string | number; position: { x: number; y: number }; data?: unknown }) => {
  emit("node-drag-end", data);
};

//初始化图谱
const initGraph = () => {

}
</script>



<style scoped lang="scss">
.graph-editor {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 12%;
  left: 12%;
  width: 75%;
  height: 75%;
  overflow: hidden;
  background-color: #f5f8fb;
  background-image: radial-gradient(#e2dfdf 1px, transparent 1px);
  background-size: 20px 20px;
  border: #3dd2b0 3px solid;
  border-radius: 15px;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.content-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 5%;
  background-color: #4caf50;
}

</style>
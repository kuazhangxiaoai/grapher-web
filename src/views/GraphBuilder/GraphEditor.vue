<template>
  <div class="graph-editor">
    <div class="content-wrapper">{{ content }}</div>
    <div class="editor-area">
      <LeftTemplatePanel class="left-template-panel" :node-templates="nodeTemplates" />
      <EditorContainer
        ref="graphContainerRef"
        class="graph-canvas"
        :nodes="props.nodes"
        :edges="props.edges"
        @add-entity-from-template="onAddEntityFromTemplate"
        @node-drag-end="onNodeDragEnd"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @graph-click="onGraphClick"
        @submit="onSubmit"
        @clear="onClear"
        @quit="onQuit"
      />
      <RightPropertyPanel
        class="right-property-panel"
        v-if="showPanel"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :node-template-properties="nodeTemplateProperties"
        :nodes="props.nodes"
        @update:node="onUpdateNode"
        @update:edge="onUpdateEdge"
        @cancel="handleRightPropertyPanelCancel"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef, computed } from "vue";
import type { Mark } from "@/configs/text";
import EditorContainer from "@/components/editor/EditorContainer.vue";
import LeftTemplatePanel from "@/components/editor/LeftTemplatePanel.vue";
import RightPropertyPanel from "@/components/editor/RightPropertyPanel.vue";
import type { NodeTemplate } from "@/configs/graph";
import type { NodeProperty } from "@/configs/graph";
import projectService from "@/services/graph";

const graphContainerRef = ref(null);
const showPanel = ref(false);
const emit = defineEmits<{
  (e: "add-entity-from-template", payload: { position: { x: number; y: number }; template: NodeTemplate }): void;
  (e: "node-drag-end", data: { nodeId: string | number; position: { x: number; y: number }; data?: unknown }): void;
  (e: "node-click", node: unknown): void;
  (e: "edge-click", edge: unknown): void;
  (e: "graph-click"): void;
  (e: "update:node", node: unknown): void;
  (e: "update:edge", edge: unknown): void;
  (e: "submit"): void;
  (e: "clear"): void;
  (e: "quit"): void;
  (e: "close-right"): void;
}>();

const props = withDefaults(
    defineProps<{
      nodes?: Array<{
        id: string | number;
        name?: string;
        type?: string;
        x?: number;
        y?: number;
        color?: string;
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
const nodeTemplates = ref<NodeTemplate[]>([]);
const selectedNode = ref<Record<string, unknown> | null>(null);
const selectedEdge = ref<Record<string, unknown> | null>(null);
const nodeTemplateProperties = ref<NodeProperty[]>([]);

const onAddEntityFromTemplate = (payload: { position: { x: number; y: number }; template: NodeTemplate }) => {
  emit("add-entity-from-template", payload);
  // 选中由父组件添加的临时节点，在 index 中通过 setSelectedNode 设置
};

const onNodeDragEnd = (data: { nodeId: string | number; position: { x: number; y: number }; data?: unknown }) => {
  emit("node-drag-end", data);
};

const onNodeClick = (node: Record<string, unknown>) => {
  showPanel.value = true;
  selectedEdge.value = null;
  selectedNode.value = node;
  const templateId = node.nodeTemplateId ?? node.type;
  if (templateId && props.topicId) {
    nodeTemplateProperties.value = [];
    projectService.getNodeTemplateProperties(String(templateId)).then((res) => {
      if (res?.data?.length) {
        nodeTemplateProperties.value = res.data.map((item: { propertyKey: string; propertyType: string }) => ({
          key: item.propertyKey,
          type: item.propertyType,
          value: (node.properties as NodeProperty[] | undefined)?.find((p) => p.key === item.propertyKey)?.value ?? "",
        }));
      }
    });
  } else {
    nodeTemplateProperties.value = (node.properties as NodeProperty[] | undefined) ?? [];
  }
  emit("node-click", node);
};

const onEdgeClick = (edge: Record<string, unknown>) => {
  showPanel.value = true;
  selectedNode.value = null;
  selectedEdge.value = edge;
  emit("edge-click", edge);
};

const onGraphClick = () => {
  selectedNode.value = null;
  selectedEdge.value = null;
  emit("graph-click");
};

const onUpdateNode = (node: unknown) => {
  emit("update:node", node);
};

const onUpdateEdge = (edge: unknown) => {
  emit("update:edge", edge);
};

// 顶部工具条事件向上抛出，由父级（GraphBuilder/index）决定具体行为
const onSubmit = () => {
  emit("submit");
};

const onClear = () => {
  emit("clear");
};

const onQuit = () => {
  emit("quit");
};

/** 关闭右侧属性面板（清除选中并隐藏面板） */
const handleClosePropertyPanel = () => {
  showPanel.value = false;
  selectedNode.value = null;
  selectedEdge.value = null;
  emit("close-right");
};

/** 由父组件在创建节点后调用：选中指定节点并显示右侧属性面板，同时拉取模板属性 */
function setSelectedNode(node: Record<string, unknown> | null) {
  if (!node) {
    selectedNode.value = null;
    selectedEdge.value = null;
    return;
  }
  showPanel.value = true;
  selectedEdge.value = null;
  selectedNode.value = node;
  const templateId = node.nodeTemplateId ?? node.type;
  if (templateId && props.topicId) {
    nodeTemplateProperties.value = [];
    projectService.getNodeTemplateProperties(String(templateId)).then((res) => {
      if (res?.data?.length) {
        nodeTemplateProperties.value = res.data.map((item: { propertyKey: string; propertyType: string }) => ({
          key: item.propertyKey,
          type: item.propertyType,
          value: (node.properties as NodeProperty[] | undefined)?.find((p) => p.key === item.propertyKey)?.value ?? "",
        }));
      }
    });
  } else {
    nodeTemplateProperties.value = (node.properties as NodeProperty[] | undefined) ?? [];
  }
}

const handleRightPropertyPanelCancel = () => {
  handleClosePropertyPanel();
};

defineExpose({
  handleClosePropertyPanel,
  setSelectedNode,
});

onMounted(() => {
  nodeTemplates.value = []
  projectService.getNodeTypes(props.topicId).then((response) => {
    response.data.forEach((item) => {
      const nodeTemplate: NodeTemplate = {
        id: item.nodeTemplateId,
        name:item.nodeTemplateName,
        color: item.nodeTemplateColor
      }
      nodeTemplates.value.push(nodeTemplate);
    })
  })
})


</script>



<style scoped lang="scss">
.graph-editor {
  flex: 1;
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: stretch;
  justify-items: stretch;
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
  min-height: 0;
}

.editor-area {
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.left-template-panel {
  flex: 0 0 220px;
  height: 100%;
}

.right-property-panel {
  flex: 0 0 260px;
  height: 100%;
}

.editor-area .graph-canvas {
  flex: 1;
  height: 100%;
  min-width: 0;
}

.content-wrapper {
  width: 100%;
  background-color: #4caf50;
  color: #fff;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 16px;
  max-height: 120px;
  overflow: auto;
}

</style>
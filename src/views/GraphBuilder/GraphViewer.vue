<template>
  <div class="article-graph">
    <div ref="graphRef" class="graph-canvas"></div>
    <div class="zoom-controls">
      <button class="zoom-btn" @click="zoomIn">
        <img src="@/assets/images/放大.png" alt="放大" class="zoom-icon" />
      </button>
      <div class="zoom-level">{{ zoomLevel }}%</div>
      <button class="zoom-btn" @click="zoomOut">
        <img src="@/assets/images/缩小.png" alt="缩小" class="zoom-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from "vue";
import { Graph } from "@antv/g6";

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
    articleId?: string | null;
    topicId?: string | null;
    domainId?: string | null;
    level?: number;
  }>(),
  {
    nodes: () => [],
    edges: () => [],
    level: () => 0
  }
);

const graphRef = ref<HTMLDivElement | null>(null);
const graph = shallowRef<InstanceType<typeof Graph> | null>(null);
const zoomLevel = ref(100);

// 圆形节点尺寸（直径）
const CIRCLE_SIZE = 40;

const formatNodes = () => {
  if (!graphRef.value) return [];
  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

  return props.nodes.map((node) => {
    const nodeX = node.x ?? width / 2;
    const nodeY = node.y ?? height / 2;
    const nodeId = typeof node.id === "string" ? node.id : String(node.id);

    return {
      id: nodeId,
      type: "circle",
      data: {
        name: node.name,
        type: node.type,
        properties: node.properties || [],
      },
      style: {
        x: nodeX,
        y: nodeY,
        fill: "#fff",
        stroke: "#43D7B5",
        lineWidth: 2,
        size: CIRCLE_SIZE,
        shadowColor: "rgba(78,89,105,0.18)",
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 8,
      },
    };
  });
};

// 仅创建图实例（只调用一次，避免 destroy 后异步 render 报错）
const createGraph = () => {
  if (!graphRef.value || graph.value) return;

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

  const graphInstance = new Graph({
    container: graphRef.value,
    width,
    height,
    data: { nodes: [], edges: [] },
    node: {
      type: "circle",
      style: {
        fill: "#fff",
        stroke: "#43D7B5",
        lineWidth: 2,
        size: CIRCLE_SIZE,
        shadowColor: "rgba(78,89,105,0.18)",
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 8,
        labelText: (data) => data.data?.name || "节点",
        labelPlacement: "bottom",
        labelBackground: false,
        labelFontSize: 12,
        labelFill: "#333",
      },
    },
    edge: {
      type: (data) => {
        const source = data.source;
        const target = data.target;
        if (String(source) === String(target)) return "cubic";
        const hasReverseEdge = props.edges.some(
          (e) => String(e.source) === String(target) && String(e.target) === String(source)
        );
        return hasReverseEdge ? "quadratic" : "line";
      },
      style: (data) => {
        const style: Record<string, unknown> = {
          lineWidth: 2,
          stroke: "#44D6B6",
          labelText: data.data?.name || "",
          labelPlacement: "center",
          labelBackground: false,
          labelFontSize: 12,
        };
        const relationshipType = (data.data as { type?: string })?.type || "定向";
        if (relationshipType === "定向" || relationshipType === "循环") {
          style.endArrow = true;
        } else if (relationshipType === "双向") {
          style.startArrow = true;
          style.endArrow = true;
        }

        // 双向连线控制点
        if (
          props.edges.some(
            (e) =>
              String(e.source) === String(data.target) &&
              String(e.target) === String(data.source)
          )
        ) {
          const sourceNode = props.nodes.find(
            (n) => String(n.id) === String(data.source)
          );
          const targetNode = props.nodes.find(
            (n) => String(n.id) === String(data.target)
          );
          if (sourceNode && targetNode) {
            const centerX = ((sourceNode.x ?? 0) + (targetNode.x ?? 0)) / 2;
            const centerY = ((sourceNode.y ?? 0) + (targetNode.y ?? 0)) / 2;
            style.controlPoints =
              String(data.source) < String(data.target)
                ? [{ x: centerX, y: centerY - 30 }]
                : [{ x: centerX, y: centerY + 30 }];
          }
        }

        // 自环边控制点
        if (String(data.source) === String(data.target)) {
          const sourceNode = props.nodes.find(
            (n) => String(n.id) === String(data.source)
          );
          if (sourceNode) {
            const nodeX = sourceNode.x ?? 0;
            const nodeY = sourceNode.y ?? 0;
            style.controlPoints = [
              { x: nodeX + 80, y: nodeY - 160 },
              { x: nodeX - 80, y: nodeY - 160 },
            ];
          }
        }

        return style;
      },
    },
    layout: false,
    plugins: [
      {
        type: "tooltip",
        trigger: "hover",
        getContent: (e) => {
          const model = e.item?.model;
          if (!model) return "";
          const data = (model.data || {}) as { type?: string; name?: string };
          const type = data.type || "人物";
          const name = data.name || "未命名";
          return `<div style="padding: 8px;">
            <div style="font-weight: bold;">${type}</div>
            <div>${name}</div>
          </div>`;
        },
      },
    ],
    // 仅查看模式：只有缩放和拖拽画布，无节点拖拽、无右键菜单
    behaviors: [
      "zoom-canvas",
      {
        type: "drag-canvas",
        key: "drag-canvas",
      },
    ],
    animation: true,
    autoResize: true,
  });

  graph.value = graphInstance;
};

// 更新图数据并渲染（数据变化时只更新数据，不销毁图实例）
const updateGraphData = () => {
  if (!graphRef.value || !graph.value || graph.value.destroyed) return;
  const formattedNodes = formatNodes();
  graph.value.setData({ nodes: formattedNodes, edges: props.edges });
  graph.value.render();
};

const zoomIn = () => {
  if (!graph.value || graph.value.destroyed) return;
  graph.value.zoomBy?.(1.2);
  const zoom = graph.value.getZoom?.() ?? 1;
  zoomLevel.value = Math.round(zoom * 100);
};

const zoomOut = () => {
  if (!graph.value || graph.value.destroyed) return;
  graph.value.zoomBy?.(0.8);
  const zoom = graph.value.getZoom?.() ?? 1;
  zoomLevel.value = Math.round(zoom * 100);
};

watch(
  () => [props.nodes, props.edges],
  () => {
    if (graph.value) updateGraphData();
    else if (graphRef.value) createGraph(), updateGraphData();
  },
  { deep: true }
);

onMounted(() => {
  createGraph();
  updateGraphData();
});

onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy();
    graph.value = null;
  }
});
</script>

<style scoped lang="scss">
/* 背景与 GraphContainer 一致 */
.article-graph {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f5f8fb;
  background-image: radial-gradient(#e2dfdf 1px, transparent 1px);
  background-size: 20px 20px;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.zoom-controls {
  position: absolute;
  bottom: 25px;
  right: 28px;
  display: flex;
  align-items: center;
  border-radius: 40px;
  padding: 1px;
  background: #ffffff;
  border: 0.5px solid rgba(226, 226, 226, 1);
  box-shadow: 0px 2px 8px rgba(78, 89, 105, 0.18);
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-icon {
  width: 18px;
  height: 18px;
}

.zoom-level {
  width: 50px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #333;
  font-weight: bold;
  margin: 0 2px;
  min-width: 50px;
}
</style>

<template>
  <div
    class="graph-container"
    @contextmenu="handleContextMenu"
    @click="handleClick"
    @mousemove="handleMouseMove"
  >
    <div ref="graphRef" class="graph-canvas"></div>
    <GraphContextMenu
      v-if="showContextMenu"
      :position="contextMenuPosition"
      :is-node-click="isNodeClick"
      @add-entity="handleAddEntity"
      @create-relationship="handleCreateRelationship"
      @close="showContextMenu = false"
    />
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

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, shallowRef } from "vue";
import { Graph } from "@antv/g6";
import GraphContextMenu from "./GraphContextMenu.vue";

// 内边距配置常量
const PADDING = {
  width: 20,
  label: 28,
  vertical: 18,
  horizontal: 12,
  baseHeight: 60,
  lineHeight: 18,
  minWidth: 180,
  maxWidth: 400,
  minHeight: 70,
  maxHeight: 400,
};

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  edges: {
    type: Array,
    default: () => [],
  },
  showToolbar: {
    type: Boolean,
    default: true,
  },
  isConnecting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "add-entity",
  "create-relationship",
  "node-click",
  "edge-click",
  "graph-click",
  "node-drag",
  "node-drag-end",
  "connection-complete",
]);

// 临时连线相关状态
const tempEdgeId = ref(null);
const virtualNodeId = ref(null);
const sourceNodeId = ref(null);
const targetNodeId = ref(null);
const isConnectingMode = ref(false);
const mouseOverNodeId = ref(null);
const lastMousePos = ref({ x: 0, y: 0 });
const pendingConnection = ref(null);

const graphRef = ref(null);
const graph = shallowRef(null);
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const clickCanvasPosition = ref({ x: 0, y: 0 });
const isNodeClick = ref(false);
const zoomLevel = ref(100);

// 保存缩放状态
const savedZoom = ref(1);
const savedCenter = ref({ x: 0, y: 0 });

// 保存节点位置的本地状态
const nodePositions = ref(new Map());

// 跟踪是否正在拖拽节点
const isDragging = ref(false);
const justFinishedDragging = ref(false);
const dragStartPosition = ref({ x: 0, y: 0 });
const dragStartNodePosition = ref({ x: 0, y: 0 });
const dragStartNodeSize = ref({ width: 0, height: 0 });
const dragStartZoom = ref(1);

const DRAG_THRESHOLD = 5;
const clickedNodeId = ref(null);
const selectedNodeId = ref(null);

// 标记是否正在应用保存的位置
const isApplyingSavedPositions = ref(false);

// 计算文本宽度
const calculateTextWidth = (text, fontSize = 12) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px Arial, sans-serif`;
  return context.measureText(text).width;
};

// 计算节点所需尺寸
const calculateNodeSize = (nodeData) => {
  const data = nodeData.data || {};
  const name = data.name || "未命名";
  const properties = data.properties || {};

  const nameFontSize = 14;
  const nameWidth = calculateTextWidth(name, nameFontSize) + PADDING.width * 2;

  let maxPropertyWidth = 0;

  if (Array.isArray(properties)) {
    properties.forEach((property, index) => {
      if (typeof property === "object" && property !== null) {
        const propName = property.name || `属性${index + 1}`;
        const propType = property.type || "string";
        const propText = `${propName}: ${propType}`;
        const propWidth = calculateTextWidth(propText) + PADDING.width * 2;
        maxPropertyWidth = Math.max(maxPropertyWidth, propWidth);
      } else {
        const propText = `属性${index + 1}: ${property}`;
        const propWidth = calculateTextWidth(propText) + PADDING.width * 2;
        maxPropertyWidth = Math.max(maxPropertyWidth, propWidth);
      }
    });
  } else if (typeof properties === "object" && properties !== null) {
    Object.entries(properties).forEach(([key, value]) => {
      let propText = "";
      if (typeof value === "object" && value !== null && value.type) {
        propText = `${key}: ${value.type}`;
      } else if (typeof value === "object" && value !== null) {
        propText = `${key}: ${JSON.stringify(value)}`;
      } else {
        propText = `${key}: ${value}`;
      }
      const propWidth = calculateTextWidth(propText) + PADDING.width * 2;
      maxPropertyWidth = Math.max(maxPropertyWidth, propWidth);
    });
  }

  const contentWidth = Math.max(nameWidth, maxPropertyWidth);
  const totalWidth = Math.max(
    PADDING.minWidth,
    Math.min(PADDING.maxWidth, contentWidth),
  );

  let propertyLines = 0;

  if (Array.isArray(properties)) {
    propertyLines = properties.length;
  } else if (typeof properties === "object" && properties !== null) {
    propertyLines = Object.keys(properties).length;
  }

  const contentHeight = PADDING.baseHeight + propertyLines * PADDING.lineHeight;
  const totalHeight = Math.max(
    PADDING.minHeight,
    Math.min(PADDING.maxHeight, contentHeight),
  );

  return {
    width: totalWidth,
    height: totalHeight,
  };
};

// 格式化节点标签文本
const formatLabelText = (data) => {
  const typeMap = {
    string: "文本",
    number: "数字",
    date: "日期",
    boolean: "布尔",
    array: "数组",
    object: "对象",
    integer: "整数",
    float: "浮点数",
    datetime: "日期时间",
  };

  const nodeData = data.data || {};
  const name = nodeData.name || "未命名";
  const properties = nodeData.properties || {};

  let text = `\n${name}\n--------------------------\n`;

  if (Array.isArray(properties)) {
    properties.forEach((property, index) => {
      if (typeof property === "object" && property !== null) {
        const propName = property.name || `属性${index + 1}`;
        const propType = property.type || "string";
        const chineseType = typeMap[propType] || propType;
        text += `${propName}           ${chineseType}\n`;
      } else {
        text += `属性${index + 1}          ${property}\n`;
      }
    });
  } else if (typeof properties === "object" && properties !== null) {
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null && value.type) {
        const chineseType = typeMap[value.type] || value.type;
        text += `${key}          ${chineseType}\n`;
      } else if (typeof value === "object" && value !== null) {
        text += `${key}          ${JSON.stringify(value)}\n`;
      } else {
        text += `${key}          ${value}\n`;
      }
    });
  } else {
    text += `${properties}\n`;
  }

  return text;
};

function hexToRgba(hex, opacity) {
  const rgbMatch = hex.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const rgbaMatch = hex.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 限制节点位置在画布边界内
const clampNodePosition = (x, y, nodeHalfWidth, nodeHalfHeight) => {
  if (!graph.value || !graphRef.value) return { x, y };

  const canvasWidth = graphRef.value.clientWidth;
  const canvasHeight = graphRef.value.clientHeight;

  try {
    // 获取视口四个角在内部坐标系中的位置
    const topLeft = graph.value.getCanvasByViewport([0, 0]);
    const bottomRight = graph.value.getCanvasByViewport([
      canvasWidth,
      canvasHeight,
    ]);

    // 计算边界
    const minX = topLeft[0] + nodeHalfWidth;
    const maxX = bottomRight[0] - nodeHalfWidth;
    const minY = topLeft[1] + nodeHalfHeight;
    const maxY = bottomRight[1] - nodeHalfHeight;

    // 确保边界有效（当节点太大时，允许节点居中）
    const validMinX = Math.min(minX, maxX);
    const validMaxX = Math.max(minX, maxX);
    const validMinY = Math.min(minY, maxY);
    const validMaxY = Math.max(minY, maxY);

    // 计算中心点（当节点太大时）
    const centerX = (topLeft[0] + bottomRight[0]) / 2;
    const centerY = (topLeft[1] + bottomRight[1]) / 2;

    // 如果节点太大无法完全显示，则居中显示
    if (nodeHalfWidth * 2 > canvasWidth / graph.value.getZoom()) {
      return { x: centerX, y: Math.max(validMinY, Math.min(validMaxY, y)) };
    }

    if (nodeHalfHeight * 2 > canvasHeight / graph.value.getZoom()) {
      return { x: Math.max(validMinX, Math.min(validMaxX, x)), y: centerY };
    }

    return {
      x: Math.max(validMinX, Math.min(validMaxX, x)),
      y: Math.max(validMinY, Math.min(validMaxY, y)),
    };
  } catch (error) {
    console.warn("边界计算失败:", error);
    return { x, y };
  }
};

// 检查和修正所有节点位置
const validateAllNodePositions = () => {
  if (!graph.value || !graphRef.value) return false;

  try {
    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];
    let needUpdate = false;

    const updatedNodes = nodes.map((node) => {
      if (node.id && node.id.toString().startsWith("virtual-")) return node;

      const nodeSize = node.style.size || [180, 100];
      const halfWidth = nodeSize[0] / 2;
      const halfHeight = nodeSize[1] / 2;

      const clamped = clampNodePosition(
        node.style.x,
        node.style.y,
        halfWidth,
        halfHeight,
      );

      if (clamped.x !== node.style.x || clamped.y !== node.style.y) {
        needUpdate = true;
        return {
          ...node,
          style: {
            ...node.style,
            x: clamped.x,
            y: clamped.y,
          },
        };
      }
      return node;
    });

    if (needUpdate) {
      graph.value.setData({
        ...currentData,
        nodes: updatedNodes,
      });
      graph.value.render();
    }

    return needUpdate;
  } catch (error) {
    console.warn("节点位置验证失败:", error);
    return false;
  }
};

// 应用保存的节点位置
const applySavedNodePositions = () => {
  if (!graph.value || nodePositions.value.size === 0) return false;

  isApplyingSavedPositions.value = true;

  try {
    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];
    let needUpdate = false;

    const updatedNodes = nodes.map((node) => {
      if (node.id && node.id.toString().startsWith("virtual-")) return node;

      const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
      if (nodePositions.value.has(nodeId)) {
        const savedPos = nodePositions.value.get(nodeId);
        if (savedPos.x !== node.style.x || savedPos.y !== node.style.y) {
          needUpdate = true;
          return {
            ...node,
            style: {
              ...node.style,
              x: savedPos.x,
              y: savedPos.y,
            },
          };
        }
      }
      return node;
    });

    if (needUpdate) {
      graph.value.setData({
        ...currentData,
        nodes: updatedNodes,
      });
      graph.value.render();
    }
  } catch (error) {
    console.warn("应用保存的节点位置失败:", error);
  } finally {
    isApplyingSavedPositions.value = false;
  }

  return true;
};

// 初始化G6图谱
const initGraph = () => {
  console.log("进入initGraph方法");
  if (!graphRef.value) {
    console.log("graphRef.value不存在，退出initGraph方法");
    return;
  }

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;
  console.log("画布尺寸:", { width, height });

  if (graph.value) {
    graph.value.destroy();
    graph.value = null;
  }

  try {
    const formattedNodes = props.nodes.map((node) => {
      let nodeX = node.x || width / 2;
      let nodeY = node.y || height / 2;

      const nodeSize = calculateNodeSize({
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
        },
      });

      const nodeId = typeof node.id === "string" ? node.id : node.id.toString();

      const formattedNode = {
        id: nodeId,
        type: "rect",
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
          backgroundColor: node.backgroundColor || "#43D7B5",
        },
        style: {
          x: nodeX,
          y: nodeY,
          fill: "#fff",
          stroke: node.backgroundColor || "#43D7B5",
          lineWidth: 2,
          radius: 8,
          size: [nodeSize.width, nodeSize.height],
          shadowColor: "rgba(78,89,105,0.25)",
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 8,
        },
      };

      return formattedNode;
    });

    const graphInstance = new Graph({
      container: graphRef.value,
      width: width,
      height: height,
      data: {
        nodes: formattedNodes,
        edges: props.edges,
      },
      node: {
        type: "rect",
        style: {
          fill: "#fff",
          stroke: (data) => {
            return data.data?.backgroundColor || "#43D7B5";
          },
          lineWidth: 2,
          radius: 8,
          size: (data) => {
            const nodeSize = calculateNodeSize(data);
            return [nodeSize.width, nodeSize.height];
          },
          shadowColor: "rgba(78,89,105,0.18)",
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 8,
          labelText: formatLabelText,
          labelPlacement: "center",
          labelBackground: false,
          labelFontSize: (data) => {
            const name = data.data?.name || "";
            if (name.length > 20) return 13;
            if (name.length > 15) return 14;
            return 14;
          },
          labelFill: "#333",
          labelLineHeight: PADDING.lineHeight,
          labelPadding: [PADDING.vertical, PADDING.horizontal],
          labelTextBaseline: "middle",
          labelMaxWidth: (data) => {
            const nodeSize = calculateNodeSize(data);
            return nodeSize.width - PADDING.label;
          },
          cursor: "pointer",
        },
        state: {
          hover: {
            stroke: (data) => {
              return data.data?.backgroundColor || "#43D7B5";
            },
            lineWidth: 2,
          },
          selected: {
            stroke: (data) => {
              return data.data?.backgroundColor || "#43D7B5";
            },
            lineWidth: 2,
            shadowColor: (data) => {
              const baseColor = data.data?.backgroundColor || "#43D7B5";
              return hexToRgba(baseColor, 0.4);
            },
            shadowBlur: 35,
            labelFontSize: (data) => {
              const name = data.data?.name || "";
              if (name.length > 20) return 13;
              if (name.length > 15) return 14;
              return 14;
            },
            labelFill: "#333",
          },
        },
      },
      register: {
        node: {
          rect: {
            shape: "rect",
          },
        },
      },
      edge: {
        type: (data) => {
          const source = data.source;
          const target = data.target;
          if (String(source) === String(target)) {
            return "cubic";
          }
          if (data.id && data.id.toString().startsWith("temp-edge-")) {
            return "line";
          }
          const hasReverseEdge = props.edges.some(
            (edge) => edge.source === target && edge.target === source,
          );
          return hasReverseEdge ? "quadratic" : "line";
        },
        style: (data) => {
          if (data.id && data.id.toString().startsWith("temp-edge-")) {
            const style = {
              lineWidth: 3,
              stroke: "#44D6B6",
              lineDash: [6, 4],
              endArrow: true,
              opacity: 0.9,
              shadowColor: "#44D6B6",
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
            };

            const source = data.source;
            const target = data.target;
            if (String(source) === String(target)) {
              const sourceNode = props.nodes.find(
                (n) => String(n.id) === String(source),
              );
              if (sourceNode) {
                const nodeX = sourceNode.x;
                const nodeY = sourceNode.y;
                style.controlPoints = [
                  { x: nodeX + 80, y: nodeY - 160 },
                  { x: nodeX - 80, y: nodeY - 160 },
                ];
              }
            }
            return style;
          }

          const relationshipType = data.data?.type || "定向";
          const source = data.source;
          const target = data.target;
          const hasReverseEdge = props.edges.some(
            (edge) => edge.source === target && edge.target === source,
          );

          const style = {
            lineWidth: 2,
            stroke: "#44D6B6",
            label: true,
            labelText: data.data?.name || "",
            labelPlacement: "center",
            labelBackground: false,
            labelFontSize: 14,
            cursor: "pointer",
          };

          if (relationshipType === "定向") {
            style.endArrow = true;
          } else if (relationshipType === "双向") {
            style.startArrow = true;
            style.endArrow = true;
          } else if (relationshipType === "循环") {
            style.endArrow = true;
          }

          if (hasReverseEdge) {
            let centerX = 0;
            let centerY = 0;

            const sourceNode = props.nodes.find(
              (node) => String(node.id) === String(source),
            );
            const targetNode = props.nodes.find(
              (node) => String(node.id) === String(target),
            );

            if (sourceNode && targetNode) {
              centerX = (sourceNode.x + targetNode.x) / 2;
              centerY = (sourceNode.y + targetNode.y) / 2;
            } else if (data.sourcePoint && data.targetPoint) {
              centerX = (data.sourcePoint.x + data.targetPoint.x) / 2;
              centerY = (data.sourcePoint.y + data.targetPoint.y) / 2;
            }

            if (source < target) {
              style.controlPoints = [{ x: centerX, y: centerY - 30 }];
            } else {
              style.controlPoints = [{ x: centerX, y: centerY + 30 }];
            }
          }

          if (String(source) === String(target)) {
            const sourceNode = props.nodes.find(
              (node) => String(node.id) === String(source),
            );
            if (sourceNode) {
              const nodeX = sourceNode.x;
              const nodeY = sourceNode.y;
              style.controlPoints = [
                { x: nodeX + 80, y: nodeY - 160 },
                { x: nodeX - 80, y: nodeY - 160 },
              ];
            }
          }

          return style;
        },
        state: {
          selected: {
            lineWidth: 2,
            stroke: "#43D7B5",
            shadowColor: (data) => {
              const baseColor = "#43D7B5";
              return hexToRgba(baseColor, 0.1);
            },
            shadowBlur: 5,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
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
            const data = model.data || {};
            const type = data.type || "人物";
            const name = data.name || "未命名";
            return `<div style="padding: 8px;">
              <div style="font-weight: bold;">${type}</div>
              <div>${name}</div>
            </div>`;
          },
        },
      ],
      behaviors: [
        "zoom-canvas",
        {
          type: "drag-canvas",
        },
        {
          type: "drag-element",
          enable: true,
          options: {
            bounds: false,
          },
        },
      ],
      animation: true,
      autoResize: true,
    });

    graph.value = graphInstance;

    // 渲染图谱
    graph.value.render();

    // 先应用保存的节点位置
    applySavedNodePositions();

    // 再进行边界检查
    setTimeout(() => {
      validateAllNodePositions();
    }, 50);

    restoreViewState();
    bindEvents();
  } catch (error) {
    console.error("初始化G6图谱时出错:", error);
  }
};

// 清除节点选中状态
const clearNodeSelection = () => {
  if (!graph.value) return;
  try {
    const { nodes } = graph.value.getData();
    nodes.forEach((node) => {
      graph.value.setElementState(node.id, []);
    });
  } catch (error) {
    console.error("清除节点选中状态失败:", error);
  }
};

// 清除连线选中状态
const clearEdgesSelection = () => {
  if (!graph.value) return;
  try {
    const { edges } = graph.value.getData();
    edges.forEach((edge) => {
      graph.value.setElementState(edge.id, []);
    });
  } catch (error) {
    console.error("清除连线选中状态失败:", error);
  }
};

// 保存视图状态
const saveViewState = () => {
  if (!graph.value) return;
  try {
    savedZoom.value = graph.value.getZoom ? graph.value.getZoom() : 1;
  } catch (error) {
    console.warn("保存视图状态失败:", error);
  }
};

// 恢复视图状态
const restoreViewState = () => {
  if (!graph.value || savedZoom.value === 1) return;
  try {
    if (graph.value.setZoom) {
      graph.value.setZoom(savedZoom.value);
    } else if (graph.value.zoomTo) {
      const center = [
        graphRef.value.clientWidth / 2,
        graphRef.value.clientHeight / 2,
      ];
      graph.value.zoomTo(savedZoom.value, center);
    }
    zoomLevel.value = Math.round(savedZoom.value * 100);
  } catch (error) {
    console.warn("恢复视图状态失败:", error);
  }
};

// 开始连线
const startConnect = async (nodeId) => {
  console.log("开始连线，源节点:", nodeId);
  if (!graph.value) return;

  sourceNodeId.value = nodeId;
  isConnectingMode.value = true;
  mouseOverNodeId.value = null;

  try {
    const sourceNode = props.nodes.find((n) => String(n.id) === String(nodeId));
    if (!sourceNode) {
      console.error("找不到源节点");
      return;
    }

    const vNodeId = `virtual-${Date.now()}`;
    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];
    const edges = currentData.edges || [];

    const virtualNode = {
      id: vNodeId,
      type: "circle",
      style: {
        x: sourceNode.x + 100,
        y: sourceNode.y,
        size: 1,
        opacity: 0,
        fill: "transparent",
        stroke: "transparent",
        lineWidth: 0,
      },
    };

    const tempId = `temp-edge-${Date.now()}`;
    const tempEdge = {
      id: tempId,
      source: nodeId,
      target: vNodeId,
      style: {
        lineWidth: 3,
        stroke: "#44D6B6",
        lineDash: [6, 4],
        endArrow: true,
        opacity: 0.9,
      },
    };

    await graph.value.setData({
      ...currentData,
      nodes: [...nodes, virtualNode],
      edges: [...edges, tempEdge],
    });

    virtualNodeId.value = vNodeId;
    tempEdgeId.value = tempId;
    graph.value.render();
  } catch (error) {
    console.error("创建临时边失败:", error);
    cancelConnect();
  }
};

// 固定临时边到目标节点
const fixTempEdgeToTarget = async (targetId) => {
  if (!graph.value || !virtualNodeId.value) return;

  try {
    const targetNode = props.nodes.find(
      (n) => String(n.id) === String(targetId),
    );
    if (!targetNode) return;

    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];
    const edges = currentData.edges || [];

    const updatedEdges = edges.map((edge) => {
      if (edge.id === tempEdgeId.value) {
        return {
          ...edge,
          target: targetId,
        };
      }
      return edge;
    });

    const updatedNodes = nodes.filter(
      (node) => node.id !== virtualNodeId.value,
    );

    await graph.value.setData({
      ...currentData,
      nodes: updatedNodes,
      edges: updatedEdges,
    });

    virtualNodeId.value = null;
    graph.value.render();
  } catch (error) {
    console.warn("固定临时边到目标节点失败:", error);
  }
};

// 确认连线
const confirmConnection = async (relationshipData) => {
  console.log("确认连线，关系数据:", relationshipData);

  if (!pendingConnection.value || !graph.value) {
    console.error("没有待确认的连线信息");
    return;
  }

  const { sourceId, targetId } = pendingConnection.value;

  if (!tempEdgeId.value) {
    console.error("临时边不存在");
    return;
  }

  try {
    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];
    const edges = currentData.edges || [];

    const updatedNodes = nodes.filter(
      (node) => node.id !== virtualNodeId.value,
    );

    const updatedEdges = edges.map((edge) => {
      if (edge.id === tempEdgeId.value) {
        const style = {
          lineDash: null,
          stroke: "#44D6B6",
          lineWidth: 2,
          endArrow: true,
          opacity: 1,
        };

        if (String(sourceId) === String(targetId)) {
          const sourceNode = props.nodes.find(
            (n) => String(n.id) === String(sourceId),
          );
          if (sourceNode) {
            const nodeX = sourceNode.x;
            const nodeY = sourceNode.y;
            style.controlPoints = [
              { x: nodeX + 80, y: nodeY - 160 },
              { x: nodeX - 80, y: nodeY - 160 },
            ];
          }
        }

        return {
          ...edge,
          source: sourceId,
          target: targetId,
          data: relationshipData,
          style: style,
        };
      }
      return edge;
    });

    await graph.value.setData({
      ...currentData,
      nodes: updatedNodes,
      edges: updatedEdges,
    });

    graph.value.render();

    emit("connection-complete", {
      source: sourceId,
      target: targetId,
      data: relationshipData,
    });
  } catch (error) {
    console.error("完成连线失败:", error);
  } finally {
    tempEdgeId.value = null;
    virtualNodeId.value = null;
    sourceNodeId.value = null;
    targetNodeId.value = null;
    isConnectingMode.value = false;
    mouseOverNodeId.value = null;
    pendingConnection.value = null;
  }
};

// 取消连线
const cancelConnect = async () => {
  console.log("取消连线");
  pendingConnection.value = null;

  if (tempEdgeId.value && graph.value) {
    try {
      const currentData = graph.value.getData();
      const nodes = currentData.nodes || [];
      const edges = currentData.edges || [];

      const updatedNodes = nodes.filter(
        (node) => node.id !== virtualNodeId.value,
      );
      const updatedEdges = edges.filter((edge) => edge.id !== tempEdgeId.value);

      await graph.value.setData({
        ...currentData,
        nodes: updatedNodes,
        edges: updatedEdges,
      });

      graph.value.render();
    } catch (error) {
      console.error("取消连线失败:", error);
    }
  }

  tempEdgeId.value = null;
  virtualNodeId.value = null;
  sourceNodeId.value = null;
  targetNodeId.value = null;
  isConnectingMode.value = false;
  mouseOverNodeId.value = null;
};

// 更新虚拟节点位置
const updateVirtualNodePosition = (x, y) => {
  if (!graph.value || !virtualNodeId.value) {
    return;
  }

  try {
    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];

    const virtualNodeExists = nodes.some(
      (node) => node.id === virtualNodeId.value,
    );
    if (!virtualNodeExists) {
      virtualNodeId.value = null;
      return;
    }

    const updatedNodes = nodes.map((node) => {
      if (node.id === virtualNodeId.value) {
        const easing = 1;
        const currentX = node.style.x;
        const currentY = node.style.y;
        const newX = currentX + (x - currentX) * easing;
        const newY = currentY + (y - currentY) * easing;

        return {
          ...node,
          style: {
            ...node.style,
            x: newX,
            y: newY,
          },
        };
      }
      return node;
    });

    graph.value.setData({
      ...currentData,
      nodes: updatedNodes,
    });

    graph.value.render();
  } catch (error) {
    console.warn("更新虚拟节点位置失败:", error);
  }
};

// 绑定事件
const bindEvents = () => {
  if (!graph.value) return;

  console.log("=== 开始绑定事件 ===");
  window.addEventListener("resize", handleResize);

  // 节点点击事件
  graph.value.on("node:click", (event) => {
    if (isDragging.value || justFinishedDragging.value) {
      return;
    }

    let nodeId = null;
    let nodeData = null;

    if (isConnectingMode.value && mouseOverNodeId.value) {
      nodeId = mouseOverNodeId.value;
    } else {
      if (event.target) {
        if (typeof event.target === "string") {
          nodeId = event.target;
        } else if (event.target.id) {
          nodeId = event.target.id;
        } else if (event.target.getModel) {
          const model = event.target.getModel();
          nodeId = model.id;
          nodeData = model.data;
        }
      }

      if (!nodeId && event.item) {
        if (event.item.getModel) {
          const model = event.item.getModel();
          nodeId = model.id;
          nodeData = model.data;
        } else if (event.item.id) {
          nodeId = event.item.id;
        }
      }
    }

    if (isConnectingMode.value) {
      if (nodeId && !nodeId.toString().startsWith("virtual-")) {
        pendingConnection.value = {
          sourceId: sourceNodeId.value,
          targetId: nodeId,
        };
        targetNodeId.value = nodeId;
        fixTempEdgeToTarget(nodeId);
        emit("connection-complete", nodeId);
      } else {
        cancelConnect();
      }
    } else if (!props.isConnecting) {
      if (nodeId) {
        clearNodeSelection();
        clearEdgesSelection();
        graph.value.setElementState(nodeId, ["selected"]);

        if (!nodeData) {
          const clickedNode = props.nodes.find(
            (n) => String(n.id) === String(nodeId),
          );
          if (clickedNode) {
            nodeData = clickedNode;
          }
        }

        emit("node-click", nodeData || { id: nodeId });
      }
    }
  });

  graph.value.on("edge:click", (event) => {
    let edgeId = null;
    let edgeData = null;

    if (event.target) {
      if (typeof event.target === "string") {
        edgeId = event.target;
      } else if (event.target.id) {
        edgeId = event.target.id;
      } else if (event.target.getModel) {
        const model = event.target.getModel();
        edgeId = model.id;
        edgeData = model.data;
      }
    }

    if (!edgeId && event.item) {
      if (event.item.getModel) {
        const model = event.item.getModel();
        edgeId = model.id;
        edgeData = model.data;
      } else if (event.item.id) {
        edgeId = event.item.id;
      }
    }

    if (edgeId) {
      clearNodeSelection();
      clearEdgesSelection();
      graph.value.setElementState(edgeId, ["selected"]);

      if (!edgeData) {
        const clickedEdge = props.edges.find(
          (e) => String(e.id) === String(edgeId),
        );
        if (clickedEdge) {
          edgeData = clickedEdge;
        }
      }

      emit("edge-click", edgeData || { id: edgeId });
    }
  });

  graph.value.on("canvas:click", (event) => {
    if (isConnectingMode.value || pendingConnection.value) {
      cancelConnect();
    }
    emit("graph-click");
  });

  // 使用原生 mousemove 事件来更新虚拟节点位置
  const handleNativeMouseMove = (e) => {
    if (!virtualNodeId.value || !graph.value || pendingConnection.value) {
      return;
    }

    try {
      const [x, y] = graph.value.getCanvasByClient([e.clientX, e.clientY]);
      lastMousePos.value = { x, y };

      let overNodeId = null;
      const currentData = graph.value.getData();
      const nodes = currentData.nodes || [];

      for (const node of nodes) {
        if (node.id === virtualNodeId.value) continue;

        const size = node.style.size || [180, 100];
        const halfWidth = size[0] / 2;
        const halfHeight = size[1] / 2;

        if (
          x >= node.style.x - halfWidth &&
          x <= node.style.x + halfWidth &&
          y >= node.style.y - halfHeight &&
          y <= node.style.y + halfHeight
        ) {
          overNodeId = node.id;
          break;
        }
      }

      mouseOverNodeId.value = overNodeId;

      if (overNodeId) {
        if (String(overNodeId) === String(sourceNodeId.value)) {
          const sourceNode = nodes.find((n) => n.id === sourceNodeId.value);
          if (sourceNode) {
            updateVirtualNodePosition(
              sourceNode.style.x + 80,
              sourceNode.style.y - 160,
            );
          }
        } else {
          const targetNode = nodes.find((n) => n.id === overNodeId);
          if (targetNode) {
            updateVirtualNodePosition(targetNode.style.x, targetNode.style.y);
          }
        }
      } else {
        updateVirtualNodePosition(x, y);
      }
    } catch (error) {
      console.warn("更新虚拟节点位置失败:", error);
    }
  };

  if (graphRef.value) {
    graphRef.value.addEventListener("mousemove", handleNativeMouseMove);
  }

  // 拖拽实现
  graph.value.on("node:dragstart", (event) => {
    if (event.originalEvent) {
      event.originalEvent.preventDefault();
    }

    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    const nodeSize = model.style.size || [180, 100];

    dragStartPosition.value = { x: event.x, y: event.y };
    dragStartNodePosition.value = { x: model.style.x, y: model.style.y };
    dragStartNodeSize.value = { width: nodeSize[0], height: nodeSize[1] };
    dragStartZoom.value = graph.value.getZoom();

    isDragging.value = false;
    saveViewState();

    emit("node-drag", {
      type: "start",
      nodeId: model.id,
      data: model.data,
      position: { x: model.style.x, y: model.style.y },
    });
  });

  graph.value.on("node:drag", (event) => {
    const node = event.item;
    if (!node) return;

    const deltaX = event.x - dragStartPosition.value.x;
    const deltaY = event.y - dragStartPosition.value.y;

    const adjustedDeltaX = deltaX / dragStartZoom.value;
    const adjustedDeltaY = deltaY / dragStartZoom.value;

    let newX = dragStartNodePosition.value.x + adjustedDeltaX;
    let newY = dragStartNodePosition.value.y + adjustedDeltaY;

    const halfWidth = dragStartNodeSize.value.width / 2;
    const halfHeight = dragStartNodeSize.value.height / 2;

    const canvasWidth = graphRef.value.clientWidth;
    const canvasHeight = graphRef.value.clientHeight;

    const topLeft = graph.value.getCanvasByViewport([0, 0]);
    const bottomRight = graph.value.getCanvasByViewport([
      canvasWidth,
      canvasHeight,
    ]);

    const minX = topLeft[0] + halfWidth;
    const maxX = bottomRight[0] - halfWidth;
    const minY = topLeft[1] + halfHeight;
    const maxY = bottomRight[1] - halfHeight;

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    graph.value.updateItem(node, {
      style: {
        x: newX,
        y: newY,
      },
    });

    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (dragDistance > DRAG_THRESHOLD) {
      isDragging.value = true;
    }

    const model = node.getModel();
    emit("node-drag", {
      type: "dragging",
      nodeId: model.id,
      data: model.data,
      position: { x: newX, y: newY },
    });
  });

  graph.value.on("node:dragend", (event) => {
    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    const position = { x: model.style.x, y: model.style.y };

    const nodeId =
      typeof model.id === "string" ? model.id : model.id.toString();
    nodePositions.value.set(nodeId, position);

    justFinishedDragging.value = true;
    setTimeout(() => {
      isDragging.value = false;
      justFinishedDragging.value = false;
    }, 200);

    emit("node-drag-end", {
      nodeId: model.id,
      position: position,
      data: model.data,
    });
  });

  graph.value.on("node:mouseenter", (event) => {
    const node = event.item;
    if (node) {
      graph.value.setItemState(node, "active", true);
    }
  });

  graph.value.on("node:mouseleave", (event) => {
    const node = event.item;
    if (node) {
      graph.value.setItemState(node, "active", false);
    }
  });

  graph.value.on("canvas:zoom", () => {
    if (graph.value) {
      const currentZoom = graph.value.getZoom();
      zoomLevel.value = Math.round(currentZoom * 100);
      savedZoom.value = currentZoom;
      // 缩放后进行边界检查
      if (!isApplyingSavedPositions.value) {
        validateAllNodePositions();
      }
    }
  });

  graph.value.on("canvas:dragend", () => {
    saveViewState();
  });
};

// 处理右键点击事件
const handleContextMenu = (event) => {
  event.preventDefault();

  let isNode = false;
  let nodeId = null;
  let clickedNode = null;

  if (graphRef.value && graph.value) {
    const rect = graphRef.value.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    let transformedX = canvasX;
    let transformedY = canvasY;

    try {
      if (graph.value.getCanvasByViewport) {
        const point = graph.value.getCanvasByViewport([canvasX, canvasY]);
        transformedX = point[0] || canvasX;
        transformedY = point[1] || canvasY;
      }
    } catch (error) {
      console.warn("坐标转换失败:", error);
    }

    try {
      const graphData = graph.value.getData();
      const nodes = graphData.nodes || [];

      for (const node of nodes) {
        if (node.id && node.id.toString().startsWith("virtual-")) continue;

        const size = node.style.size || [180, 100];
        const halfWidth = size[0] / 2;
        const halfHeight = size[1] / 2;

        if (
          transformedX >= node.style.x - halfWidth &&
          transformedX <= node.style.x + halfWidth &&
          transformedY >= node.style.y - halfHeight &&
          transformedY <= node.style.y + halfHeight
        ) {
          isNode = true;
          nodeId = node.id;
          clickedNode = node;
          break;
        }
      }
    } catch (error) {
      console.warn("使用G6 API检测节点失败:", error);
    }
  }

  isNodeClick.value = isNode;
  clickedNodeId.value = nodeId;

  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  };

  if (graphRef.value) {
    const rect = graphRef.value.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (graph.value) {
      try {
        if (graph.value.getCanvasByViewport) {
          const point = graph.value.getCanvasByViewport([canvasX, canvasY]);
          clickCanvasPosition.value = {
            x: point[0] || canvasX,
            y: point[1] || canvasY,
          };
        } else {
          clickCanvasPosition.value = {
            x: canvasX,
            y: canvasY,
          };
        }
      } catch (error) {
        clickCanvasPosition.value = {
          x: canvasX,
          y: canvasY,
        };
      }
    } else {
      clickCanvasPosition.value = {
        x: canvasX,
        y: canvasY,
      };
    }
  }

  showContextMenu.value = true;
};

// 处理点击事件
const handleClick = (event) => {
  if (isDragging.value || justFinishedDragging.value) {
    return;
  }

  showContextMenu.value = false;

  if (!props.isConnecting && graphRef.value && graph.value) {
    const rect = graphRef.value.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    let graphX = canvasX;
    let graphY = canvasY;

    try {
      if (graph.value && graph.value.getCanvasByViewport) {
        const point = graph.value.getCanvasByViewport([canvasX, canvasY]);
        graphX = point[0] || canvasX;
        graphY = point[1] || canvasY;
      }
    } catch (error) {
      console.warn("坐标转换失败:", error);
    }

    let clickedOnNode = false;
    try {
      // 获取图中当前所有节点的实际位置
      const currentData = graph.value.getData();
      const currentNodes = currentData.nodes || [];

      for (const node of currentNodes) {
        // 跳过虚拟节点
        if (node.id && node.id.toString().startsWith("virtual-")) continue;

        const size = node.style.size || [180, 100];
        const halfWidth = size[0] / 2;
        const halfHeight = size[1] / 2;
        const nodeLeft = node.style.x - halfWidth;
        const nodeRight = node.style.x + halfWidth;
        const nodeTop = node.style.y - halfHeight;
        const nodeBottom = node.style.y + halfHeight;

        if (
          graphX >= nodeLeft &&
          graphX <= nodeRight &&
          graphY >= nodeTop &&
          graphY <= nodeBottom
        ) {
          // 找到对应的原始节点数据
          const originalNode = props.nodes.find(
            (n) => String(n.id) === String(node.id),
          );
          emit("node-click", originalNode || node.data);
          clickedOnNode = true;
          break;
        }
      }
    } catch (error) {
      console.warn("检测节点点击失败:", error);
    }

    if (!clickedOnNode) {
      emit("graph-click");
    }
  }
};

// 处理窗口大小变化
const handleResize = () => {
  if (!graph.value || !graphRef.value) return;

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

  try {
    saveViewState();
    graph.value.resize(width, height);
    // 调整大小后进行边界检查
    setTimeout(() => {
      if (!isApplyingSavedPositions.value) {
        validateAllNodePositions();
      }
    }, 50);
    restoreViewState();
  } catch (error) {
    console.error("调整图谱大小时出错:", error);
  }
};

// 渲染图谱
const renderGraph = () => {
  if (!graph.value || !graphRef.value) {
    initGraph();
    return;
  }

  try {
    saveViewState();

    const width = graphRef.value.clientWidth;
    const height = graphRef.value.clientHeight;

    const formattedNodes = props.nodes.map((node) => {
      const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
      let nodeX = node.x || width / 2;
      let nodeY = node.y || height / 2;

      // 只有在不是正在应用保存位置时才使用保存的位置
      if (!isApplyingSavedPositions.value && nodePositions.value.has(nodeId)) {
        const savedPosition = nodePositions.value.get(nodeId);
        nodeX = savedPosition.x;
        nodeY = savedPosition.y;
      }

      const nodeSize = calculateNodeSize({
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
        },
      });

      const formattedNode = {
        id: nodeId,
        type: "rect",
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
          backgroundColor: node.backgroundColor || "#43D7B5",
        },
        style: {
          x: nodeX,
          y: nodeY,
          fill: "#fff",
          stroke: node.backgroundColor || "#43D7B5",
          lineWidth: 2,
          radius: 8,
          size: [nodeSize.width, nodeSize.height],
          shadowColor: "rgba(78,89,105,0.18)",
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 8,
        },
      };

      return formattedNode;
    });

    const currentData = graph.value.getData();
    const currentNodes = currentData.nodes || [];
    const currentEdges = currentData.edges || [];

    const virtualNodes = currentNodes.filter(
      (node) => node.id && node.id.toString().startsWith("virtual-"),
    );

    const tempEdges = currentEdges.filter(
      (edge) => edge.id && edge.id.toString().startsWith("temp-edge-"),
    );

    const finalNodes = [...formattedNodes, ...virtualNodes];
    const finalEdges = [...props.edges, ...tempEdges];

    graph.value.setData({
      nodes: finalNodes,
      edges: finalEdges,
    });

    graph.value.render();

    // 渲染后立即进行边界检查
    setTimeout(() => {
      if (!isApplyingSavedPositions.value) {
        validateAllNodePositions();
      }
    }, 50);

    restoreViewState();
  } catch (error) {
    console.error("渲染图谱时出错:", error);
    initGraph();
  }
};

// 处理添加实体
const handleAddEntity = () => {
  // 先发送事件让父组件添加实体
  emit("add-entity", {
    x: clickCanvasPosition.value.x,
    y: clickCanvasPosition.value.y,
  });

  // 关闭菜单
  showContextMenu.value = false;

  // 在下一个事件循环中检查边界（等待父组件更新props）
  setTimeout(() => {
    validateAllNodePositions();
  }, 100);
};

// 处理创建关系
const handleCreateRelationship = () => {
  const sourceNode = props.nodes.find(
    (node) => String(node.id) === String(clickedNodeId.value),
  );

  if (sourceNode && graph.value) {
    startConnect(clickedNodeId.value);
  }

  emit("create-relationship", clickedNodeId.value);
  showContextMenu.value = false;
};

// 处理放大
const zoomIn = () => {
  if (!graph.value) return;
  try {
    const currentZoom = graph.value.getZoom ? graph.value.getZoom() : 1;
    const newZoom = Math.min(currentZoom * 1.2, 3);

    if (graph.value.zoomTo) {
      const center = [
        graphRef.value.clientWidth / 2,
        graphRef.value.clientHeight / 2,
      ];
      graph.value.zoomTo(newZoom, center);
    } else if (graph.value.setZoom) {
      graph.value.setZoom(newZoom);
    } else if (graph.value.zoom) {
      graph.value.zoom(newZoom);
    }

    zoomLevel.value = Math.round(newZoom * 100);
    savedZoom.value = newZoom;

    // 缩放后进行边界检查
    setTimeout(() => {
      if (!isApplyingSavedPositions.value) {
        validateAllNodePositions();
      }
    }, 50);
  } catch (error) {
    console.error("放大操作失败:", error);
  }
};

// 处理缩小
const zoomOut = () => {
  if (!graph.value) return;
  try {
    const currentZoom = graph.value.getZoom ? graph.value.getZoom() : 1;
    const newZoom = Math.max(currentZoom / 1.2, 0.3);

    if (graph.value.zoomTo) {
      const center = [
        graphRef.value.clientWidth / 2,
        graphRef.value.clientHeight / 2,
      ];
      graph.value.zoomTo(newZoom, center);
    } else if (graph.value.setZoom) {
      graph.value.setZoom(newZoom);
    } else if (graph.value.zoom) {
      graph.value.zoom(newZoom);
    }

    zoomLevel.value = Math.round(newZoom * 100);
    savedZoom.value = newZoom;

    // 缩放后进行边界检查
    setTimeout(() => {
      if (!isApplyingSavedPositions.value) {
        validateAllNodePositions();
      }
    }, 50);
  } catch (error) {
    console.error("缩小操作失败:", error);
  }
};

// 监听数据变化
watch(
  [() => props.nodes, () => props.edges],
  () => {
    nextTick(() => {
      renderGraph();
    });
  },
  { deep: true },
);

// 组件挂载时初始化图谱
onMounted(() => {
  nextTick(() => {
    initGraph();
  });
});

// 重置连线状态
const resetConnectionState = () => {
  cancelConnect();
};

// 组件卸载时清理资源
onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy();
  }
  window.removeEventListener("resize", handleResize);

  if (graphRef.value) {
    graphRef.value.removeEventListener("mousemove", handleNativeMouseMove);
  }
});

// 暴露方法给父组件
defineExpose({
  resetConnectionState,
  clearNodeSelection,
  clearEdgesSelection,
  confirmConnection,
});
</script>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 100%;
  overflow: visible !important;
}

:deep(.g6-canvas) {
  overflow: visible !important;
}

:deep(.g6-canvas svg) {
  overflow: visible !important;
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
  box-shadow: 0px 8px 10px 0px rgba(78, 89, 105, 0.18);
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
  position: relative;
}

.zoom-icon {
  position: relative;
  z-index: 1;
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

:deep(.g6-node-rect) {
  cursor: move !important;
  filter: drop-shadow(0px 8px 10px rgba(78, 89, 105, 0.25));
}

:deep(.g6-node) {
  cursor: move !important;
}

:deep(.g6-node:hover) {
  stroke: #ff6b6b !important;
  stroke-width: 3px !important;
}

:deep(.g6-canvas) {
  cursor: default;
}

:deep(.g6-node-label) {
  word-wrap: break-word !important;
  white-space: pre-wrap !important;
  word-break: break-word !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 18px !important;
  text-align: center !important;
}

:deep(.g6-node-content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  width: 100% !important;
}
</style>

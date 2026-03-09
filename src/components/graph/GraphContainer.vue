<template>
  <div class="graph-container">
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
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  shallowRef,
  h,
} from "vue";
import { Graph, register, ExtensionCategory } from "@antv/g6";
import GraphContextMenu from "./GraphContextMenu.vue";
import { VueNode } from "g6-extension-vue";

// 内边距配置常量
const PADDING = {
  width: 20,
  label: 28,
  vertical: 18,
  horizontal: 12,
  baseHeight: 60,
  lineHeight: 25,
  minWidth: 180,
  maxWidth: 180,
  minHeight: 90,
  maxHeight: 250,
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

// 保存节点位置的本地状态
const nodePositions = ref(new Map());

// 跟踪是否正在拖拽节点
const isDragging = ref(false);
const justFinishedDragging = ref(false);
const dragStartPosition = ref({ x: 0, y: 0 });
const dragStartNodePosition = ref({ x: 0, y: 0 });
const dragStartNodeSize = ref({ width: 0, height: 0 });
const dragStartZoom = ref(1);
const dragStartTime = ref(0);
const dragAccumulatedDistance = ref(0);

const DRAG_THRESHOLD = 5;
const DRAG_TIME_THRESHOLD = 200;
const CLICK_DEBOUNCE_TIME = 350;

const clickedNodeId = ref(null);

// 标记是否正在应用保存的位置
const isApplyingSavedPositions = ref(false);

// 计算文本宽度
const calculateTextWidth = (text, fontSize = 12) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px Arial, sans-serif`;
  return context.measureText(text).width;
};

// 创建自定义节点渲染函数 - 添加 data-node-id 属性
const createCustomNode = (model) => {
  return () => {
    const nodeData = model.data || {};
    const label = nodeData.name || "未命名节点";
    const attrs = nodeData.properties || [];
    const color = nodeData.backgroundColor || "#43D7B5";
    const backGround = hexToRgba(nodeData.backgroundColor || "#43D7B5", 0.4);
    const isSelected = model.states && model.states.includes("selected");

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

    return h(
      "div",
      {
        "data-node-id": model.id, // 添加节点ID属性，用于DOM检测
        style: {
          width: "100%",
          height: "auto",
          maxWidth: "300px",
          background: "#ffffff",
          borderRadius: "10px",
          padding: "8px 12px",
          border: `2px solid ${color}`,
          boxShadow: isSelected
            ? `0 6px 30px ${backGround}`
            : "0px 8px 10px 0px rgba(78,89,105,0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
          transition: "all 0.2s ease",
          cursor: "pointer",
          userSelect: "none",
          pointerEvents: "auto",
        },
      },
      [
        h(
          "div",
          {
            style: {
              paddingBottom: "8px",
              fontSize: "16px",
              fontWeight: "500",
              color: "#000",
              borderBottom: "1px dashed rgba(67,215,181,0.5)",
              background: "#ffffff",
              marginBottom: "3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          },
          label,
        ),
        h(
          "div",
          {
            style: {
              flex: 1,
              padding: "6px 0px 0px 0px",
              fontSize: "14px",
              color: "#666666",
              fontWeight: "400",
              overflow: "auto",
              maxHeight: "150px",
            },
          },
          Array.isArray(attrs) && attrs.length > 0
            ? attrs.slice(0, 3).map((attr) =>
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    },
                  },
                  [
                    h(
                      "span",
                      {
                        style: {
                          color: "#666666",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "70%",
                        },
                      },
                      attr.name || attr.key || "",
                    ),
                    h(
                      "span",
                      {
                        style: {
                          fontSize: "12px",
                          color: "#666666",
                          background: "#F4F8FC",
                          borderRadius: "6px",
                          padding: "1px 4px",
                          textAlign: "center",
                        },
                      },
                      typeMap[attr.type] || typeMap[attr.value] || "",
                    ),
                  ],
                ),
              )
            : h(
                "div",
                {
                  style: {
                    fontSize: "13px",
                    textAlign: "center",
                    color: "#666666",
                    marginTop: "6px",
                  },
                },
                "暂无属性",
              ),
        ),
      ],
    );
  };
};

// 注册 Vue 节点类型
register(ExtensionCategory.NODE, "vue-node", VueNode);

// 计算节点所需尺寸
const calculateNodeSize = (nodeData) => {
  const data = nodeData.data || {};
  const name = data.name || "未命名";
  const properties = data.properties || [];

  // 计算宽度
  const nameFontSize = 14;
  const nameWidth =
    calculateTextWidth(name, nameFontSize) + PADDING.horizontal * 2;

  let maxPropertyWidth = 0;
  let propertyLines = 0;

  if (Array.isArray(properties)) {
    const limitedProperties = properties.slice(0, 3);
    propertyLines = limitedProperties.length;
    limitedProperties.forEach((property, index) => {
      const propName = property.name || `属性${index + 1}`;
      const propType = property.type || "string";
      const propText = `${propName}: ${propType}`;
      const propWidth = calculateTextWidth(propText) + PADDING.horizontal * 2;
      maxPropertyWidth = Math.max(maxPropertyWidth, propWidth);
    });
  } else if (typeof properties === "object" && properties !== null) {
    const entries = Object.entries(properties);
    const limitedEntries = entries.slice(0, 3);
    propertyLines = limitedEntries.length;
    limitedEntries.forEach(([key, value]) => {
      let propText = "";
      if (typeof value === "object" && value !== null && value.type) {
        propText = `${key}: ${value.type}`;
      } else if (typeof value === "object" && value !== null) {
        propText = `${key}: ${JSON.stringify(value)}`;
      } else {
        propText = `${key}: ${value}`;
      }
      const propWidth = calculateTextWidth(propText) + PADDING.horizontal * 2;
      maxPropertyWidth = Math.max(maxPropertyWidth, propWidth);
    });
  }

  const contentWidth = Math.max(nameWidth, maxPropertyWidth);
  const totalWidth = Math.max(
    PADDING.minWidth,
    Math.min(PADDING.maxWidth, contentWidth),
  );

  // 计算高度 - 更准确地反映实际渲染高度
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
    const topLeft = graph.value.getCanvasByViewport([0, 0]);
    const bottomRight = graph.value.getCanvasByViewport([
      canvasWidth,
      canvasHeight,
    ]);

    const minX = topLeft[0] + nodeHalfWidth;
    const maxX = bottomRight[0] - nodeHalfWidth;
    const minY = topLeft[1] + nodeHalfHeight;
    const maxY = bottomRight[1] - nodeHalfHeight;

    const validMinX = Math.min(minX, maxX);
    const validMaxX = Math.max(minX, maxX);
    const validMinY = Math.min(minY, maxY);
    const validMaxY = Math.max(minY, maxY);

    const centerX = (topLeft[0] + bottomRight[0]) / 2;
    const centerY = (topLeft[1] + bottomRight[1]) / 2;

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
  if (!graphRef.value) return;

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

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
        type: "vue-node",
        style: {
          component: (model) => createCustomNode(model),
          size: (data) => {
            const nodeSize = calculateNodeSize(data);
            return [nodeSize.width, nodeSize.height];
          },
          keyShape: {
            lineWidth: 2,
            stroke: "#ddd",
            fill: "transparent",
          },
          cursor: "pointer",
        },
        state: {
          selected: {
            stroke: (data) => data.data?.backgroundColor || "#43D7B5",
            lineWidth: 3,
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
            style.startArrow = false;
            style.endArrow = true;
          } else if (relationshipType === "双向") {
            style.startArrow = true;
            style.endArrow = true;
          } else if (relationshipType === "循环") {
            style.startArrow = false;
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
    graph.value.render();

    applySavedNodePositions();

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

    // 创建完全透明的虚拟节点，确保不接收鼠标事件
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
        pointerEvents: "none", // 确保不接收鼠标事件
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
        pointerEvents: "none", // 确保临时边不接收鼠标事件
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
const updateVirtualNodePosition = (x, y, size = [180, 100]) => {
  if (!graph.value || !virtualNodeId.value) return;

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
        return {
          ...node,
          style: {
            ...node.style,
            x: x,
            y: y,
            size: size,
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

  window.addEventListener("resize", handleResize);

  // 节点点击事件
  graph.value.on("node:click", (event) => {
    if (isDragging.value || justFinishedDragging.value) return;

    let nodeId = null;
    let nodeData = null;

    if (isConnectingMode.value && mouseOverNodeId.value) {
      nodeId = mouseOverNodeId.value;
    }

    if (!nodeId) {
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

    if (
      isConnectingMode.value &&
      nodeId &&
      nodeId.toString().startsWith("virtual-")
    ) {
      if (event.path && Array.isArray(event.path)) {
        for (const item of event.path) {
          if (item.getModel) {
            const model = item.getModel();
            if (model.id && !model.id.toString().startsWith("virtual-")) {
              nodeId = model.id;
              break;
            }
          } else if (item.id && !item.id.toString().startsWith("virtual-")) {
            nodeId = item.id;
            break;
          }
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

  // 边点击事件
  graph.value.on("edge:click", (event) => {
    if (isDragging.value || justFinishedDragging.value) return;

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

  // 画布点击事件
  graph.value.on("canvas:click", (event) => {
    if (isDragging.value || justFinishedDragging.value) return;

    if (isConnectingMode.value || pendingConnection.value) {
      cancelConnect();
    }
    emit("graph-click");
  });

  // 拖拽开始事件
  graph.value.on("node:dragstart", (event) => {
    if (event.originalEvent) {
      event.originalEvent.preventDefault();
    }

    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    const nodeSize = model.style.size || [180, 100];

    dragStartPosition.value = {
      x: event.originalEvent?.clientX || event.x,
      y: event.originalEvent?.clientY || event.y,
    };
    dragStartNodePosition.value = { x: model.style.x, y: model.style.y };
    dragStartNodeSize.value = { width: nodeSize[0], height: nodeSize[1] };
    dragStartZoom.value = graph.value.getZoom();
    dragStartTime.value = Date.now();
    dragAccumulatedDistance.value = 0;

    isDragging.value = false;
    justFinishedDragging.value = false;

    saveViewState();

    emit("node-drag", {
      type: "start",
      nodeId: model.id,
      data: model.data,
      position: { x: model.style.x, y: model.style.y },
    });
  });

  // 拖拽过程中
  graph.value.on("node:drag", (event) => {
    const node = event.item;
    if (!node) return;

    const screenDeltaX =
      (event.originalEvent?.clientX || 0) - dragStartPosition.value.x;
    const screenDeltaY =
      (event.originalEvent?.clientY || 0) - dragStartPosition.value.y;

    const currentDragDistance = Math.sqrt(
      screenDeltaX * screenDeltaX + screenDeltaY * screenDeltaY,
    );

    dragAccumulatedDistance.value = Math.max(
      dragAccumulatedDistance.value,
      currentDragDistance,
    );

    const deltaX = event.x - (event.dx || 0);
    const deltaY = event.y - (event.dy || 0);

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

    const dragDuration = Date.now() - dragStartTime.value;

    if (
      dragAccumulatedDistance.value > DRAG_THRESHOLD ||
      (dragDuration > DRAG_TIME_THRESHOLD && currentDragDistance > 2)
    ) {
      if (!isDragging.value) {
        isDragging.value = true;
      }
    }

    const model = node.getModel();
    emit("node-drag", {
      type: "dragging",
      nodeId: model.id,
      data: model.data,
      position: { x: newX, y: newY },
    });
  });

  // 拖拽结束事件
  graph.value.on("node:dragend", (event) => {
    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    const position = { x: model.style.x, y: model.style.y };

    const nodeId =
      typeof model.id === "string" ? model.id : model.id.toString();
    nodePositions.value.set(nodeId, position);

    if (isDragging.value) {
      justFinishedDragging.value = true;

      setTimeout(() => {
        isDragging.value = false;
        justFinishedDragging.value = false;
      }, CLICK_DEBOUNCE_TIME);
    } else {
      isDragging.value = false;
      justFinishedDragging.value = false;
    }

    emit("node-drag-end", {
      nodeId: model.id,
      position: position,
      data: model.data,
    });
  });

  // 节点鼠标进入事件
  graph.value.on("node:mouseenter", (event) => {
    const node = event.item;
    if (node) {
      graph.value.setItemState(node, "active", true);
    }
  });

  // 节点鼠标离开事件
  graph.value.on("node:mouseleave", (event) => {
    const node = event.item;
    if (node) {
      graph.value.setItemState(node, "active", false);
    }
  });

  // 画布缩放事件
  graph.value.on("canvas:zoom", () => {
    if (graph.value) {
      const currentZoom = graph.value.getZoom();
      zoomLevel.value = Math.round(currentZoom * 100);
      savedZoom.value = currentZoom;

      if (!isApplyingSavedPositions.value) {
        validateAllNodePositions();
      }
    }
  });

  // 画布拖拽结束事件
  graph.value.on("canvas:dragend", () => {
    saveViewState();
  });

  // 节点右键菜单
  graph.value.on("node:contextmenu", (evt) => {
    evt.preventDefault();

    let nodeId = null;

    if (evt.item) {
      if (evt.item.getModel) {
        const model = evt.item.getModel();
        nodeId = model.id;
      } else if (evt.item.id) {
        nodeId = evt.item.id;
      }
    }

    if (!nodeId && evt.target) {
      if (typeof evt.target === "string") {
        nodeId = evt.target;
      } else if (evt.target.id) {
        nodeId = evt.target.id;
      } else if (evt.target.getModel) {
        const model = evt.target.getModel();
        nodeId = model.id;
      }
    }

    if (!nodeId) return;

    isNodeClick.value = true;
    clickedNodeId.value = nodeId;
    contextMenuPosition.value = {
      x: evt.client.x,
      y: evt.client.y,
    };

    showContextMenu.value = true;
  });

  // 画布右键菜单
  graph.value.on("canvas:contextmenu", (evt) => {
    evt.preventDefault();

    // 保存点击位置用于添加实体
    if (graph.value && graphRef.value) {
      try {
        const [x, y] = graph.value.getCanvasByClient([
          evt.client.x,
          evt.client.y,
        ]);
        clickCanvasPosition.value = { x, y };
      } catch (error) {
        console.warn("获取画布坐标失败:", error);
      }
    }

    isNodeClick.value = false;
    contextMenuPosition.value = {
      x: evt.client.x,
      y: evt.client.y,
    };
    showContextMenu.value = true;
  });

  // 使用原生 mousemove 事件，通过 DOM 元素检测节点
  const handleNativeMouseMove = (e) => {
    // 只在连线模式下且没有待确认连线时才处理
    if (!virtualNodeId.value || !graph.value || pendingConnection.value) return;

    try {
      // 获取鼠标在画布中的坐标（用于虚拟节点移动）
      const [x, y] = graph.value.getCanvasByClient([e.clientX, e.clientY]);
      lastMousePos.value = { x, y };

      // 使用 elementsFromPoint 获取当前鼠标下的所有元素
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      let hoveredNodeId = null;

      // 查找第一个带有 data-node-id 属性的元素（排除虚拟节点）
      for (const element of elements) {
        const nodeId = element.getAttribute?.("data-node-id");
        if (nodeId && !nodeId.startsWith("virtual-")) {
          hoveredNodeId = nodeId;
          break;
        }
      }

      // 如果有悬停的节点
      if (hoveredNodeId) {
        // 从图数据中获取节点信息
        const currentData = graph.value.getData();
        const allNodes = currentData.nodes || [];
        const hoveredNode = allNodes.find(
          (node) => String(node.id) === String(hoveredNodeId),
        );

        if (hoveredNode) {
          // 只有当悬停的节点发生变化时（刚进入节点），才更新虚拟节点到节点中心
          if (
            !mouseOverNodeId.value ||
            String(hoveredNode.id) !== String(mouseOverNodeId.value)
          ) {
            mouseOverNodeId.value = hoveredNode.id;

            // 将虚拟节点固定在节点中心
            updateVirtualNodePosition(
              hoveredNode.style.x,
              hoveredNode.style.y,
              hoveredNode.style.size || [180, 100],
            );
          }
          // 鼠标在节点内移动时不更新位置
        }
      } else {
        // 如果鼠标不在任何节点上
        if (mouseOverNodeId.value) {
          mouseOverNodeId.value = null;
        }
        // 跟随鼠标移动
        updateVirtualNodePosition(x, y);
      }
    } catch (error) {
      console.warn("更新虚拟节点位置失败:", error);
    }
  };

  // 添加原生事件监听
  if (graphRef.value) {
    graphRef.value.addEventListener("mousemove", handleNativeMouseMove);
  }

  // 保存事件处理函数引用，以便在卸载时移除
  graph.value._nativeMouseMoveHandler = handleNativeMouseMove;
};

// 处理窗口大小变化
const handleResize = () => {
  if (!graph.value || !graphRef.value) return;

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

  try {
    saveViewState();
    graph.value.resize(width, height);

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
  emit("add-entity", {
    x: clickCanvasPosition.value.x,
    y: clickCanvasPosition.value.y,
  });

  showContextMenu.value = false;

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

  // 移除原生事件监听
  if (graphRef.value && graph.value && graph.value._nativeMouseMoveHandler) {
    graphRef.value.removeEventListener(
      "mousemove",
      graph.value._nativeMouseMoveHandler,
    );
  }
});

// 暴露方法给父组件
defineExpose({
  resetConnectionState,
  clearNodeSelection,
  clearEdgesSelection,
  confirmConnection,
  graph,
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
</style>

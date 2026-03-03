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
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  shallowRef,
  computed,
} from "vue";
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
const pendingConnection = ref(null); // 待确认的连线信息

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

// 跟踪是否刚刚结束拖拽
const justFinishedDragging = ref(false);

// 跟踪拖拽开始位置
const dragStartPosition = ref({ x: 0, y: 0 });

// 拖拽阈值（像素）
const DRAG_THRESHOLD = 5;

// 计算文本宽度
const calculateTextWidth = (text, fontSize = 12) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px Arial, sans-serif`;
  return context.measureText(text).width;
};

// 计算点到矩形边框的最近点
const getPointOnRect = (point, rect) => {
  const { x, y, width, height } = rect;
  const rectCenterX = x;
  const rectCenterY = y;
  const rectHalfWidth = width / 2;
  const rectHalfHeight = height / 2;

  // 计算点相对于矩形中心的位置
  const relativeX = point.x - rectCenterX;
  const relativeY = point.y - rectCenterY;

  // 计算归一化的方向向量
  const maxRatio = Math.max(
    Math.abs(relativeX) / rectHalfWidth,
    Math.abs(relativeY) / rectHalfHeight,
  );

  if (maxRatio === 0) {
    // 点在矩形中心，返回右边界中点
    return { x: rectCenterX + rectHalfWidth, y: rectCenterY };
  }

  // 计算矩形边框上的点
  const normalizedX = relativeX / maxRatio;
  const normalizedY = relativeY / maxRatio;

  return { x: rectCenterX + normalizedX, y: rectCenterY + normalizedY };
};

// 获取节点的矩形信息
const getNodeRect = (node) => {
  // 计算节点大小
  const nodeSize = calculateNodeSize({ data: node });
  return {
    x: node.x,
    y: node.y,
    width: nodeSize.width,
    height: nodeSize.height,
  };
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
  // 类型映射：英文 -> 中文
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
  console.log("hex2222222222222222222", hex, opacity);
  // 处理 rgb() 格式
  const rgbMatch = hex.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // 处理 rgba() 格式
  const rgbaMatch = hex.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // 处理十六进制格式
  // 移除 # 号
  hex = hex.replace("#", "");

  // 处理简写的十六进制颜色（如 #fff）
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // 转换为 RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 返回 rgba 字符串
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

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

      // 边界检查，确保节点不超出画布范围
      const nodeHalfWidth = nodeSize.width / 2;
      const nodeHalfHeight = nodeSize.height / 2;
      nodeX = Math.max(nodeHalfWidth, Math.min(width - nodeHalfWidth, nodeX));
      nodeY = Math.max(
        nodeHalfHeight,
        Math.min(height - nodeHalfHeight, nodeY),
      );

      // 确保节点 ID 与 Home 组件中的格式一致
      const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
      console.log(
        `节点原始ID: ${node.id}, 类型: ${typeof node.id}, 转换后ID: ${nodeId}, 类型: ${typeof nodeId}`,
      );

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

      console.log("格式化节点:", formattedNode);
      return formattedNode;
    });

    console.log("格式化后的节点数据:", formattedNodes);

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
              // 获取基础颜色
              const baseColor = data.data?.backgroundColor || "#43D7B5";
              // 转换为 rgba，设置透明度为 0.5（可以根据需要调整）
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
      // 注册节点类型
      register: {
        node: {
          rect: {
            shape: "rect",
          },
        },
      },
      edge: {
        type: (data) => {
          // 检查是否是自环边
          const source = data.source;
          const target = data.target;
          if (String(source) === String(target)) {
            return "cubic";
          }
          // 检查是否是临时边
          if (data.id && data.id.toString().startsWith("temp-edge-")) {
            return "line";
          }
          // 检查是否存在双向连线
          const hasReverseEdge = props.edges.some(
            (edge) => edge.source === target && edge.target === source,
          );
          // 如果存在双向连线，使用二次贝塞尔曲线
          return hasReverseEdge ? "quadratic" : "line";
        },
        style: (data) => {
          // 检查是否是临时边
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

            // 如果是临时自环边，添加特殊的控制点配置
            const source = data.source;
            const target = data.target;
            if (String(source) === String(target)) {
              const sourceNode = props.nodes.find(
                (n) => String(n.id) === String(source),
              );
              if (sourceNode) {
                // 为自环边设置控制点，使用三阶贝塞尔曲线
                const nodeX = sourceNode.x;
                const nodeY = sourceNode.y;

                // 控制点设置，与虚线自环保持一致的形状
                style.controlPoints = [
                  { x: nodeX + 80, y: nodeY - 160 }, // 第一个控制点
                  { x: nodeX - 80, y: nodeY - 160 }, // 第二个控制点
                ];
              }
            }

            return style;
          }

          const relationshipType = data.data?.type || "定向";
          const source = data.source;
          const target = data.target;

          // 检查是否存在双向连线
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

          // 为双向连线添加控制点数，使它们分开显示
          if (hasReverseEdge) {
            // 安全计算控制点数，避免sourcePoint或targetPoint不存在的情况
            let centerX = 0;
            let centerY = 0;

            // 尝试获取节点位置
            const sourceNode = props.nodes.find(
              (node) => String(node.id) === String(source),
            );
            const targetNode = props.nodes.find(
              (node) => String(node.id) === String(target),
            );

            if (sourceNode && targetNode) {
              // 使用节点的实际位置
              centerX = (sourceNode.x + targetNode.x) / 2;
              centerY = (sourceNode.y + targetNode.y) / 2;
            } else if (data.sourcePoint && data.targetPoint) {
              // 使用G6提供的节点位置
              centerX = (data.sourcePoint.x + data.targetPoint.x) / 2;
              centerY = (data.sourcePoint.y + data.targetPoint.y) / 2;
            } else {
              // 使用默认值，避免错误
              centerX = 0;
              centerY = 0;
            }

            // 为不同方向的连线设置不同的控制点数
            if (source < target) {
              // A→B 方向，向上偏移
              style.controlPoints = [{ x: centerX, y: centerY - 30 }];
            } else {
              // B→A 方向，向下偏移
              style.controlPoints = [{ x: centerX, y: centerY + 30 }];
            }
          }

          // 为自环边添加特殊配置，确保与虚线自环保持一致
          if (String(source) === String(target)) {
            // 尝试获取节点位置
            const sourceNode = props.nodes.find(
              (node) => String(node.id) === String(source),
            );

            if (sourceNode) {
              // 为自环边设置控制点，使用三阶贝塞尔曲线
              const nodeX = sourceNode.x;
              const nodeY = sourceNode.y;

              // 控制点设置，与虚线自环保持一致的形状
              style.controlPoints = [
                { x: nodeX + 80, y: nodeY - 160 }, // 第一个控制点
                { x: nodeX - 80, y: nodeY - 160 }, // 第二个控制点
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
        },
      ],
      animation: true,
      autoResize: true,
    });

    graph.value = graphInstance;
    console.log("G6实例创建成功");

    graph.value.render();
    console.log("图谱渲染成功");

    restoreViewState();
    bindEvents();
  } catch (error) {
    console.error("初始化G6图谱时出错:", error);
    console.error("错误详情:", error.message, error.stack);
  }
};

// 添加清除节点选中的方法
const clearNodeSelection = () => {
  console.log("清除节点选中状态1");
  if (!graph.value) return;
  console.log(
    "清除节点选中状态2",
    graph.value,
    graph.value.getData(),
    graph.value.context.graph,
  );
  try {
    const { nodes } = graph.value.getData();
    nodes.forEach((node) => {
      graph.value.setElementState(node.id, []);
    });
  } catch (error) {
    console.error("清除节点选中状态失败:", error);
  }
};

// 添加清除连线选中的方法
const clearEdgesSelection = () => {
  console.log("清除连线选中状态1");
  if (!graph.value) return;
  console.log(
    "清除连线选中状态2",
    graph.value,
    graph.value.getData(),
    graph.value.context.graph,
  );
  try {
    const { edges } = graph.value.getData();
    edges.forEach((edge) => {
      graph.value.setElementState(edge.id, []);
    });
  } catch (error) {
    console.error("清除连线选中状态失败:", error);
  }
};

//清除所有（节点和连线）的选中状态
const clearAllSelection = () => {
  const { nodes = [], edges = [] } = graph.value.getData();
  nodes.forEach((n) => graph.value.setElementState(n.id, []));
  edges.forEach((e) => graph.value.setElementState(e.id, []));
};

// 保存视图状态
const saveViewState = () => {
  if (!graph.value) return;

  try {
    savedZoom.value = graph.value.getZoom ? graph.value.getZoom() : 1;

    const canvas = graph.value.getCanvas ? graph.value.getCanvas() : null;
    if (canvas) {
      const bbox = canvas.getBounds();
      if (bbox) {
        savedCenter.value = {
          x: bbox.center[0] || 0,
          y: bbox.center[1] || 0,
        };
      }
    }
    console.log("保存视图状态:", {
      zoom: savedZoom.value,
      center: savedCenter.value,
    });
  } catch (error) {
    console.warn("保存视图状态失败:", error);
  }
};

// 恢复视图状态
const restoreViewState = () => {
  if (!graph.value || savedZoom.value === 1) return;

  try {
    console.log("恢复视图状态:", {
      zoom: savedZoom.value,
      center: savedCenter.value,
    });

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

// 开始连线 - 创建虚拟节点和临时边
const startConnect = async (nodeId) => {
  console.log("开始连线，源节点:", nodeId);
  if (!graph.value) return;

  sourceNodeId.value = nodeId;
  isConnectingMode.value = true;
  mouseOverNodeId.value = null;

  try {
    // 获取源节点的位置
    const sourceNode = props.nodes.find((n) => String(n.id) === String(nodeId));
    if (!sourceNode) {
      console.error("找不到源节点");
      return;
    }

    // 创建虚拟节点ID
    const vNodeId = `virtual-${Date.now()}`;

    // 获取当前图数据
    const currentData = graph.value.getData();
    const nodes = currentData.nodes || [];
    const edges = currentData.edges || [];

    // 创建虚拟节点（不可见）
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

    // 创建临时边
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

    // 更新数据
    await graph.value.setData({
      ...currentData,
      nodes: [...nodes, virtualNode],
      edges: [...edges, tempEdge],
    });

    virtualNodeId.value = vNodeId;
    tempEdgeId.value = tempId;
    console.log("虚拟节点和临时边创建成功:", tempId, "虚拟节点:", vNodeId);

    // 强制重新渲染
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

    // 无论是否是自环边，都更新临时边的target为目标节点ID，这样虚线就会直接连接到目标节点
    const updatedEdges = edges.map((edge) => {
      if (edge.id === tempEdgeId.value) {
        return {
          ...edge,
          target: targetId,
        };
      }
      return edge;
    });

    // 移除虚拟节点，因为临时边已经直接连接到目标节点
    const updatedNodes = nodes.filter(
      (node) => node.id !== virtualNodeId.value,
    );

    await graph.value.setData({
      ...currentData,
      nodes: updatedNodes,
      edges: updatedEdges,
    });

    // 清除虚拟节点ID，因为虚拟节点已经被移除
    virtualNodeId.value = null;

    graph.value.render();
    console.log("临时边已固定到目标节点，直接连接到目标节点ID:", targetId);
  } catch (error) {
    console.warn("固定临时边到目标节点失败:", error);
  }
};

// 确认连线（由父组件在用户保存后调用）
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

    // 过滤掉虚拟节点（如果存在）
    const updatedNodes = nodes.filter(
      (node) => node.id !== virtualNodeId.value,
    );

    // 更新临时边为永久边，并添加关系数据
    const updatedEdges = edges.map((edge) => {
      if (edge.id === tempEdgeId.value) {
        const style = {
          lineDash: null,
          stroke: "#44D6B6",
          lineWidth: 2,
          endArrow: true,
          opacity: 1,
        };

        // 如果是自环边，添加特殊的控制点配置
        if (String(sourceId) === String(targetId)) {
          const sourceNode = props.nodes.find(
            (n) => String(n.id) === String(sourceId),
          );
          if (sourceNode) {
            // 为自环边设置控制点，使用三阶贝塞尔曲线
            const nodeX = sourceNode.x;
            const nodeY = sourceNode.y;

            // 控制点设置，与虚线自环保持一致的形状
            style.controlPoints = [
              { x: nodeX + 80, y: nodeY - 160 }, // 第一个控制点
              { x: nodeX - 80, y: nodeY - 160 }, // 第二个控制点
            ];
          }
        }

        return {
          ...edge,
          source: sourceId,
          target: targetId,
          data: relationshipData, // 保存关系数据
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

    // 触发完成事件（不带 isPending 标记，表示最终完成）
    emit("connection-complete", {
      source: sourceId,
      target: targetId,
      data: relationshipData,
    });

    console.log("连线完成");
  } catch (error) {
    console.error("完成连线失败:", error);
  } finally {
    // 清理状态
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

  // 立即清除待确认的连线信息
  pendingConnection.value = null;

  // 即使没有临时边或图谱实例，也要清除所有状态
  if (tempEdgeId.value && graph.value) {
    try {
      // 获取当前图数据
      const currentData = graph.value.getData();
      const nodes = currentData.nodes || [];
      const edges = currentData.edges || [];

      // 过滤掉虚拟节点和临时边
      const updatedNodes = nodes.filter(
        (node) => node.id !== virtualNodeId.value,
      );
      const updatedEdges = edges.filter((edge) => edge.id !== tempEdgeId.value);

      // 更新数据
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

  // 无论如何都要清除所有状态
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
      // 如果虚拟节点不存在，清除虚拟节点ID
      virtualNodeId.value = null;
      return;
    }

    const updatedNodes = nodes.map((node) => {
      if (node.id === virtualNodeId.value) {
        // 添加平滑过渡效果，控制跟随速度
        const easing = 1; // 缓动系数，值越小跟随越慢，值越大跟随越快
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
    console.log("节点点击事件触发:", event);
    console.log("当前连线模式状态:", isConnectingMode.value);
    console.log("当前源节点ID:", sourceNodeId.value);
    console.log("当前拖拽状态:", isDragging.value);
    console.log("刚刚结束拖拽状态:", justFinishedDragging.value);

    if (isDragging.value || justFinishedDragging.value) {
      console.log("正在拖拽或刚刚结束拖拽，不处理节点点击事件");
      return;
    }

    let nodeId = null;
    let nodeData = null;

    // 在连线模式下，优先使用 mouseOverNodeId 作为目标节点ID
    if (isConnectingMode.value && mouseOverNodeId.value) {
      nodeId = mouseOverNodeId.value;
    } else {
      // 非连线模式或没有悬停节点时，从事件中获取节点ID
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

    console.log("获取到的节点ID:", nodeId);

    if (isConnectingMode.value) {
      console.log("在连线模式中，处理节点点击");
      if (nodeId && !nodeId.toString().startsWith("virtual-")) {
        console.log("点击了有效节点项，节点ID:", nodeId);
        console.log("源节点ID:", sourceNodeId.value);

        // 保存待确认的连线信息
        pendingConnection.value = {
          sourceId: sourceNodeId.value,
          targetId: nodeId,
        };

        targetNodeId.value = nodeId;

        // 固定虚线到目标节点
        fixTempEdgeToTarget(nodeId);

        // 触发 connection-complete 事件，打开关系属性面板
        // 传递目标节点ID，保持与原事件格式一致
        emit("connection-complete", nodeId);

        console.log("关系属性面板已打开，等待用户确认");
      } else {
        console.log("点击了虚拟节点或无效节点，取消连线");
        // 当点击虚拟节点时，也取消连线
        cancelConnect();
      }
    } else if (!props.isConnecting) {
      console.log("正常节点点击模式");

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
    console.log("=== 边点击事件触发 ===", event);

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
    console.log("画布点击");
    if (isConnectingMode.value || pendingConnection.value) {
      cancelConnect();
    }
    emit("graph-click");
  });

  // 使用原生 mousemove 事件来更新虚拟节点位置
  const handleNativeMouseMove = (e) => {
    if (!virtualNodeId.value || !graph.value || pendingConnection.value) {
      // 如果有待确认的连线或虚拟节点不存在，不更新虚拟节点位置
      return;
    }

    try {
      const rect = graphRef.value.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

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
          // 鼠标悬停在源节点上，设置自环边的位置
          const sourceNode = nodes.find((n) => n.id === sourceNodeId.value);
          if (sourceNode) {
            updateVirtualNodePosition(
              sourceNode.style.x + 80,
              sourceNode.style.y - 160,
            );
          }
        } else {
          // 鼠标悬停在目标节点上，将虚拟节点位置更新到目标节点位置
          const targetNode = nodes.find((n) => n.id === overNodeId);
          if (targetNode) {
            updateVirtualNodePosition(targetNode.style.x, targetNode.style.y);
          }
        }
      } else {
        // 鼠标未悬停在任何节点上，更新虚拟节点位置到鼠标当前位置
        updateVirtualNodePosition(x, y);
      }
    } catch (error) {
      console.warn("更新虚拟节点位置失败:", error);
    }
  };

  if (graphRef.value) {
    graphRef.value.addEventListener("mousemove", handleNativeMouseMove);
    console.log("已添加原生鼠标移动事件监听");
  }

  graph.value.on("node:dragstart", (event) => {
    console.log("节点拖拽开始", event);
    saveViewState();
    dragStartPosition.value = { x: event.x, y: event.y };
    isDragging.value = false;

    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    console.log("拖拽节点:", model.id, { x: model.style.x, y: model.style.y });
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

    const dragDistance = Math.sqrt(
      Math.pow(event.x - dragStartPosition.value.x, 2) +
        Math.pow(event.y - dragStartPosition.value.y, 2),
    );

    if (dragDistance > DRAG_THRESHOLD) {
      isDragging.value = true;
    }

    const model = node.getModel();
    const position = { x: event.x, y: event.y };
    console.log("拖拽节点到:", model.id, position);

    // 如果有待确认的连线，并且移动的节点是目标节点，则更新虚拟节点的位置
    if (
      pendingConnection.value &&
      virtualNodeId.value &&
      String(model.id) === String(pendingConnection.value.targetId)
    ) {
      console.log("移动的是目标节点，更新虚拟节点位置");
      updateVirtualNodePosition(position.x, position.y);
    }

    emit("node-drag", {
      type: "dragging",
      nodeId: model.id,
      data: model.data,
      position: position,
    });
  });

  graph.value.on("node:dragend", function (event) {
    console.log("===== 节点拖拽结束事件开始 =====");
    console.log("事件对象:", event);
    justFinishedDragging.value = true;
    setTimeout(() => {
      isDragging.value = false;
      justFinishedDragging.value = false;
      console.log("延迟重置拖拽状态为false");
    }, 200);

    let node = null;
    if (event.item) {
      node = event.item;
      console.log("从event.item获取节点对象");
    } else if (event.target) {
      node = event.target;
      console.log("从event.target获取节点对象");
    }

    if (node) {
      let model = null;
      if (node.getModel) {
        model = node.getModel();
        console.log("使用getModel()获取节点模型");
      } else if (node.model) {
        model = node.model;
        console.log("从node.model获取节点模型");
      } else if (event.model) {
        model = event.model;
        console.log("从event.model获取节点模型");
      } else if (node.parentNode && node.parentNode.getModel) {
        model = node.parentNode.getModel();
        console.log("从父节点获取节点模型");
      } else if (node.id) {
        console.log("尝试根据节点ID从图谱数据中查找");
        try {
          const graphData = graph.value.getData();
          const nodes = graphData.nodes || [];
          model = nodes.find((n) => n.id === node.id);
          if (model) {
            console.log("根据节点ID从图谱数据中找到模型");
          }
        } catch (error) {
          console.error("根据节点ID查找模型失败:", error);
        }
      }

      if (model) {
        let position = { x: 0, y: 0 };
        if (event.x !== undefined && event.y !== undefined) {
          position = { x: event.x, y: event.y };
          console.log("从event中获取节点位置");
        } else if (
          model.style &&
          model.style.x !== undefined &&
          model.style.y !== undefined
        ) {
          position = { x: model.style.x, y: model.style.y };
          console.log("从model.style中获取节点位置");
        } else if (model.x !== undefined && model.y !== undefined) {
          position = { x: model.x, y: model.y };
          console.log("从model中获取节点位置");
        } else if (
          node.attrs &&
          node.attrs.x !== undefined &&
          node.attrs.y !== undefined
        ) {
          position = { x: node.attrs.x, y: node.attrs.y };
          console.log("从node.attrs中获取节点位置");
        }

        console.log("节点ID:", model.id);
        console.log("节点位置:", position);

        // 如果有待确认的连线，并且移动的节点是目标节点，则更新虚拟节点的位置
        if (
          pendingConnection.value &&
          virtualNodeId.value &&
          String(model.id) === String(pendingConnection.value.targetId)
        ) {
          console.log("移动的是目标节点，更新虚拟节点位置");
          updateVirtualNodePosition(position.x, position.y);
        }

        const nodeId =
          typeof model.id === "string" ? model.id : model.id.toString();
        nodePositions.value.set(nodeId, position);
        console.log(
          `保存节点位置到本地: ${nodeId} -> x=${position.x}, y=${position.y}`,
        );
        console.log(`本地保存的节点位置数量: ${nodePositions.value.size}`);

        console.log("准备发送node-drag-end事件");
        emit("node-drag-end", {
          nodeId: model.id,
          position: position,
          data: model.data,
        });
        console.log("发送node-drag-end事件成功");
      } else {
        console.error("无法获取节点模型");
        console.log("节点对象详情:", node);
        console.log("节点对象属性:", Object.keys(node));

        let position = { x: 0, y: 0 };
        if (event.x !== undefined && event.y !== undefined) {
          position = { x: event.x, y: event.y };
          console.log("从event中获取节点位置");
        } else if (
          node.attrs &&
          node.attrs.x !== undefined &&
          node.attrs.y !== undefined
        ) {
          position = { x: node.attrs.x, y: node.attrs.y };
          console.log("从node.attrs中获取节点位置");
        } else if (node.getBBox) {
          try {
            const bbox = node.getBBox();
            position = { x: bbox.centerX, y: bbox.centerY };
            console.log("从node.getBBox()中获取节点位置");
          } catch (error) {
            console.error("获取节点边界框失败:", error);
          }
        }

        console.log("获取到的节点位置:", position);

        let nodeId = null;
        if (node.id) {
          nodeId = node.id;
          console.log("从node.id获取节点ID");
        } else if (node.cfg && node.cfg.id) {
          nodeId = node.cfg.id;
          console.log("从node.cfg.id获取节点ID");
        }

        if (nodeId && (position.x !== 0 || position.y !== 0)) {
          console.log("使用获取到的节点ID和位置");
          nodePositions.value.set(nodeId, position);
          console.log(
            `保存节点位置到本地: ${nodeId} -> x=${position.x}, y=${position.y}`,
          );

          let nodeData = {};
          try {
            const graphData = graph.value.getData();
            const nodes = graphData.nodes || [];
            const nodeDataObj = nodes.find((n) => n.id === nodeId);
            if (nodeDataObj) {
              nodeData = nodeDataObj.data || {};
            }
          } catch (error) {
            console.error("获取节点数据失败:", error);
          }

          emit("node-drag-end", {
            nodeId: nodeId,
            position: position,
            data: nodeData,
          });
          console.log("发送node-drag-end事件成功（使用节点ID和位置）");
        } else {
          console.log("无法获取节点ID或位置，尝试其他方法");

          try {
            console.log("尝试获取当前选中的节点");
            const selectedItems = graph.value.getStates("selected");
            console.log("当前选中的项目:", selectedItems);
            if (selectedItems && selectedItems.length > 0) {
              const selectedNode = selectedItems[0];
              if (selectedNode.getModel) {
                model = selectedNode.getModel();
                if (model) {
                  console.log("从选中节点获取模型成功");
                  position = {
                    x: event.x || model.style.x || model.x || 0,
                    y: event.y || model.style.y || model.y || 0,
                  };
                  const nodeId =
                    typeof model.id === "string"
                      ? model.id
                      : model.id.toString();
                  nodePositions.value.set(nodeId, position);
                  console.log(
                    `保存选中节点位置到本地: ${nodeId} -> x=${position.x}, y=${position.y}`,
                  );

                  emit("node-drag-end", {
                    nodeId: model.id,
                    position: position,
                    data: model.data,
                  });
                  console.log("发送node-drag-end事件成功（使用选中节点）");
                }
              }
            }
          } catch (error) {
            console.error("获取选中节点失败:", error);
          }
        }
      }
    } else {
      console.error("无法获取节点对象");
      if (event.x !== undefined && event.y !== undefined) {
        console.log("尝试直接从事件中获取位置信息");
        console.log("事件位置:", { x: event.x, y: event.y });
      }
    }

    console.log("===== 节点拖拽结束事件结束 =====");
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
    }
  });

  graph.value.on("canvas:dragend", () => {
    saveViewState();
  });
};

// 鼠标移动事件处理
const handleMouseMove = (event) => {
  // 这个方法保留但不使用，因为我们用 graph 的 mousemove 事件
};

const clickedNodeId = ref(null);
const selectedNodeId = ref(null);

// 处理右键点击事件
const handleContextMenu = (event) => {
  console.log("右键点击事件触发");
  event.preventDefault();

  let isNode = false;
  let nodeId = null;
  let clickedNode = null;

  if (graphRef.value && graph.value) {
    const rect = graphRef.value.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    console.log("画布坐标:", { canvasX, canvasY });

    let transformedX = canvasX;
    let transformedY = canvasY;

    try {
      if (graph.value.getCanvasByViewport) {
        const point = graph.value.getCanvasByViewport([canvasX, canvasY]);
        transformedX = point[0] || canvasX;
        transformedY = point[1] || canvasY;
        console.log("转换后的坐标:", { transformedX, transformedY });
      }
    } catch (error) {
      console.warn("坐标转换失败:", error);
    }

    try {
      const graphData = graph.value.getData();
      const nodes = graphData.nodes || [];
      console.log("G6节点数量:", nodes.length);

      for (const node of nodes) {
        // 跳过虚拟节点
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
          console.log("点击的节点ID:", nodeId);
          break;
        }
      }
    } catch (error) {
      console.warn("使用G6 API检测节点失败:", error);

      for (const node of props.nodes) {
        if (node.x !== undefined && node.y !== undefined) {
          const nodeWidth = 200;
          const nodeHeight = 100;
          const nodeLeft = node.x - nodeWidth / 2;
          const nodeTop = node.y - nodeHeight / 2;
          const nodeRight = node.x + nodeWidth / 2;
          const nodeBottom = node.y + nodeHeight / 2;

          if (
            transformedX >= nodeLeft &&
            transformedX <= nodeRight &&
            transformedY >= nodeTop &&
            transformedY <= nodeBottom
          ) {
            isNode = true;
            nodeId = node.id;
            clickedNode = node;
            console.log("点击位置在节点边界框内(降级方案):", node.id);
            break;
          }
        }
      }
    }
  }

  isNodeClick.value = isNode;
  clickedNodeId.value = nodeId;
  console.log("最终 isNodeClick 设置为:", isNodeClick.value);
  console.log("点击的节点 ID:", clickedNodeId.value);

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
        console.warn("坐标转换失败:", error);
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
  console.log("右键点击位置:", clickCanvasPosition.value);
  console.log("显示上下文菜单，isNodeClick:", isNodeClick.value);
};

// 处理点击事件
const handleClick = (event) => {
  console.log("handleClick被调用");
  console.log("事件类型:", event.type);
  console.log("事件目标:", event.target);
  console.log("当前连线模式状态:", isConnectingMode.value);
  console.log("当前拖拽状态:", isDragging.value);
  console.log("刚刚结束拖拽状态:", justFinishedDragging.value);

  if (isDragging.value || justFinishedDragging.value) {
    console.log("正在拖拽或刚刚结束拖拽，不处理点击事件");
    return;
  }

  showContextMenu.value = false;

  if (!props.isConnecting && graphRef.value && graph.value) {
    console.log("在正常模式中，通过坐标检测点击的节点");
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

    console.log("点击的画布坐标:", { canvasX, canvasY, graphX, graphY });

    let clickedOnNode = false;
    try {
      console.log("尝试使用props.nodes检测点击");
      console.log("props.nodes数量:", props.nodes.length);

      for (const node of props.nodes) {
        console.log("检查节点:", node.id);
        console.log("节点坐标:", { x: node.x, y: node.y });

        const nodeWidth = 180;
        const nodeHeight = 100;
        const halfWidth = nodeWidth / 2;
        const halfHeight = nodeHeight / 2;
        const nodeLeft = node.x - halfWidth;
        const nodeRight = node.x + halfWidth;
        const nodeTop = node.y - halfHeight;
        const nodeBottom = node.y + halfHeight;

        console.log("节点边界:", {
          left: nodeLeft,
          right: nodeRight,
          top: nodeTop,
          bottom: nodeBottom,
        });
        console.log(
          "点击是否在节点内:",
          graphX >= nodeLeft &&
            graphX <= nodeRight &&
            graphY >= nodeTop &&
            graphY <= nodeBottom,
        );

        if (
          graphX >= nodeLeft &&
          graphX <= nodeRight &&
          graphY >= nodeTop &&
          graphY <= nodeBottom
        ) {
          console.log("点击在节点", node.id, "上");
          emit("node-click", node);
          clickedOnNode = true;
          break;
        }
      }
    } catch (error) {
      console.warn("检测节点点击失败:", error);
    }

    if (!clickedOnNode) {
      console.log("点击在画布上，触发graph-click事件");
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
    restoreViewState();
    console.log("图谱大小调整成功:", { width, height });
  } catch (error) {
    console.error("调整图谱大小时出错:", error);
  }
};

// 渲染图谱 - 优化版本
const renderGraph = () => {
  console.log("进入renderGraph方法");

  if (!graph.value || !graphRef.value) {
    console.log("graph.value不存在，重新初始化图谱");
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

      if (nodePositions.value.has(nodeId)) {
        const savedPosition = nodePositions.value.get(nodeId);
        nodeX = savedPosition.x;
        nodeY = savedPosition.y;
        console.log(
          `使用本地保存的节点位置: ${nodeId} -> x=${nodeX}, y=${nodeY}`,
        );
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

      const nodeHalfWidth = nodeSize.width / 2;
      const nodeHalfHeight = nodeSize.height / 2;
      nodeX = Math.max(nodeHalfWidth, Math.min(width - nodeHalfWidth, nodeX));
      nodeY = Math.max(
        nodeHalfHeight,
        Math.min(height - nodeHalfHeight, nodeY),
      );

      console.log(
        `renderGraph节点原始ID: ${node.id}, 类型: ${typeof node.id}, 转换后ID: ${nodeId}, 类型: ${typeof nodeId}`,
      );

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

      console.log("renderGraph格式化节点:", formattedNode);
      return formattedNode;
    });

    // 获取当前图数据，保留虚拟节点和临时边
    const currentData = graph.value.getData();
    const currentNodes = currentData.nodes || [];
    const currentEdges = currentData.edges || [];

    // 保留虚拟节点
    const virtualNodes = currentNodes.filter(
      (node) => node.id && node.id.toString().startsWith("virtual-"),
    );
    console.log("保留的虚拟节点:", virtualNodes);

    // 保留临时边
    const tempEdges = currentEdges.filter(
      (edge) => edge.id && edge.id.toString().startsWith("temp-edge-"),
    );
    console.log("保留的临时边:", tempEdges);

    // 合并节点和边
    const finalNodes = [...formattedNodes, ...virtualNodes];
    const finalEdges = [...props.edges, ...tempEdges];

    console.log("更新节点数据:", finalNodes);
    console.log("更新边数据:", finalEdges);

    graph.value.setData({
      nodes: finalNodes,
      edges: finalEdges,
    });

    graph.value.render();
    restoreViewState();

    console.log("图谱重新渲染成功");
  } catch (error) {
    console.error("渲染图谱时出错:", error);
    console.log("尝试重新初始化图谱...");
    initGraph();
  }
};

// 处理添加实体
const handleAddEntity = () => {
  console.log("handleAddEntity called");
  console.log("准确位置:", clickCanvasPosition.value);

  emit("add-entity", {
    x: clickCanvasPosition.value.x,
    y: clickCanvasPosition.value.y,
  });

  showContextMenu.value = false;
};

// 处理创建关系
const handleCreateRelationship = () => {
  console.log("触发创建关系，源节点 ID:", clickedNodeId.value);

  const sourceNode = props.nodes.find(
    (node) => String(node.id) === String(clickedNodeId.value),
  );

  if (sourceNode && graph.value) {
    startConnect(clickedNodeId.value);
    console.log("连线起点:", sourceNode.x, sourceNode.y);
  } else {
    console.warn("找不到源节点或graph未初始化");
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
  } catch (error) {
    console.error("缩小操作失败:", error);
  }
};

// 监听数据变化
watch(
  [() => props.nodes, () => props.edges],
  () => {
    console.log("数据变化，重新渲染图谱");
    nextTick(() => {
      renderGraph();
    });
  },
  { deep: true },
);

// 组件挂载时初始化图谱
onMounted(() => {
  console.log("进入onMounted钩子");
  nextTick(() => {
    console.log("执行nextTick回调，初始化图谱");
    initGraph();
  });
});

// 重置连线状态，清除临时边
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
  if (graphRef.value) {
    graphRef.value.removeEventListener("mousemove", handleNativeMouseMove);
  }
});

// 暴露方法给父组件
defineExpose({
  resetConnectionState,
  clearNodeSelection,
  clearEdgesSelection,
  confirmConnection, // 暴露确认连线的方法
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

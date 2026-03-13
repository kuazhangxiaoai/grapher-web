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
    <EditorTool
      class="editor-tool"
      @clear="handleClearClick"
      @quit="handleQuitClick"
      @save-graph="handleSaveGraphClick"
    >
    </EditorTool>
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
import GraphContextMenu from "../graph/GraphContextMenu.vue";
import { VueNode } from "g6-extension-vue";
import EditorTool from "@/components/editor/EditorTool.vue";
// 内边距配置常量
const PADDING = {
  width: 20,
  label: 28,
  vertical: 18,
  horizontal: 0,
  baseHeight: 100,
  lineHeight: 25,
  minWidth: 100,
  maxWidth: 100,
  minHeight: 100,
  maxHeight: 100,
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
  "save-graph",
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

    // 直接计算节点大小，不依赖model.style.size
    const data = graph.value.getData();
    const nodeCount = (data.nodes || []).length;
    const edgeCount = (data.edges || []).filter(edge => edge.source === model.id || edge.target === model.id).length;
    // 根据节点数量动态调整最小节点大小
    const minSize = nodeCount > 30 ? 30 : 60;
    const maxSize = 120;
    const size = Math.min(maxSize, minSize + edgeCount * 10);

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
        "data-node-id": model.id,
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
          userSelect: "none",
          pointerEvents: "auto",
        },
      },
      [
        // 节点本身
        h(
          "div",
          {
            style: {
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              borderRadius: "50%",
              padding: "2px",
              border: `2px solid ${color}`,
              boxShadow: isSelected
                ? `0 6px 30px ${backGround}`
                : "0px 8px 10px 0px rgba(78,89,105,0.18)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "all 0.2s ease",
              cursor: "pointer",
              boxSizing: "border-box",
              // 关键：添加抗锯齿样式
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              textRendering: "optimizeLegibility",
              fontSmooth: "always",
            },
          },
          // 节点内部不再显示文本
        ),
        // 节点下方显示文本
        h(
          "div",
          {
            style: {
              fontSize: "13px",
              fontWeight: "500",
              color: "#000",
              marginTop: "8px",
              textAlign: "center",
              lineHeight: "1.3",
              whiteSpace: "nowrap",
              // 关键：添加抗锯齿样式
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              textRendering: "optimizeLegibility",
            },
          },
          label,
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

  // 计算高度
  const contentHeight = PADDING.baseHeight;
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

// 计算节点大小
const calculateNodeSizeByEdges = (nodeId, nodes, edges) => {
  const edgeCount = edges.filter(edge => edge.source === nodeId || edge.target === nodeId).length;
  const nodeCount = nodes.length;
  const minSize = nodeCount > 30 ? 30 : 60;
  const maxSize = 120;
  return Math.min(maxSize, minSize + edgeCount * 10);
};

// 限制节点位置在画布边界内
const clampNodePosition = (x, y, nodeHalfWidth, nodeHalfHeight) => {
  if (!graphRef.value) return { x, y };

  const canvasWidth = graphRef.value.clientWidth;
  const canvasHeight = graphRef.value.clientHeight;

  try {
    // 计算边界
    const minX = nodeHalfWidth + 10;
    const maxX = canvasWidth - nodeHalfWidth - 10;
    const minY = nodeHalfHeight + 60;
    const maxY = canvasHeight - nodeHalfHeight - 60;

    // 确保边界有效
    const validMinX = Math.min(minX, maxX);
    const validMaxX = Math.max(minX, maxX);
    const validMinY = Math.min(minY, maxY);
    const validMaxY = Math.max(minY, maxY);

    // 计算中心位置
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // 处理节点过大的情况
    if (nodeHalfWidth * 2 > canvasWidth) {
      return { x: centerX, y: Math.max(validMinY, Math.min(validMaxY, y)) };
    }
    if (nodeHalfHeight * 2 > canvasHeight) {
      return { x: Math.max(validMinX, Math.min(validMaxX, x)), y: centerY };
    }

    // 限制节点位置在边界内
    return {
      x: Math.max(validMinX, Math.min(validMaxX, x)),
      y: Math.max(validMinY, Math.min(validMaxY, y)),
    };
  } catch (error) {
    console.warn("边界计算失败:", error);
    return { x, y };
  }
};

// 检测节点是否重叠
const checkNodeOverlap = (x1, y1, size1, x2, y2, size2, margin = 20) => {
  const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  const minDistance = (size1 + size2) / 2 + margin;
  return distance < minDistance;
};

// 基于节点关系的布局算法
const calculateNodePositions = (nodes, edges, width, height) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const positions = new Map();
  const nodeSizes = new Map();
  const nodeEdgeCounts = new Map();
  const nodeConnections = new Map(); // 存储每个节点的连接关系
  
  // 计算每个节点的大小、边数和连接关系
  nodes.forEach(node => {
    const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
    const edgeCount = edges.filter(edge => edge.source === nodeId || edge.target === nodeId).length;
    const size = calculateNodeSizeByEdges(nodeId, nodes, edges);
    nodeSizes.set(nodeId, size);
    nodeEdgeCounts.set(nodeId, edgeCount);
    
    // 存储连接的节点
    const connected = new Set();
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      } else if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });
    nodeConnections.set(nodeId, connected);
  });
  
  // 识别中心节点组
  const centerNodes = [];
  const processedNodes = new Set();
  
  // 找出所有中心节点（边数大于等于3的节点）
  nodes.forEach(node => {
    const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
    const edgeCount = nodeEdgeCounts.get(nodeId) || 0;
    if (edgeCount >= 3 && !processedNodes.has(nodeId)) {
      centerNodes.push(nodeId);
      processedNodes.add(nodeId);
    }
  });
  
  // 按边数排序中心节点
  centerNodes.sort((a, b) => nodeEdgeCounts.get(b) - nodeEdgeCounts.get(a));
  
  // 布局中心节点
  centerNodes.forEach((centerNodeId, index) => {
    const size = nodeSizes.get(centerNodeId) || 60;
    let nodeX, nodeY;
    
    if (index === 0) {
      // 第一个中心节点放在画布中心
      nodeX = centerX;
      nodeY = centerY;
    } else {
      // 其他中心节点放在画布的不同区域
      const sectorAngle = (2 * Math.PI * index) / Math.min(6, centerNodes.length);
      const distance = 250; // 增加中心节点之间的距离
      nodeX = centerX + distance * Math.cos(sectorAngle);
      nodeY = centerY + distance * Math.sin(sectorAngle);
      
      // 调整位置以避免与已有节点重叠
      let attempts = 0;
      const maxAttempts = 15;
      while (attempts < maxAttempts) {
        let overlap = false;
        for (const [existingNodeId, pos] of positions) {
          const existingSize = nodeSizes.get(existingNodeId) || 60;
          if (checkNodeOverlap(nodeX, nodeY, size, pos.x, pos.y, existingSize)) {
            overlap = true;
            // 增加距离
            const currentDistance = Math.sqrt(Math.pow(nodeX - centerX, 2) + Math.pow(nodeY - centerY, 2));
            const newDistance = currentDistance + 60;
            nodeX = centerX + newDistance * Math.cos(sectorAngle);
            nodeY = centerY + newDistance * Math.sin(sectorAngle);
            break;
          }
        }
        if (!overlap) break;
        attempts++;
      }
    }
    
    // 限制在画布边界内
    const clampedCenter = clampNodePosition(nodeX, nodeY, size / 2, size / 2);
    positions.set(centerNodeId, clampedCenter);
  });
  
  // 布局与中心节点直接连接的节点
  centerNodes.forEach(centerNodeId => {
    const centerPos = positions.get(centerNodeId);
    if (!centerPos) return;
    
    const centerSize = nodeSizes.get(centerNodeId) || 60;
    const connected = nodeConnections.get(centerNodeId) || new Set();
    const connectedNodeList = Array.from(connected).filter(id => !positions.has(id));
    
    if (connectedNodeList.length > 0) {
      const radius = 150; // 增加环绕半径
      
      connectedNodeList.forEach((connectedNodeId, connIndex) => {
        if (!positions.has(connectedNodeId)) {
          const angle = (2 * Math.PI * connIndex) / connectedNodeList.length;
          const connectedSize = nodeSizes.get(connectedNodeId) || 60;
          const distance = radius + (centerSize + connectedSize) / 2;
          
          let x = centerPos.x + distance * Math.cos(angle);
          let y = centerPos.y + distance * Math.sin(angle);
          
          // 调整位置以避免重叠
          let overlap = false;
          let attempts = 0;
          const maxAttempts = 15;
          
          while (attempts < maxAttempts) {
            overlap = false;
            for (const [existingNodeId, pos] of positions) {
              const existingSize = nodeSizes.get(existingNodeId) || 60;
              if (checkNodeOverlap(x, y, connectedSize, pos.x, pos.y, existingSize)) {
                overlap = true;
                // 增加距离
                const currentDistance = Math.sqrt(Math.pow(x - centerPos.x, 2) + Math.pow(y - centerPos.y, 2));
                const newDistance = currentDistance + 40;
                x = centerPos.x + newDistance * Math.cos(angle);
                y = centerPos.y + newDistance * Math.sin(angle);
                break;
              }
            }
            if (!overlap) break;
            attempts++;
          }
          
          // 限制在画布边界内
          const clamped = clampNodePosition(x, y, connectedSize / 2, connectedSize / 2);
          positions.set(connectedNodeId, clamped);
        }
      });
    }
  });
  
  // 布局剩余的节点（没有连接或只连接一个节点的节点）
  const remainingNodes = nodes.filter(node => {
    const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
    return !positions.has(nodeId);
  });
  
  remainingNodes.forEach(node => {
    const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
    const size = nodeSizes.get(nodeId) || 60;
    
    // 均匀分布在画布中
    let attempts = 0;
    let x, y;
    let overlap;
    
    do {
      overlap = false;
      // 在画布范围内随机生成位置
      x = Math.random() * (width - size - 120) + size / 2 + 60;
      y = Math.random() * (height - size - 120) + size / 2 + 60;
      
      // 检查是否与已有节点重叠
      for (const [existingNodeId, pos] of positions) {
        const existingSize = nodeSizes.get(existingNodeId) || 60;
        if (checkNodeOverlap(x, y, size, pos.x, pos.y, existingSize)) {
          overlap = true;
          break;
        }
      }
      attempts++;
    } while (overlap && attempts < 30);
    
    // 限制在画布边界内
    const clamped = clampNodePosition(x, y, size / 2, size / 2);
    positions.set(nodeId, clamped);
  });
  
  return positions;
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

      const nodeSize = node.style.size || [100, 100];
      const halfWidth = nodeSize[0] / 2;
      const halfHeight = nodeSize[1] / 2;

      const clamped = clampNodePosition(
        node.style.x,
        node.style.y,
        halfWidth,
        halfHeight,
      );

      // 强制位置为整数，避免子像素渲染导致的模糊
      const roundedX = Math.round(clamped.x);
      const roundedY = Math.round(clamped.y);

      if (roundedX !== node.style.x || roundedY !== node.style.y) {
        needUpdate = true;
        return {
          ...node,
          style: {
            ...node.style,
            x: roundedX,
            y: roundedY,
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
        // 强制位置为整数
        const roundedX = Math.round(savedPos.x);
        const roundedY = Math.round(savedPos.y);

        if (roundedX !== node.style.x || roundedY !== node.style.y) {
          needUpdate = true;
          return {
            ...node,
            style: {
              ...node.style,
              x: roundedX,
              y: roundedY,
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
    // 预处理edges数据，确保格式正确
    const processedEdges = props.edges
      .map((edge, index) => {
        const source = edge.source;
        const target = edge.target;
        const sourceStr = source ? (typeof source === "string" ? source : source.toString()) : null;
        const targetStr = target ? (typeof target === "string" ? target : target.toString()) : null;
        return {
          ...edge,
          id: edge.id || `edge-${index}`,
          source: sourceStr,
          target: targetStr,
        };
      })
      .filter(edge => edge.source && edge.target);
    
    // 计算节点位置
    const nodePositions = calculateNodePositions(props.nodes, processedEdges, width, height);
    
    const formattedNodes = props.nodes.map((node) => {
      const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
      let nodeX, nodeY;
      
      if (nodePositions.has(nodeId)) {
        // 优先使用布局算法计算的位置
        const pos = nodePositions.get(nodeId);
        nodeX = pos.x;
        nodeY = pos.y;
      } else if (node.x && node.y) {
        // 如果布局算法没有计算位置，使用节点指定的位置
        nodeX = node.x;
        nodeY = node.y;
      } else {
        // fallback到中心位置
        nodeX = width / 2;
        nodeY = height / 2;
      }

      // 强制位置为整数
      nodeX = Math.round(nodeX);
      nodeY = Math.round(nodeY);

      const formattedNode = {
        id: nodeId,
        type: "circle",
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
          size: (d) => {
            // 不使用style.size，强制重新计算
            // 获取当前节点的关联边数量
            const data = graph.value.getData();
            const nodeCount = (data.nodes || []).length;
            const edgeCount = (data.edges || []).filter(edge => edge.source === d.id || edge.target === d.id).length;
            // 根据节点数量动态调整最小节点大小
            const minSize = nodeCount > 30 ? 30 : 60;
            const maxSize = 120;
            // 计算size，假设每多一条边+10像素
            let size = minSize + edgeCount * 10;
            if (size > maxSize) size = maxSize;
            return [size, size];
          },
          keyShape: {
            type: "circle",
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
          // 对于连接不同中心节点的边，使用二次贝塞尔曲线
          const sourceNode = props.nodes.find(n => String(n.id) === String(source));
          const targetNode = props.nodes.find(n => String(n.id) === String(target));
          if (sourceNode && targetNode) {
            const sourceEdgeCount = props.edges.filter(e => e.source === source || e.target === source).length;
            const targetEdgeCount = props.edges.filter(e => e.source === target || e.target === target).length;
            if (sourceEdgeCount >= 3 && targetEdgeCount >= 3) {
              return "line";
            }
          }
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
                  { x: nodeX + 120, y: nodeY - 240 },
                  { x: nodeX - 120, y: nodeY - 240 },
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
            // 优化连线平滑度
            lineCap: "round",
            lineJoin: "round",
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

          // 计算节点位置
          const sourceNode = props.nodes.find(n => String(n.id) === String(source));
          const targetNode = props.nodes.find(n => String(n.id) === String(target));
          
          if (sourceNode && targetNode) {
            const sourceX = sourceNode.x || 0;
            const sourceY = sourceNode.y || 0;
            const targetX = targetNode.x || 0;
            const targetY = targetNode.y || 0;
            const centerX = (sourceX + targetX) / 2;
            const centerY = (sourceY + targetY) / 2;
            
            // 检查是否是连接不同中心节点的边
            const sourceEdgeCount = props.edges.filter(e => e.source === source || e.target === source).length;
            const targetEdgeCount = props.edges.filter(e => e.source === target || e.target === target).length;
            
            if (hasReverseEdge) {
              // 双向边的处理
              if (source < target) {
                style.controlPoints = [{ x: centerX, y: centerY - 80 }];
              } else {
                style.controlPoints = [{ x: centerX, y: centerY + 80 }];
              }
            } else if (sourceEdgeCount >= 3 && targetEdgeCount >= 3) {
              // 连接两个中心节点的边，使用更明显的曲线
              const dx = targetX - sourceX;
              const dy = targetY - sourceY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const offset = Math.min(100, distance / 3);
              
              // 计算垂直于连线的方向
              const normalX = -dy / distance;
              const normalY = dx / distance;
              
              style.controlPoints = [{
                x: centerX + normalX * offset,
                y: centerY + normalY * offset
              }];
            } else if (sourceEdgeCount >= 3 || targetEdgeCount >= 3) {
              // 连接中心节点和普通节点的边
              const isSourceCenter = sourceEdgeCount >= 3;
              const centerNode = isSourceCenter ? sourceNode : targetNode;
              const otherNode = isSourceCenter ? targetNode : sourceNode;
              
              const centerPosX = centerNode.x || 0;
              const centerPosY = centerNode.y || 0;
              const otherPosX = otherNode.x || 0;
              const otherPosY = otherNode.y || 0;
              
              // 计算从中心节点到其他节点的向量
              const cx = otherPosX - centerPosX;
              const cy = otherPosY - centerPosY;
              const dist = Math.sqrt(cx * cx + cy * cy);
              
              // 在中心节点和其他节点之间添加一个控制点，使连线更加平滑
              const controlDist = dist / 3;
              const controlX = centerPosX + (cx / dist) * controlDist;
              const controlY = centerPosY + (cy / dist) * controlDist;
              
              style.controlPoints = [{ x: controlX, y: controlY }];
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
                { x: nodeX + 120, y: nodeY - 240 },
                { x: nodeX - 120, y: nodeY - 240 },
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
        pointerEvents: "none",
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
        pointerEvents: "none",
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
const updateVirtualNodePosition = (x, y, size = [100, 100]) => {
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
    showContextMenu.value = false;
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
    const nodeSize = model.style.size || [100, 100];

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
        x: Math.round(newX),
        y: Math.round(newY),
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
    showContextMenu.value = false;
  });

  // 使用原生 mousemove 事件
  const handleNativeMouseMove = (e) => {
    if (!virtualNodeId.value || !graph.value || pendingConnection.value) return;

    try {
      const [x, y] = graph.value.getCanvasByClient([e.clientX, e.clientY]);
      lastMousePos.value = { x, y };

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      let hoveredNodeId = null;

      for (const element of elements) {
        const nodeId = element.getAttribute?.("data-node-id");
        if (nodeId && !nodeId.startsWith("virtual-")) {
          hoveredNodeId = nodeId;
          break;
        }
      }

      if (hoveredNodeId) {
        const currentData = graph.value.getData();
        const allNodes = currentData.nodes || [];
        const hoveredNode = allNodes.find(
          (node) => String(node.id) === String(hoveredNodeId),
        );

        if (hoveredNode) {
          if (
            !mouseOverNodeId.value ||
            String(hoveredNode.id) !== String(mouseOverNodeId.value)
          ) {
            mouseOverNodeId.value = hoveredNode.id;
            updateVirtualNodePosition(
              hoveredNode.style.x,
              hoveredNode.style.y,
              hoveredNode.style.size || [100, 100],
            );
          }
        }
      } else {
        if (mouseOverNodeId.value) {
          mouseOverNodeId.value = null;
        }
        updateVirtualNodePosition(x, y);
      }
    } catch (error) {
      console.warn("更新虚拟节点位置失败:", error);
    }
  };

  if (graphRef.value) {
    graphRef.value.addEventListener("mousemove", handleNativeMouseMove);
  }

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

    // 预处理edges数据，确保格式正确
    const processedEdges = props.edges
      .map((edge, index) => {
        const source = edge.source;
        const target = edge.target;
        const sourceStr = source ? (typeof source === "string" ? source : source.toString()) : null;
        const targetStr = target ? (typeof target === "string" ? target : target.toString()) : null;
        return {
          ...edge,
          id: edge.id || `edge-${index}`,
          source: sourceStr,
          target: targetStr,
        };
      })
      .filter(edge => edge.source && edge.target);
    
    // 计算节点位置
    const calculatedPositions = calculateNodePositions(props.nodes, processedEdges, width, height);

    const formattedNodes = props.nodes.map((node) => {
      const nodeId = typeof node.id === "string" ? node.id : node.id.toString();
      let nodeX, nodeY;
      
      // 优先使用布局算法计算的位置
      if (calculatedPositions.has(nodeId)) {
        const pos = calculatedPositions.get(nodeId);
        nodeX = pos.x;
        nodeY = pos.y;
      } else if (!isApplyingSavedPositions.value && nodePositions.value.has(nodeId)) {
        // 其次使用保存的位置
        const savedPosition = nodePositions.value.get(nodeId);
        // 检查保存的位置是否有效
        const size = calculateNodeSizeByEdges(nodeId, props.nodes, processedEdges);
        const nodeHalfWidth = size / 2;
        const nodeHalfHeight = size / 2;
        
        if (savedPosition.x >= nodeHalfWidth + 10 && 
            savedPosition.x <= width - nodeHalfWidth - 10 && 
            savedPosition.y >= nodeHalfHeight + 60 && 
            savedPosition.y <= height - nodeHalfHeight - 60) {
          nodeX = savedPosition.x;
          nodeY = savedPosition.y;
        } else if (node.x && node.y) {
          // 如果保存的位置无效，使用节点指定的位置
          nodeX = node.x;
          nodeY = node.y;
        } else {
          // fallback到中心位置
          nodeX = width / 2;
          nodeY = height / 2;
        }
      } else if (node.x && node.y) {
        // 如果节点有指定位置，使用指定位置
        nodeX = node.x;
        nodeY = node.y;
      } else {
        // fallback到中心位置
        nodeX = width / 2;
        nodeY = height / 2;
      }

      // 强制节点位置为整数
      nodeX = Math.round(nodeX);
      nodeY = Math.round(nodeY);

      const formattedNode = {
        id: nodeId,
        type: "circle",
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
// 处理提交：向父组件抛出 submit 事件
const handleSubmitClick = () => {
  emit("submit");
};

// 处理退出：向父组件抛出 quit 事件
const handleQuitClick = () => {
  emit("quit");
};

// 处理清除：向父组件抛出 clear 事件
const handleClearClick = () => {
  emit("clear");
};
// 处理保存图谱：向父组件抛出 save-graph 事件
const handleSaveGraphClick = () => {
  emit("save-graph");
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
.editor-tool {
  position: absolute;
  bottom: 20px;
  height: 60px;
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

<style>
/* 全局抗锯齿样式 - 不影响功能 */
.g6-canvas canvas {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

[data-node-id] {
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
}
</style>

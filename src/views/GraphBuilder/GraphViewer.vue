<template>
  <div class="graph-container">
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
import { VueNode } from "g6-extension-vue";
import projectService from "@/services/graph.ts";
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
  articleId: {
    type: String,
    required: true,
  },
  nodes: {
    type: Array,
    default: () => [],
  },
  edges: {
    type: Array,
    default: () => [],
  },
  pdfLoaded: {
    type: Boolean,
    default: false,
  },
});

const graphRef = ref(null);
const graph = shallowRef(null);
const zoomLevel = ref(100);
// 使用父组件传递的nodes和edges props
const nodes = ref(props.nodes || []);
const edges = ref(props.edges || []);

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

    return h(
      "div",
      {
        "data-node-id": model.id,
        style: {
          width: "100px",
          minHeight: "100px",
          maxWidth: "100px",
          background: color,
          borderRadius: "10px",
          padding: "10px",
          border: `2px solid ${color}`,
          boxShadow: isSelected
            ? `0 6px 30px ${backGround}`
            : "0px 8px 10px 0px rgba(78,89,105,0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
          transition: "all 0.2s ease",
          cursor: "pointer",
          userSelect: "none",
          pointerEvents: "auto",
           borderRadius: "50%",
           boxSizing: "border-box",
          // 关键：添加抗锯齿样式
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
          fontSmooth: "always",
        },
      },
      [
        h(
          "div",
          {
            style: {
              fontSize: "13px",
              fontWeight: "500",
              color: "#000",
              background: color,
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              lineHeight: "1.3",
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
  const nameWidth = calculateTextWidth(name, nameFontSize) + PADDING.horizontal * 2;

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
  const totalWidth = Math.max(PADDING.minWidth, Math.min(PADDING.maxWidth, contentWidth));

  // 计算高度
  const contentHeight = PADDING.baseHeight;
  const totalHeight = Math.max(PADDING.minHeight, Math.min(PADDING.maxHeight, contentHeight));

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
    hex = hex.split("").map((char) => char + char).join("");
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
  const zoom = graph.value.getZoom ? graph.value.getZoom() : 1;

  try {
    // 计算实际画布大小（考虑缩放）
    const actualWidth = canvasWidth / zoom;
    const actualHeight = canvasHeight / zoom;
    
    // 计算边界
    const minX = nodeHalfWidth;
    const maxX = actualWidth - nodeHalfWidth;
    const minY = nodeHalfHeight;
    const maxY = actualHeight - nodeHalfHeight;

    // 确保边界有效
    const validMinX = Math.min(minX, maxX);
    const validMaxX = Math.max(minX, maxX);
    const validMinY = Math.min(minY, maxY);
    const validMaxY = Math.max(minY, maxY);

    // 计算中心位置
    const centerX = actualWidth / 2;
    const centerY = actualHeight / 2;

    // 处理节点过大的情况
    if (nodeHalfWidth * 2 > actualWidth) {
      return { x: centerX, y: Math.max(validMinY, Math.min(validMaxY, y)) };
    }
    if (nodeHalfHeight * 2 > actualHeight) {
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

      const clamped = clampNodePosition(node.style.x, node.style.y, halfWidth, halfHeight);

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
      graph.value.setData({ ...currentData, nodes: updatedNodes });
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
      graph.value.setData({ ...currentData, nodes: updatedNodes });
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
    const formattedNodes = nodes.value.map((node, index) => {
      console.log('处理节点:', node);
      
      // 确保node.id存在，如果不存在则使用nodeHash，再不存在则生成一个唯一ID
      const nodeId = node.id ? (typeof node.id === "string" ? node.id : node.id.toString()) : 
                    (node.nodeHash ? (typeof node.nodeHash === "string" ? node.nodeHash : node.nodeHash.toString()) : 
                    `node-${index}`);
      
      // 计算节点位置：如果只有一个节点，放在中心；否则使用椭圆布局均匀分布
      let nodeX, nodeY;
      const nodeCount = nodes.value.length;
      const padding = 80; // 减小内边距，增加节点分布范围
      
      // 计算画布中心
      const centerX = width / 2;
      const centerY = height / 2;
      
      if (node.x && node.y) {
        // 如果节点有指定位置，使用指定位置
        nodeX = node.x;
        nodeY = node.y;
      } else if (nodeCount === 1) {
        // 只有一个节点时放在画布中心
        nodeX = centerX;
        nodeY = centerY;
      } else {
        // 多个节点时使用圆形布局，增加节点间距离
        const radius = Math.min((width - 2 * padding) / 2, (height - 2 * padding) / 2);
        const angle = (2 * Math.PI * index) / nodeCount;
        
        // 使用圆形布局，使节点更加分散
        nodeX = centerX + radius * Math.cos(angle);
        nodeY = centerY + radius * Math.sin(angle);
      }
      
      // 确保节点不会超出画布边界
      const nodeSize = calculateNodeSize({
        data: {
          name: node.name || node.nodeName || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
        },
      });
      const nodeHalfWidth = nodeSize.width / 2;
      const nodeHalfHeight = nodeSize.height / 2;
      
      // 限制节点位置在画布边界内
      nodeX = Math.max(nodeHalfWidth + 10, Math.min(width - nodeHalfWidth - 10, nodeX));
      nodeY = Math.max(nodeHalfHeight + 60, Math.min(height - nodeHalfHeight - 60, nodeY));

      // 强制位置为整数
      nodeX = Math.round(nodeX);
      nodeY = Math.round(nodeY);

      // 使用之前计算的nodeSize变量

      const formattedNode = {
        id: nodeId,
        type: "circle",
        data: {
          name: node.name || node.nodeName || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
          backgroundColor: node.backgroundColor || node.nodeColor || "#43D7B5",
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

    // 确保连线数据中有 id 字段，并且source和target引用的节点存在
    const nodeIds = new Set(formattedNodes.map(node => node.id));
    const formattedEdges = edges.value
      .map((edge, index) => {
        console.log('处理连线:', edge);
        const source = edge.source || edge.startNodeHash;
        const target = edge.target || edge.endNodeHash;
        
        // 确保source和target是字符串格式，与节点id格式一致
        const sourceStr = source ? (typeof source === "string" ? source : source.toString()) : null;
        const targetStr = target ? (typeof target === "string" ? target : target.toString()) : null;
        
        return {
          ...edge,
          id: edge.id || edge.relationHash || `edge-${index}`,
          source: sourceStr,
          target: targetStr,
          data: edge.data || {
            name: edge.relationName || "关系",
            type: edge.relationType === "1" ? "定向" : edge.relationType === "2" ? "双向" : "循环",
            properties: edge.properties || [],
          },
        };
      })
      // 过滤掉引用不存在节点的边
      .filter(edge => edge.source && edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target));
    
    console.log('过滤后连线:', formattedEdges);

    const graphInstance = new Graph({
      container: graphRef.value,
      width: width,
      height: height,
      data: {
        nodes: formattedNodes,
        edges: formattedEdges,
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
          const hasReverseEdge = edges.value.some(
            (edge) => edge.source === target && edge.target === source,
          );
          return hasReverseEdge ? "quadratic" : "line";
        },
        style: (data) => {
          const relationshipType = data.data?.type || "定向";
          const source = data.source;
          const target = data.target;
          const hasReverseEdge = edges.value.some(
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
            const sourceNode = nodes.value.find(
              (node) => String(node.id) === String(source),
            );
            const targetNode = nodes.value.find(
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
            const sourceNode = nodes.value.find(
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

// 从接口获取图谱数据
const fetchGraphData = async () => {
  try {
    console.log('开始获取图谱数据，articleId:', props.articleId);
    const response = await projectService.getGraphByArticleId(props.articleId);
    console.log('获取图谱数据响应:', response);
    if (response && response.data) {
      console.log('图谱数据:', response.data);
      console.log('节点数据:', response.data.nodes);
      console.log('关系数据:', response.data.relations);
      nodes.value = response.data.nodes || [];
      edges.value = response.data.relations || [];
      console.log('处理后节点数据:', nodes.value);
      console.log('处理后关系数据:', edges.value);
      // 只有当PDF加载完成后才渲染节点
      if (props.pdfLoaded) {
        renderGraph();
      }
    } else {
      console.log('接口返回数据为空');
    }
  } catch (error) {
    console.error('Error fetching graph data:', error);
  }
};

// 绑定事件
const bindEvents = () => {
  if (!graph.value) return;

  window.addEventListener("resize", handleResize);

  // 监听容器大小变化
  if (graphRef.value) {
    const resizeObserver = new ResizeObserver((entries) => {
      console.log('GraphViewer 容器大小变化:', entries[0].contentRect);
      // 延迟执行，确保PDF完全加载
      setTimeout(() => {
        handleResize();
      }, 100);
    });
    resizeObserver.observe(graphRef.value);
  }

  // 节点点击事件
  graph.value.on("node:click", (event) => {
    if (isDragging.value || justFinishedDragging.value) return;

    let nodeId = null;
    let nodeData = null;

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

    if (nodeId) {
      clearNodeSelection();
      clearEdgesSelection();
      graph.value.setElementState(nodeId, ["selected"]);

      if (!nodeData) {
        const clickedNode = nodes.value.find(
          (n) => String(n.id) === String(nodeId),
        );
        if (clickedNode) {
          nodeData = clickedNode;
        }
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
        const clickedEdge = edges.value.find(
          (e) => String(e.id) === String(edgeId),
        );
        if (clickedEdge) {
          edgeData = clickedEdge;
        }
      }
    }
  });

  // 画布点击事件
  graph.value.on("canvas:click", (event) => {
    if (isDragging.value || justFinishedDragging.value) return;
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
  });

  // 拖拽过程中
  graph.value.on("node:drag", (event) => {
    const node = event.item;
    if (!node) return;

    const screenDeltaX = (event.originalEvent?.clientX || 0) - dragStartPosition.value.x;
    const screenDeltaY = (event.originalEvent?.clientY || 0) - dragStartPosition.value.y;

    const currentDragDistance = Math.sqrt(screenDeltaX * screenDeltaX + screenDeltaY * screenDeltaY);

    dragAccumulatedDistance.value = Math.max(dragAccumulatedDistance.value, currentDragDistance);

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
    const bottomRight = graph.value.getCanvasByViewport([canvasWidth, canvasHeight]);

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

    if (dragAccumulatedDistance.value > DRAG_THRESHOLD || (dragDuration > DRAG_TIME_THRESHOLD && currentDragDistance > 2)) {
      if (!isDragging.value) {
        isDragging.value = true;
      }
    }
  });

  // 拖拽结束事件
  graph.value.on("node:dragend", (event) => {
    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    const position = { x: model.style.x, y: model.style.y };

    const nodeId = typeof model.id === "string" ? model.id : model.id.toString();
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
};

// 处理窗口大小变化
const handleResize = () => {
  if (!graph.value || !graphRef.value) return;

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

  try {
    saveViewState();
    graph.value.resize(width, height);

    // 重新渲染图谱，确保节点位置重新计算
    renderGraph();

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
    console.log('开始渲染图谱，节点数量:', nodes.value.length, '连线数量:', edges.value.length);
    saveViewState();

    const width = graphRef.value.clientWidth;
    const height = graphRef.value.clientHeight;

    const formattedNodes = nodes.value.map((node, index) => {
      console.log('处理节点:', node);
      // 确保node.id存在，如果不存在则使用nodeHash，再不存在则生成一个唯一ID
      const nodeId = node.id ? (typeof node.id === "string" ? node.id : node.id.toString()) : 
                    (node.nodeHash ? (typeof node.nodeHash === "string" ? node.nodeHash : node.nodeHash.toString()) : 
                    `node-${index}`);
      
      // 计算节点位置：如果只有一个节点，放在中心；否则使用椭圆布局均匀分布
      let nodeX, nodeY;
      const nodeCount = nodes.value.length;
      const padding = 80; // 减小内边距，增加节点分布范围
      
      // 计算画布中心
      const centerX = width / 2;
      const centerY = height / 2;
      
      if (node.x && node.y) {
        // 如果节点有指定位置，使用指定位置
        nodeX = node.x;
        nodeY = node.y;
      } else if (nodeCount === 1) {
        // 只有一个节点时放在画布中心
        nodeX = centerX;
        nodeY = centerY;
      } else {
        // 多个节点时使用圆形布局，增加节点间距离
        const radius = Math.min((width - 2 * padding) / 2, (height - 2 * padding) / 2);
        const angle = (2 * Math.PI * index) / nodeCount;
        
        // 使用圆形布局，使节点更加分散
        nodeX = centerX + radius * Math.cos(angle);
        nodeY = centerY + radius * Math.sin(angle);
      }
      
      // 确保节点不会超出画布边界
      const nodeSize = calculateNodeSize({
        data: {
          name: node.name || node.nodeName || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
        },
      });
      const nodeHalfWidth = nodeSize.width / 2;
      const nodeHalfHeight = nodeSize.height / 2;
      
      // 限制节点位置在画布边界内
      nodeX = Math.max(nodeHalfWidth + 10, Math.min(width - nodeHalfWidth - 10, nodeX));
      nodeY = Math.max(nodeHalfHeight + 60, Math.min(height - nodeHalfHeight - 60, nodeY));

      // 只有当画布大小没有变化时才使用保存的位置
      if (!isApplyingSavedPositions.value && nodePositions.value.has(nodeId)) {
        const savedPosition = nodePositions.value.get(nodeId);
        // 检查保存的位置是否在当前画布边界内
        if (savedPosition.x >= nodeHalfWidth + 10 && 
            savedPosition.x <= width - nodeHalfWidth - 10 && 
            savedPosition.y >= nodeHalfHeight + 10 && 
            savedPosition.y <= height - nodeHalfHeight - 10) {
          nodeX = savedPosition.x;
          nodeY = savedPosition.y;
        }
      }

      // 强制节点位置为整数
      nodeX = Math.round(nodeX);
      nodeY = Math.round(nodeY);

      // 使用之前计算的nodeSize变量

      const formattedNode = {
        id: nodeId,
        type: "circle",
        data: {
          name: node.name || node.nodeName || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "string" },
            { name: "日期", type: "date" },
          ],
          backgroundColor: node.backgroundColor || node.nodeColor || "#43D7B5",
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

    console.log('格式化后节点:', formattedNodes);
    console.log('格式化后连线:', edges.value);

    // 确保连线数据中有 id 字段，并且source和target引用的节点存在
    const nodeIds = new Set(formattedNodes.map(node => node.id));
    const formattedEdges = edges.value
      .map((edge, index) => {
        console.log('处理连线:', edge);
        const source = edge.source || edge.startNodeHash;
        const target = edge.target || edge.endNodeHash;
        
        // 确保source和target是字符串格式，与节点id格式一致
        const sourceStr = source ? (typeof source === "string" ? source : source.toString()) : null;
        const targetStr = target ? (typeof target === "string" ? target : target.toString()) : null;
        
        return {
          ...edge,
          id: edge.id || edge.relationHash || `edge-${index}`,
          source: sourceStr,
          target: targetStr,
          data: edge.data || {
            name: edge.relationName || "关系",
            type: edge.relationType === "1" ? "定向" : edge.relationType === "2" ? "双向" : "循环",
            properties: edge.properties || [],
          },
        };
      })
      // 过滤掉引用不存在节点的边
      .filter(edge => edge.source && edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target));

    console.log('过滤后连线:', formattedEdges);

    graph.value.setData({
      nodes: formattedNodes,
      edges: formattedEdges,
    });

    graph.value.render();
    console.log('图谱渲染完成');

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

// 监听articleId变化
watch(
  () => props.articleId,
  (newArticleId) => {
    console.log('articleId 变化:', newArticleId);
    if (newArticleId) {
      fetchGraphData();
    }
  },
  { immediate: true }
);

// 监听nodes和edges变化
watch(
  [() => props.nodes, () => props.edges],
  ([newNodes, newEdges]) => {
    console.log('nodes和edges变化:', newNodes, newEdges);
    nodes.value = newNodes || [];
    edges.value = newEdges || [];
    // 只有当PDF加载完成后才渲染节点
    if (props.pdfLoaded) {
      renderGraph();
    }
  },
  { deep: true }
);

// 监听PDF加载完成事件
watch(
  () => props.pdfLoaded,
  (newValue) => {
    console.log('PDF加载状态变化:', newValue);
    if (newValue) {
      // PDF加载完成，渲染节点
      renderGraph();
    }
  }
);

// 组件挂载时初始化图谱
onMounted(() => {
  console.log('GraphViewer 组件挂载，articleId:', props.articleId);
  nextTick(() => {
    console.log('GraphViewer 组件 nextTick 执行');
    // 先获取数据，但不立即渲染
    fetchGraphData();
  });
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy();
  }
  window.removeEventListener("resize", handleResize);
});

// 暴露方法给父组件
defineExpose({
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
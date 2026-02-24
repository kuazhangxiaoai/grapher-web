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
    <!-- 自定义连线指示器 -->
    <svg v-if="isConnectingMode || connectionCompleted" class="connection-line" :style="svgStyle">
      <line
        :x1="connectionStart.x"
        :y1="connectionStart.y"
        :x2="connectionEnd.x"
        :y2="connectionEnd.y"
        stroke="#44D6B6"
        stroke-width="2"
        stroke-dasharray="5,5"
        marker-end="url(#arrow)"
      />
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 L2,5" fill="#44D6B6" />
        </marker>
      </defs>
    </svg>
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
import { ref, onMounted, onUnmounted, watch, nextTick, shallowRef, computed } from "vue";
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

// 自定义连线模式的状态
const isConnectingMode = ref(false);
const connectionCompleted = ref(false);
const connectionStart = ref({ x: 0, y: 0 });
const connectionEnd = ref({ x: 0, y: 0 });
const sourceNodeId = ref(null);

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

// 计算SVG样式
const svgStyle = computed(() => {
  if (!graphRef.value) return {};
  const rect = graphRef.value.getBoundingClientRect();
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex: 1000,
  };
});

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
  const maxRatio = Math.max(Math.abs(relativeX) / rectHalfWidth, Math.abs(relativeY) / rectHalfHeight);
  
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
    height: nodeSize.height
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
        const propType = property.type || "text";
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
  const nodeData = data.data || {};
  const name = nodeData.name || "未命名";
  const properties = nodeData.properties || {};

  let text = `\n${name}\n--------------------------\n`;

  if (Array.isArray(properties)) {
    properties.forEach((property, index) => {
      if (typeof property === "object" && property !== null) {
        const propName = property.name || `属性${index + 1}`;
        const propType = property.type || "text";
        text += `${propName}: ${propType}\n`;
      } else {
        text += `属性${index + 1}: ${property}\n`;
      }
    });
  } else if (typeof properties === "object" && properties !== null) {
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null && value.type) {
        text += `${key}: ${value.type}\n`;
      } else if (typeof value === "object" && value !== null) {
        text += `${key}: ${JSON.stringify(value)}\n`;
      } else {
        text += `${key}: ${value}\n`;
      }
    });
  } else {
    text += `${properties}\n`;
  }

  return text;
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
      const nodeX = node.x || width / 2;
      const nodeY = node.y || height / 2;

      const nodeSize = calculateNodeSize({
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "text" },
            { name: "日期", type: "date" },
          ],
        },
      });

      // 确保节点 ID 与 Home 组件中的格式一致
      const nodeId = typeof node.id === 'string' ? node.id : node.id.toString();
      console.log(`节点原始ID: ${node.id}, 类型: ${typeof node.id}, 转换后ID: ${nodeId}, 类型: ${typeof nodeId}`);
      
      const formattedNode = {
        id: nodeId,
        type: "rect",
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "text" },
            { name: "日期", type: "date" },
          ],
        },
        style: {
          x: nodeX,
          y: nodeY,
          fill: "#fff",
          stroke: "#43D7B5",
          lineWidth: 2,
          radius: 4,
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
          stroke: "#43D7B5",
          lineWidth: 2,
          radius: 4,
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
          // 检查是否存在双向连线
          const source = data.source;
          const target = data.target;
          const hasReverseEdge = props.edges.some(edge => 
            edge.source === target && edge.target === source
          );
          // 如果存在双向连线，使用二次贝塞尔曲线
          return hasReverseEdge ? "quadratic" : "line";
        },
        style: (data) => {
          const relationshipType = data.data?.type || "定向";
          const source = data.source;
          const target = data.target;
          
          // 检查是否存在双向连线
          const hasReverseEdge = props.edges.some(edge => 
            edge.source === target && edge.target === source
          );
          
          const style = {
            lineWidth: 2,
            stroke: "#44D6B6",
            label: true,
            labelText: data.data?.name || "",
            labelPlacement: "center",
            labelBackground: false,
            labelFontSize: 14,
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
            const sourceNode = props.nodes.find(node => String(node.id) === String(source));
            const targetNode = props.nodes.find(node => String(node.id) === String(target));
            
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
          key: "drag-canvas",
        },
        {
          type: "click-select",
          key: "click-select-1",
          degree: 0,
          state: "active",
          multiple: false,
          trigger: [],
        },
        {
          type: "drag-element",
          key: "drag-element",
          enable: true,
        },
      ],
      animation: false,
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

// 绑定事件
const bindEvents = () => {
  if (!graph.value) return;

  window.addEventListener("resize", handleResize);

  graph.value.on("node:click", (event) => {
    console.log("节点点击事件触发:", event);
    console.log("当前连线模式状态:", isConnectingMode.value);
    console.log("当前源节点ID:", sourceNodeId.value);
    
    if (isConnectingMode.value) {
      console.log("在连线模式中，尝试完成连线");
      // 如果在连线模式，尝试完成连线
      if (event.item) {
        console.log("点击了有效节点项");
        const model = event.item.getModel();
        console.log("点击节点的model:", model);
        console.log("点击节点ID:", model.id);
        console.log("源节点ID:", sourceNodeId.value);
        console.log("节点ID是否不同:", String(model.id) !== String(sourceNodeId.value));
        
        if (String(model.id) !== String(sourceNodeId.value)) {
          // 完成连线
          console.log("完成连线，目标节点:", model.id);
          // 固定连线终点到目标节点位置
          const targetNode = props.nodes.find(node => String(node.id) === String(model.id));
          if (targetNode) {
            // 更新连线起点：根据目标节点位置计算源节点边框上的点
            const sourceNode = props.nodes.find(node => String(node.id) === String(sourceNodeId.value));
            if (sourceNode) {
              const sourceNodeRect = getNodeRect(sourceNode);
              connectionStart.value = getPointOnRect({ x: targetNode.x, y: targetNode.y }, sourceNodeRect);
            }
            
            // 使用目标节点边框上的点作为连线终点
            const targetNodeRect = getNodeRect(targetNode);
            connectionEnd.value = getPointOnRect(connectionStart.value, targetNodeRect);
          }
          emit("connection-complete", model.id);
          // 标记连线完成，保持显示但不再跟随鼠标移动
          connectionCompleted.value = true;
          isConnectingMode.value = false;
          console.log("连线完成，保持显示，不再跟随鼠标移动");
          console.log("连线完成后状态:", { isConnectingMode: isConnectingMode.value, connectionCompleted: connectionCompleted.value, sourceNodeId: sourceNodeId.value });
        } else {
          console.log("点击了源节点本身，忽略");
        }
      } else {
        console.log("event.item为null，无法完成连线");
      }
    } else if (!props.isConnecting) {
      // 正常节点点击
      console.log("正常节点点击模式");
      let clickedNode = null;
      try {
        if (event.item) {
          const model = event.item.getModel();
          clickedNode = props.nodes.find(node => String(node.id) === String(model.id));
        }
      } catch (error) {
        console.warn("获取点击节点失败:", error);
      }
      
      if (clickedNode) {
        emit("node-click", clickedNode);
      }
    }
  });

  graph.value.on("edge:click", (event) => {
    const edge = event.item;
    const model = edge.getModel();
    console.log("边点击:", model);
    emit("edge-click", model);
  });

  graph.value.on("canvas:click", () => {
    console.log("画布点击");
    if (isConnectingMode.value) {
      // 如果在连线模式，取消连线
      cancelConnection();
    }
    emit("graph-click");
  });

  graph.value.on("node:dragstart", (event) => {
    console.log("节点拖拽开始", event);
    saveViewState();

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

    const model = node.getModel();
    const position = { x: event.x, y: event.y };
    console.log("拖拽节点到:", model.id, position);

    emit("node-drag", {
      type: "dragging",
      nodeId: model.id,
      data: model.data,
      position: position,
    });
  });

  // 增强的节点拖拽结束事件处理
  graph.value.on("node:dragend", function(event) {
    console.log("===== 节点拖拽结束事件开始 =====");
    console.log("事件对象:", event);
    
    // 尝试使用不同的方式获取节点对象
    let node = null;
    if (event.item) {
      node = event.item;
      console.log("从event.item获取节点对象");
    } else if (event.target) {
      node = event.target;
      console.log("从event.target获取节点对象");
    }
    
    if (node) {
      // 尝试使用不同的方式获取节点模型
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
        // 尝试从父节点获取模型
        model = node.parentNode.getModel();
        console.log("从父节点获取节点模型");
      } else if (node.id) {
        // 尝试根据节点ID从图谱数据中查找
        console.log("尝试根据节点ID从图谱数据中查找");
        try {
          const graphData = graph.value.getData();
          const nodes = graphData.nodes || [];
          model = nodes.find(n => n.id === node.id);
          if (model) {
            console.log("根据节点ID从图谱数据中找到模型");
          }
        } catch (error) {
          console.error("根据节点ID查找模型失败:", error);
        }
      }
      
      if (model) {
        // 尝试使用不同的方式获取节点位置
        let position = { x: 0, y: 0 };
        if (event.x !== undefined && event.y !== undefined) {
          position = { x: event.x, y: event.y };
          console.log("从event中获取节点位置");
        } else if (model.style && model.style.x !== undefined && model.style.y !== undefined) {
          position = { x: model.style.x, y: model.style.y };
          console.log("从model.style中获取节点位置");
        } else if (model.x !== undefined && model.y !== undefined) {
          position = { x: model.x, y: model.y };
          console.log("从model中获取节点位置");
        } else if (node.attrs && node.attrs.x !== undefined && node.attrs.y !== undefined) {
          position = { x: node.attrs.x, y: node.attrs.y };
          console.log("从node.attrs中获取节点位置");
        }
        
        console.log("节点ID:", model.id);
        console.log("节点位置:", position);
        
        // 保存节点位置到本地状态
        const nodeId = typeof model.id === 'string' ? model.id : model.id.toString();
        nodePositions.value.set(nodeId, position);
        console.log(`保存节点位置到本地: ${nodeId} -> x=${position.x}, y=${position.y}`);
        console.log(`本地保存的节点位置数量: ${nodePositions.value.size}`);
        
        // 直接发送事件
        console.log("准备发送node-drag-end事件");
        emit("node-drag-end", {
          nodeId: model.id,
          position: position,
          data: model.data
        });
        console.log("发送node-drag-end事件成功");
      } else {
        console.error("无法获取节点模型");
        console.log("节点对象详情:", node);
        console.log("节点对象属性:", Object.keys(node));
        
        // 尝试获取节点的位置信息
        let position = { x: 0, y: 0 };
        if (event.x !== undefined && event.y !== undefined) {
          position = { x: event.x, y: event.y };
          console.log("从event中获取节点位置");
        } else if (node.attrs && node.attrs.x !== undefined && node.attrs.y !== undefined) {
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
        
        // 尝试获取节点ID
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
          console.log(`保存节点位置到本地: ${nodeId} -> x=${position.x}, y=${position.y}`);
          
          // 尝试获取节点数据
          let nodeData = {};
          try {
            const graphData = graph.value.getData();
            const nodes = graphData.nodes || [];
            const nodeDataObj = nodes.find(n => n.id === nodeId);
            if (nodeDataObj) {
              nodeData = nodeDataObj.data || {};
            }
          } catch (error) {
            console.error("获取节点数据失败:", error);
          }
          
          emit("node-drag-end", {
            nodeId: nodeId,
            position: position,
            data: nodeData
          });
          console.log("发送node-drag-end事件成功（使用节点ID和位置）");
        } else {
          console.log("无法获取节点ID或位置，尝试其他方法");
          
          // 尝试获取当前选中的节点
          try {
            console.log("尝试获取当前选中的节点");
            const selectedItems = graph.value.getStates('selected');
            console.log("当前选中的项目:", selectedItems);
            if (selectedItems && selectedItems.length > 0) {
              const selectedNode = selectedItems[0];
              if (selectedNode.getModel) {
                model = selectedNode.getModel();
                if (model) {
                  console.log("从选中节点获取模型成功");
                  position = { x: event.x || model.style.x || model.x || 0, y: event.y || model.style.y || model.y || 0 };
                  const nodeId = typeof model.id === 'string' ? model.id : model.id.toString();
                  nodePositions.value.set(nodeId, position);
                  console.log(`保存选中节点位置到本地: ${nodeId} -> x=${position.x}, y=${position.y}`);
                  
                  emit("node-drag-end", {
                    nodeId: model.id,
                    position: position,
                    data: model.data
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
      // 尝试直接从事件中获取位置信息
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
  if (isConnectingMode.value && graphRef.value) {
    const rect = graphRef.value.getBoundingClientRect();
    // 计算鼠标在容器内的相对坐标
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // 检测鼠标是否在其他节点上
    let targetNode = null;
    let targetPos = { x: mouseX, y: mouseY };
    
    for (const node of props.nodes) {
      if (String(node.id) !== String(sourceNodeId.value)) {
        const nodeRect = getNodeRect(node);
        const nodeHalfWidth = nodeRect.width / 2;
        const nodeHalfHeight = nodeRect.height / 2;
        if (mouseX >= node.x - nodeHalfWidth &&
            mouseX <= node.x + nodeHalfWidth &&
            mouseY >= node.y - nodeHalfHeight &&
            mouseY <= node.y + nodeHalfHeight) {
          targetNode = node;
          targetPos = { x: node.x, y: node.y };
          break;
        }
      }
    }
    
    // 更新连线起点：根据目标位置计算源节点边框上的点
    const sourceNode = props.nodes.find(node => String(node.id) === String(sourceNodeId.value));
    if (sourceNode) {
      const sourceNodeRect = getNodeRect(sourceNode);
      connectionStart.value = getPointOnRect(targetPos, sourceNodeRect);
    }
    
    if (targetNode) {
      // 如果鼠标在其他节点上，计算目标节点边框上的点
      const targetNodeRect = getNodeRect(targetNode);
      connectionEnd.value = getPointOnRect(connectionStart.value, targetNodeRect);
    } else {
      // 如果鼠标不在节点上，使用鼠标坐标作为终点
      connectionEnd.value = {
        x: mouseX,
        y: mouseY,
      };
    }
  }
};

// 取消连线
const cancelConnection = () => {
  isConnectingMode.value = false;
  connectionCompleted.value = false;
  sourceNodeId.value = null;
};

// 存储当前点击的节点 ID
const clickedNodeId = ref(null);

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
    
    // 考虑缩放因素，将屏幕坐标转换为图谱坐标
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
    
    // 使用G6的API来检测点击的节点
    try {
      // 获取所有节点 - G6 v5 API
      const graphData = graph.value.getData();
      const nodes = graphData.nodes || [];
      console.log("G6节点数量:", nodes.length);
      
      for (const node of nodes) {
        const size = node.style.size || [180, 100];
        const halfWidth = size[0] / 2;
        const halfHeight = size[1] / 2;
        
        // 检查点击位置是否在节点范围内
        if (transformedX >= node.style.x - halfWidth &&
            transformedX <= node.style.x + halfWidth &&
            transformedY >= node.style.y - halfHeight &&
            transformedY <= node.style.y + halfHeight) {
          isNode = true;
          nodeId = node.id;
          clickedNode = node;
          console.log("点击的节点ID:", nodeId);
          break;
        }
      }
    } catch (error) {
      console.warn("使用G6 API检测节点失败:", error);
      
      // 降级方案：使用props中的节点数据
      for (const node of props.nodes) {
        if (node.x !== undefined && node.y !== undefined) {
          const nodeWidth = 200;
          const nodeHeight = 100;
          const nodeLeft = node.x - nodeWidth / 2;
          const nodeTop = node.y - nodeHeight / 2;
          const nodeRight = node.x + nodeWidth / 2;
          const nodeBottom = node.y + nodeHeight / 2;
          
          if (transformedX >= nodeLeft && transformedX <= nodeRight && transformedY >= nodeTop && transformedY <= nodeBottom) {
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
  
  // 重要：设置isNodeClick的值，决定右键菜单显示哪些选项
  isNodeClick.value = isNode;
  clickedNodeId.value = nodeId;
  console.log("最终 isNodeClick 设置为:", isNodeClick.value);
  console.log("点击的节点 ID:", clickedNodeId.value);

  // 设置右键菜单位置
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  };

  // 计算画布位置（用于新增实体）
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

  // 显示右键菜单
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
  
  showContextMenu.value = false;
  
  // 处理连线模式下的节点点击
  if (isConnectingMode.value && graphRef.value && graph.value) {
    console.log("在连线模式中，处理点击事件");
    const rect = graphRef.value.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    console.log("点击的画布坐标:", { canvasX, canvasY });
    
    // 检测点击是否在节点上
    try {
      console.log("尝试使用props.nodes检测点击");
      console.log("props.nodes数量:", props.nodes.length);
      
      for (const node of props.nodes) {
        console.log("检查节点:", node.id);
        console.log("节点坐标:", { x: node.x, y: node.y });
        
        // 使用默认节点大小进行检测
        const nodeWidth = 180;
        const nodeHeight = 100;
        const halfWidth = nodeWidth / 2;
        const halfHeight = nodeHeight / 2;
        const nodeLeft = node.x - halfWidth;
        const nodeRight = node.x + halfWidth;
        const nodeTop = node.y - halfHeight;
        const nodeBottom = node.y + halfHeight;
        
        console.log("节点边界:", { left: nodeLeft, right: nodeRight, top: nodeTop, bottom: nodeBottom });
        console.log("点击是否在节点内:", 
          canvasX >= nodeLeft && canvasX <= nodeRight && canvasY >= nodeTop && canvasY <= nodeBottom);
        
        if (canvasX >= nodeLeft &&
            canvasX <= nodeRight &&
            canvasY >= nodeTop &&
            canvasY <= nodeBottom) {
          // 点击在节点上
          console.log("点击在节点", node.id, "上");
          if (String(node.id) !== String(sourceNodeId.value)) {
            // 完成连线
            console.log("完成连线，目标节点:", node.id);
            // 更新连线起点：根据目标节点位置计算源节点边框上的点
            const sourceNode = props.nodes.find(n => String(n.id) === String(sourceNodeId.value));
            if (sourceNode) {
              const sourceNodeRect = getNodeRect(sourceNode);
              connectionStart.value = getPointOnRect({ x: node.x, y: node.y }, sourceNodeRect);
            }
            
            // 固定连线终点到目标节点边框上的点
            const targetNodeRect = getNodeRect(node);
            connectionEnd.value = getPointOnRect(connectionStart.value, targetNodeRect);
            emit("connection-complete", node.id);
            // 标记连线完成，保持显示但不再跟随鼠标移动
            connectionCompleted.value = true;
            isConnectingMode.value = false;
            console.log("连线完成，保持显示，不再跟随鼠标移动");
            console.log("连线完成后状态:", { isConnectingMode: isConnectingMode.value, connectionCompleted: connectionCompleted.value, sourceNodeId: sourceNodeId.value });
          } else {
            console.log("点击了源节点本身，忽略");
          }
          break;
        }
      }
    } catch (error) {
      console.warn("检测节点点击失败:", error);
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
      // 检查本地是否保存了节点位置
      const nodeId = typeof node.id === 'string' ? node.id : node.id.toString();
      let nodeX = node.x || width / 2;
      let nodeY = node.y || height / 2;
      
      // 如果本地保存了节点位置，使用保存的位置
      if (nodePositions.value.has(nodeId)) {
        const savedPosition = nodePositions.value.get(nodeId);
        nodeX = savedPosition.x;
        nodeY = savedPosition.y;
        console.log(`使用本地保存的节点位置: ${nodeId} -> x=${nodeX}, y=${nodeY}`);
      }

      const nodeSize = calculateNodeSize({
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "text" },
            { name: "日期", type: "date" },
          ],
        },
      });

      console.log(`renderGraph节点原始ID: ${node.id}, 类型: ${typeof node.id}, 转换后ID: ${nodeId}, 类型: ${typeof nodeId}`);
      
      const formattedNode = {
        id: nodeId,
        type: "rect",
        data: {
          name: node.name || "节点",
          type: node.type || "人物",
          properties: node.properties || [
            { name: "名字", type: "text" },
            { name: "日期", type: "date" },
          ],
        },
        style: {
          x: nodeX,
          y: nodeY,
          fill: "#fff",
          stroke: "#43D7B5",
          lineWidth: 2,
          radius: 4,
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

    console.log("更新节点数据:", formattedNodes);

    graph.value.setData({
      nodes: formattedNodes,
      edges: props.edges,
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

// 处理创建关系 - 使用自定义连线模式
const handleCreateRelationship = () => {
  console.log("触发创建关系，源节点 ID:", clickedNodeId.value);
  
  // 获取源节点
  const sourceNode = props.nodes.find(node => String(node.id) === String(clickedNodeId.value));
  
  if (sourceNode && graphRef.value && graph.value) {
    // 设置连线起始点
    isConnectingMode.value = true;
    connectionCompleted.value = false;
    sourceNodeId.value = clickedNodeId.value;
    
    // 使用节点边框上的点作为连线起点（相对于容器）
    const sourceNodeRect = getNodeRect(sourceNode);
    // 初始化终点为起点，使用相同的点
    const initialEndPoint = {
      x: sourceNode.x + 100, // 初始终点向右偏移100px
      y: sourceNode.y
    };
    connectionStart.value = getPointOnRect(initialEndPoint, sourceNodeRect);
    
    // 初始化终点为起点
    connectionEnd.value = { ...connectionStart.value };
    
    console.log("连线起点:", connectionStart.value);
    console.log("源节点坐标:", sourceNode.x, sourceNode.y);
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

// 重置连线状态，清除虚线
const resetConnectionState = () => {
  isConnectingMode.value = false;
  connectionCompleted.value = false;
  sourceNodeId.value = null;
  console.log("连线状态已重置，虚线已清除");
};

// 组件卸载时清理资源
onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy();
  }
  window.removeEventListener("resize", handleResize);
});

defineExpose({
  resetConnectionState
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

.connection-line {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1000;
}

.zoom-controls {
  position: absolute;
  bottom: 25px;
  right: 28px;
  display: flex;
  align-items: center;
  border-radius: 40px;
  padding:1px;
  background: #FFFFFF;
  border: 0.5px solid rgba(226,226,226,1);
  box-shadow: 0px 8px 10px 0px rgba(78,89,105,0.18);
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
  width:18px;
  height:18px;
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
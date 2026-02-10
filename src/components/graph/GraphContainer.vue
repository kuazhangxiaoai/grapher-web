<template>
  <div
    class="graph-container"
    @contextmenu="handleContextMenu"
    @click="handleClick"
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
        <span class="zoom-icon">+</span>
      </button>
      <div class="zoom-level">{{ zoomLevel }}%</div>
      <button class="zoom-btn" @click="zoomOut">
        <span class="zoom-icon">-</span>
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
  width: 20, // 宽度计算时的内边距（单边）
  label: 28, // 标签最大宽度的内边距（双边）
  vertical: 18, // 标签垂直内边距
  horizontal: 12, // 标签水平内边距
  baseHeight: 60, // 基础高度（标题 + 分隔线 + 内边距）
  lineHeight: 18, // 每行属性高度
  minWidth: 180, // 最小宽度
  maxWidth: 400, // 最大宽度
  minHeight: 70, // 最小高度
  maxHeight: 400, // 最大高度
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
});

const emit = defineEmits([
  "add-entity",
  "create-relationship",
  "node-click",
  "edge-click",
  "graph-click",
  "node-drag",
  "node-drag-end",
]);

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

  // 计算名称宽度（名称字体稍大）
  const nameFontSize = 14;
  const nameWidth = calculateTextWidth(name, nameFontSize) + PADDING.width * 2;

  // 计算属性最大宽度
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

  // 计算总宽度 = 名称宽度和属性最大宽度中的较大值
  const contentWidth = Math.max(nameWidth, maxPropertyWidth);
  const totalWidth = Math.max(
    PADDING.minWidth,
    Math.min(PADDING.maxWidth, contentWidth),
  );

  // 计算高度
  // 计算属性行数
  let propertyLines = 0;

  if (Array.isArray(properties)) {
    propertyLines = properties.length;
  } else if (typeof properties === "object" && properties !== null) {
    propertyLines = Object.keys(properties).length;
  }

  // 总高度 = 基础高度 + 属性行数 * 行高
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

  // 获取画布尺寸
  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;
  console.log("画布尺寸:", { width, height });

  // 销毁旧的图谱实例（如果存在）
  if (graph.value) {
    graph.value.destroy();
    graph.value = null;
  }

  try {
    // 转换节点数据 - 根据内容计算尺寸
    const formattedNodes = props.nodes.map((node) => {
      const nodeX = node.x || width / 2;
      const nodeY = node.y || height / 2;

      // 计算节点所需尺寸
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

      return {
        id: node.id.toString(),
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
          // 宽度和高度都自适应
          size: [nodeSize.width, nodeSize.height],
          shadowColor: "rgba(78,89,105,0.25)",
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 8,
        },
      };
    });

    console.log("格式化后的节点数据:", formattedNodes);

    // 创建新的G6实例
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
          // 宽度和高度都自适应
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
            // 根据名称长度动态调整字体大小
            const name = data.data?.name || "";
            if (name.length > 20) return 13;
            if (name.length > 15) return 14;
            return 14;
          },
          labelFill: "#333",
          labelLineHeight: PADDING.lineHeight,
          labelPadding: [PADDING.vertical, PADDING.horizontal],
          labelTextBaseline: "middle",
          // 关键：根据节点宽度动态调整标签最大宽度
          labelMaxWidth: (data) => {
            const nodeSize = calculateNodeSize(data);
            return nodeSize.width - PADDING.label; // 减去内边距
          },
        },
      },
      edge: {
        type: "line",
        style: (data) => {
          const relationshipType = data.data?.type || "directed";
          const style = {
            lineWidth: 2,
            stroke: "#409eff",
            label: true,
            labelText: data.data?.name || "",
            labelPlacement: "center",
            labelBackground: false,
            labelFontSize: 14,
          };

          if (relationshipType === "directed") {
            style.endArrow = true;
          } else if (relationshipType === "bidirectional") {
            style.startArrow = true;
            style.endArrow = true;
          } else if (relationshipType === "circular") {
            style.endArrow = true;
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

    // 渲染图谱
    graph.value.render();
    console.log("图谱渲染成功");

    // 恢复缩放状态（如果有保存的话）
    restoreViewState();

    // 绑定事件
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

    // 尝试获取当前视图中心
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

    // 设置缩放
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

  // 窗口大小变化事件
  window.addEventListener("resize", handleResize);

  // 节点点击事件
  graph.value.on("node:click", (event) => {
    const node = event.item;
    const model = node.getModel();
    console.log("节点点击:", model);
    emit("node-click", model);
  });

  // 边点击事件
  graph.value.on("edge:click", (event) => {
    const edge = event.item;
    const model = edge.getModel();
    console.log("边点击:", model);
    emit("edge-click", model);
  });

  // 画布点击事件
  graph.value.on("canvas:click", () => {
    console.log("画布点击");
    emit("graph-click");
  });

  // 节点拖拽开始事件
  graph.value.on("node:dragstart", (event) => {
    console.log("节点拖拽开始", event);
    saveViewState(); // 保存当前视图状态

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

  // 节点拖拽中事件
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

  // 节点拖拽结束事件
  graph.value.on("node:dragend", (event) => {
    console.log("节点拖拽结束", event);

    const node = event.item;
    if (!node) return;

    const model = node.getModel();
    const position = { x: model.style.x, y: model.style.y };
    console.log("节点拖拽结束:", model.id, position);

    emit("node-drag-end", {
      nodeId: model.id,
      position: position,
      data: model.data,
    });
  });

  // 鼠标进入节点时改变光标
  graph.value.on("node:mouseenter", (event) => {
    const node = event.item;
    if (node) {
      graph.value.setItemState(node, "active", true);
    }
  });

  // 鼠标离开节点时恢复状态
  graph.value.on("node:mouseleave", (event) => {
    const node = event.item;
    if (node) {
      graph.value.setItemState(node, "active", false);
    }
  });

  // 监听缩放事件，更新缩放比例显示
  graph.value.on("canvas:zoom", () => {
    if (graph.value) {
      const currentZoom = graph.value.getZoom();
      zoomLevel.value = Math.round(currentZoom * 100);
      savedZoom.value = currentZoom; // 保存缩放状态
    }
  });

  // 监听画布拖拽事件，保存视图状态
  graph.value.on("canvas:dragend", () => {
    saveViewState();
  });
};

// 处理右键点击事件
const handleContextMenu = (event) => {
  console.log("右键点击事件触发");
  event.preventDefault();

  const target = event.target;
  if (
    target &&
    (target.classList.contains("g6-node") || target.closest(".g6-node"))
  ) {
    isNodeClick.value = true;
    console.log("通过事件目标检测到节点点击，设置isNodeClick为true");
  } else {
    isNodeClick.value = false;
    console.log("通过事件目标检测到画布点击，设置isNodeClick为false");
  }

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
        isNodeClick.value = false;
      }
    } else {
      clickCanvasPosition.value = {
        x: canvasX,
        y: canvasY,
      };
      isNodeClick.value = false;
    }
  } else {
    isNodeClick.value = false;
  }

  showContextMenu.value = true;
  console.log("右键点击位置:", clickCanvasPosition.value);
  console.log("显示上下文菜单，isNodeClick:", isNodeClick.value);
};

// 处理点击事件
const handleClick = () => {
  showContextMenu.value = false;
};

// 处理窗口大小变化
const handleResize = () => {
  if (!graph.value || !graphRef.value) return;

  const width = graphRef.value.clientWidth;
  const height = graphRef.value.clientHeight;

  try {
    saveViewState(); // 保存当前视图状态
    graph.value.resize(width, height);
    restoreViewState(); // 恢复视图状态
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
    // 保存当前视图状态
    saveViewState();

    // 转换节点数据 - 根据内容计算尺寸
    const formattedNodes = props.nodes.map((node) => {
      const width = graphRef.value.clientWidth;
      const height = graphRef.value.clientHeight;

      const nodeX = node.x || width / 2;
      const nodeY = node.y || height / 2;

      // 计算节点所需尺寸
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

      return {
        id: node.id.toString(),
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
          // 宽度和高度都自适应
          size: [nodeSize.width, nodeSize.height],
          shadowColor: "rgba(78,89,105,0.18)",
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 8,
        },
      };
    });

    console.log("更新节点数据:", formattedNodes);

    // 更新图谱数据
    graph.value.setData({
      nodes: formattedNodes,
      edges: props.edges,
    });

    // 重新渲染
    graph.value.render();

    // 恢复视图状态
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
  emit("create-relationship");
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
    savedZoom.value = newZoom; // 保存缩放状态
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
    savedZoom.value = newZoom; // 保存缩放状态
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

// 组件卸载时清理资源
onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy();
  }
  window.removeEventListener("resize", handleResize);
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
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.zoom-btn::before {
  content: "🔍";
  position: absolute;
  font-size: 12px;
  opacity: 0.7;
}

.zoom-icon {
  position: relative;
  z-index: 1;
}

.zoom-btn:hover {
  background: #e0e0e0;
}

.zoom-level {
  width: 60px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  margin: 0 2px;
  min-width: 60px;
}

/* 关键修改：完全移除节点固定尺寸设置 */
:deep(.g6-node-rect) {
  cursor: move !important;
  filter: drop-shadow(0px 8px 10px rgba(78, 89, 105, 0.25));
  /* 尺寸完全由JavaScript计算自适应 */
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

/* 确保节点标签完全自适应 */
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

/* 确保节点内容区域自适应 */
:deep(.g6-node-content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  width: 100% !important;
}
</style>

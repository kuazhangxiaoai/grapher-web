<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
// import { ElMessage as Message } from "element-plus";
import { ElMessage } from "element-plus";
import LeftTemplatePanel from "@/components/editor/LeftTemplatePanel.vue";
import Content from "@/components/editor/Content.vue";
import RightPropertyPanel from "@/components/editor/RightPropertyPanel.vue";
import projectService from "@/services/graph.ts";
import { useTextStore } from "@/store/useTextStore";

const contentRef = ref(null);
const sidebarRef = ref(null);
const rightPropertyPanelRef = ref(null);

const dialogClassName2 = "graph-editor-dialog";
const props = defineProps({
  currentGraphCreateMethod:{
    type: String,
    default: "",
  },
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "图谱编辑器",
  },
  marks: {
    type: Array,
    default: () => [],
  },
  nodes: {
    type: Array,
    default: () => [],
  },
  edges: {
    type: Array,
    default: () => [],
  },
  topicId: {
    type: String,
    default: "",
  },
  sequenceId: {
    type: String,
    default: "",
  },
  articleId: {
    type: String,
    default: "",
  },
  selectedSequence: {
    type: Object,
    default: () => null,
  },
  entityTypes: {
    type: Array,
    default: () => [],
  },
  relationshipTypes: {
    type: Array,
    default: () => [],
  },
  relationTemplates: {
    type: Array,
    default: () => [],
  },
  nodeTemplates: {
    type: Array,
    default: () => [],
  },
  showReferenceText: {
    type: Boolean,
    default: true,
  },
  level: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "update:visible",
  "cancel",
  "node-drag-end",
  "add-entity-from-template",
  "update:node",
  "update:edge",
  "quit",
  "close-right",
  "submit",
  "clear",
]);

// 初始化 dialogVisible，如果 props.visible 未定义（可能是通过 v-if 挂载），则默认设置为 true
const dialogVisible = ref(props.visible !== undefined ? props.visible : true);

// 从localStorage读取状态，或使用默认值
const loadState = () => {
  const savedState = localStorage.getItem("GraphEditorPageState");
  if (savedState) {
    return JSON.parse(savedState);
  }
  return {
    currentDomain: "",
    currentSubDomain: "",
    currentTopicId: "",
    domains: [],
    subDomains: [],
    subSubDomains: [],
    hasData: false,
    graphs: [],
    graphNodes: [],
    graphEdges: [],
  };
};

const allOption = ref("全部");
const currentDomain = ref("");
const currentSubDomain = ref("");
const currentTopicId = ref("");
const domains = ref([]);
const subDomains = ref([]);
const subSubDomains = ref([]);
const newDomainName = ref("");
const showAddDialog = ref(false);
const showAddTopicDialog = ref(false);
const newTopicName = ref("");
const searchQuery = ref("");
// 原始搜索选项（从领域列表动态生成）
const originalSearchOptions = ref([]);
const searchOptions = ref([]);
// 专题搜索选项
const topicSearchOptions = ref([]);
const showPropertyPanel = ref(false);
const entityName = ref("");
const nodeName = ref("");
const entityDescription = ref("");
// const entityProperties = ref([
//   { name: "名字", type: "string", value: "" },
//   { name: "日期", type: "date", value: "" },
//   { name: "ID", type: "number", value: "" },
// ]);
const entityProperties = ref([]);
const addToComponentLibrary = ref(false);
const hasData = ref(false);
const savedEntitiesCount = ref(0);
const entityTypes = ref([]);
const relationshipTypes = ref([]);
const relationTemplates = ref([]);
const nodeTemplates = ref([]);
const backgroundColor = ref("#43D7B5");
// 当前操作类型：'entity' 或 'relationship'
const currentOperation = ref("");
// 操作来源（canvas/library）
const operationSource = ref("");
// 关系名称
const relationshipName = ref("");
// 关系名称（可编辑）
const relationName = ref("");
// 关系类型
const relationshipType = ref("");
// 关系触发词
const relationTrigger = ref("");
// 开始节点名称
const startNodeName = ref("");
// 结束节点名称
const endNodeName = ref("");
// 图谱节点
const graphNodes = ref([]);
// 图谱边数据
const graphEdges = ref([]);
// 图谱列表
const graphs = ref([]);
// 显示图谱创建对话框
const showGraphDialog = ref(false);
// 保存右键点击的位置
const rightClickPosition = ref({ x: 0, y: 0 });
// 领域列表加载状态
const isLoadingDomains = ref(false);
// 专题列表加载状态
const isLoadingTopics = ref(false);
// 模板数据加载状态
const isLoadingTemplates = ref(false);
// 组件库加载状态
const isLoadingComponents = ref(false);
// 连线模式状态
const isConnecting = ref(false);
// 源节点ID
const sourceNodeId = ref(null);
// 原始源节点ID（前端生成的）
const originalSourceNodeId = ref(null);
// 原始目标节点ID（前端生成的）
const originalTargetNodeId = ref(null);
// 目标节点ID
const targetNodeId = ref(null);
// 当前模式：'ontology' 或 'graph'
const currentMode = ref("ontology");

// 临时存储待提交的节点和连线
const pendingGraphNodes = ref([]);
const pendingGraphEdges = ref([]);

// ============ 历史搜索记录相关 ============
// 存储在不同上下文中的历史记录
const domainSearchHistory = ref([]); // 领域搜索历史
const topicSearchHistory = ref([]); // 专题搜索历史
const graphSearchHistory = ref([]); // 图谱搜索历史
// 图谱搜索选项
const graphSearchOptions = ref([]);

// 保存状态到localStorage
const saveState = () => {
  const state = {
    currentDomain: currentDomain.value,
    currentSubDomain: currentSubDomain.value,
    currentTopicId: currentTopicId.value,
    domains: domains.value,
    subDomains: subDomains.value,
    subSubDomains: subSubDomains.value,
    hasData: hasData.value,
    graphs: graphs.value,
    graphNodes: graphNodes.value,
    graphEdges: graphEdges.value,
  };
  localStorage.setItem("GraphEditorPageState", JSON.stringify(state));
};

// 监听状态变化，自动保存
watch(
  [
    currentDomain,
    currentSubDomain,
    currentTopicId,
    domains,
    subDomains,
    subSubDomains,
    hasData,
    graphs,
    graphNodes,
    graphEdges,
  ],
  () => {
    saveState();
  },
  { deep: true },
);

// 存储所有领域列表
const allDomains = ref([]);

// 监听 visible 属性变化，当弹框显示时重置表单
watch(
  () => props.visible,
  async (newValue) => {
    dialogVisible.value = newValue;
    // 当弹窗打开时，使用props传递的实体和关系类型数据
    if (newValue) {
      // 重置 RightPropertyPanel 中的 latestSequenceIdFromServer
      if (rightPropertyPanelRef.value) {
        rightPropertyPanelRef.value.resetLatestSequenceId();
      }
      
      // 首先使用props传递的数据
      entityTypes.value = props.entityTypes || [];
      relationshipTypes.value = props.relationshipTypes || [];
      relationTemplates.value = props.relationTemplates || [];
      nodeTemplates.value = props.nodeTemplates || [];
      
      // 更新 textStore.articleId
      // if (props.articleId) {
      //   textStore.setArticleId(props.articleId);
      // }
      
      console.log("弹窗打开时从props获取的实体类型数量:", entityTypes.value.length);
      console.log("弹窗打开时从props获取的关系类型数量:", relationshipTypes.value.length);
      console.log("弹窗打开时从props获取的关系模板数量:", relationTemplates.value.length);
      console.log("弹窗打开时从props获取的节点模板数量:", nodeTemplates.value.length);
      console.log("弹窗打开时从props获取的articleId:", props.articleId);
      console.log("弹窗打开时从props获取的sequenceId:", props.sequenceId);
      console.log("弹窗打开时从props获取的showReferenceText:", props.showReferenceText);
      console.log("弹窗打开时从props获取的level:", props.level);
      
      // 根据level、showReferenceText、sequenceId和articleId决定调用哪个接口
      if (props.level === 2 && props.topicId && !props.showReferenceText) {
        // 专题下(level=2)且没有参考文本时，调用getGraphByTopicId接口
        await fetchGraphByTopicId(props.topicId);
      } else if (!props.showReferenceText) {
        // 没有参考文本显示时，调用getGraphByArticleId接口
        if (props.articleId) {
          await fetchGraphByArticleId(props.articleId);
        }
      } else {
        // 有参考文本显示时，区分是点击黄线进来的还是手动选完文本点击编辑按钮进来的
        if (props.sequenceId) {
          // 点黄线进来的，调用getGraphBySequenceId接口
          await fetchGraphBySequenceId(props.sequenceId);
        }
        // 手动选完文本点击编辑按钮进来的，两个接口都不调
      }
    }
  }
);

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
  // 关闭属性面板，确保下次打开弹窗时属性面板是关闭的
  showPropertyPanel.value = false;
};

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
  graphNodes.value = [];
  graphEdges.value = [];
  pendingGraphNodes.value = [];
  pendingGraphEdges.value = [];
  hasData.value = false;
  // 关闭属性面板，确保下次打开弹窗时属性面板是关闭的
  showPropertyPanel.value = false;
};

// 组件挂载时加载状态
onMounted(async () => {
  // 使用 props 传递的数据初始化
  currentTopicId.value = props.topicId || "";
  graphNodes.value = props.nodes || [];
  graphEdges.value = props.edges || [];
  hasData.value =
    (props.nodes && props.nodes.length > 0) ||
    (props.edges && props.edges.length > 0);
  
  // 使用 props 传递的实体和关系类型数据
  entityTypes.value = props.entityTypes || [];
  relationshipTypes.value = props.relationshipTypes || [];
  relationTemplates.value = props.relationTemplates || [];
  nodeTemplates.value = props.nodeTemplates || [];

});

const openAddDialog = () => {
  showAddDialog.value = true;
};


// 存储专题列表
const topics = ref([]);

const handleAddEntity = (position) => {
  // 重置实体相关属性
  entityName.value = "";
  entityDescription.value = "";
  backgroundColor.value = "#43D7B5";
  // entityProperties.value = [
  //   { name: "名字", type: "string", value: "" },
  //   { name: "日期", type: "date", value: "" },
  //   { name: "ID", type: "number", value: "" },
  // ];
  entityProperties.value = [];
  addToComponentLibrary.value = false;
  currentOperation.value = "entity";
  currentNodeTemplateId.value = 0;
  currentRelationTemplateId.value = 0;
  if (position && (position.x !== undefined || position.y !== undefined)) {
    rightClickPosition.value = position;
    console.log("设置右键点击位置:", position);
  } else {
    // 默认位置，避免新节点出现在左上角
    rightClickPosition.value = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
    };
    console.log("使用默认位置:", rightClickPosition.value);
  }
  showPropertyPanel.value = true;
};

const handleCreateRelationship = (sourceId) => {
  console.log("开始创建关系，源节点ID:", sourceId);
  operationSource.value = "canvas";
  // 设置正在创建连线的标记
  isCreatingRelationship.value = true;
  // 设置操作来源为画布
  isFromCanvas.value = true;
  isFromComponentLibrary.value = false;
  
  // 重置关系相关属性
  relationshipName.value = "";
  relationshipType.value = "定向";
  entityDescription.value = "";
  entityProperties.value = [];
  addToComponentLibrary.value = false;

  currentOperation.value = "relationship";
  currentNodeTemplateId.value = 0;
  currentRelationTemplateId.value = 0;
  isConnecting.value = true;

  // 存储原始的源节点ID
  originalSourceNodeId.value = sourceId;
console.log(444444444444444,sourceId)
  // 查找源节点，使用其 nodeTemplateId
  const sourceNode = graphNodes.value.find(
    (node) => String(node.id) === String(sourceId),
  );

  // 尝试从组件库中查找对应的 nodeTemplateId
  let sourceTemplateId =
    sourceNode && sourceNode.nodeTemplateId
      ? Number(sourceNode.nodeTemplateId)
      : 0;
  if (!sourceTemplateId && sourceNode) {
    // 从组件库中查找对应名称的组件
    const sourceComponent = components.value.find(
      (comp) => comp.nodeTemplateName === sourceNode.name,
    );
    if (sourceComponent && sourceComponent.nodeTemplateId) {
      sourceTemplateId = Number(sourceComponent.nodeTemplateId);
      // 更新节点的 nodeTemplateId
      sourceNode.nodeTemplateId = sourceTemplateId;
    }
  }

  sourceNodeId.value = sourceTemplateId || Number(sourceId);
  console.log("进入连线模式，源节点模板ID:", sourceNodeId.value);
  console.log("源节点信息:", sourceNode);
  console.log("所有节点信息:", graphNodes.value);

  // 设置开始节点名称
  startNodeName.value = sourceNode ? sourceNode.name : "";
  endNodeName.value = "";
};

const handleClosePropertyPanel = () => {
  showPropertyPanel.value = false;

  // 关闭属性面板后，清除虚线
  if (currentOperation.value === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("关闭属性面板后，调用resetConnectionState方法清除虚线和临时连线");
    // 关闭右键菜单
    if (contentRef.value.graphContainerRef) {
      contentRef.value.graphContainerRef.showContextMenu = false;
      console.log("关闭属性面板后，关闭右键菜单");
    }
  }
  // 清除节点选中状态
  if (contentRef.value && contentRef.value.clearNodeSelection) {
    contentRef.value.clearNodeSelection();
    console.log("关闭属性面板后，清除节点选中状态");
  }
  // 清除连线选中状态
  if (contentRef.value && contentRef.value.clearEdgesSelection) {
    contentRef.value.clearEdgesSelection();
    console.log("关闭属性面板后，清除连线选中状态");
  }
  // 直接修改 graphNodes 数组，清除节点的选中状态
  // graphNodes.value = graphNodes.value.map(node => {
  //   return {
  //     ...node,
  //     state: {
  //       ...node.state,
  //       selected: false
  //     }
  //   };
  // });
  // console.log("直接修改 graphNodes 数组，清除节点的选中状态");

  // 清除模型列表选中状态
  // if (sidebarRef.value && sidebarRef.value.handleClearSelections) {
  //   sidebarRef.value.handleClearSelections();
  //   console.log("关闭属性面板后，清除模型列表选中状态");
  // }

  // 清除选中的节点和边ID
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
  // 清除选中的关系模板
  // selectedRelationshipTemplate.value = null;
  // 重置已点击关系模板的标记
  // hasClickedRelationshipTemplate.value = false;
  // 重置正在创建连线的标记
  isCreatingRelationship.value = false;

  // 退出连线模式
  isConnecting.value = false;
  // 清空源节点和目标节点ID
  sourceNodeId.value = null;
  targetNodeId.value = null;
  originalSourceNodeId.value = null;
  originalTargetNodeId.value = null;
};

const handleCancelPropertyPanel = () => {
  showPropertyPanel.value = false;

  // 取消属性面板后，清除虚线
  if (currentOperation.value === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("取消属性面板后，调用resetConnectionState方法清除虚线和临时连线");
    // 关闭右键菜单
    if (contentRef.value.graphContainerRef) {
      contentRef.value.graphContainerRef.showContextMenu = false;
      console.log("取消属性面板后，关闭右键菜单");
    }
  }

  // 清除节点选中状态
  if (contentRef.value && contentRef.value.clearNodeSelection) {
    contentRef.value.clearNodeSelection();
    console.log("取消属性面板后，清除节点选中状态");
  }
  // 清除连线选中状态
  if (contentRef.value && contentRef.value.clearEdgesSelection) {
    contentRef.value.clearEdgesSelection();
    console.log("取消属性面板后，清除连线选中状态");
  }
  // 直接修改 graphNodes 数组，清除节点的选中状态
  // graphNodes.value = graphNodes.value.map(node => {
  //   return {
  //     ...node,
  //     state: {
  //       ...node.state,
  //       selected: false
  //     }
  //   };
  // });
  // console.log("直接修改 graphNodes 数组，清除节点的选中状态");

  // 清除模型列表选中状态
  if (sidebarRef.value && sidebarRef.value.handleClearSelections) {
    sidebarRef.value.handleClearSelections();
    console.log("取消属性面板后，清除模型列表选中状态");
  }

  // 清除选中的节点和边ID
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
  // 清除选中的关系模板
  selectedRelationshipTemplate.value = null;
  // 重置已点击关系模板的标记
  hasClickedRelationshipTemplate.value = false;

  // 退出连线模式
  isConnecting.value = false;
  // 清空源节点和目标节点ID
  sourceNodeId.value = null;
  targetNodeId.value = null;
  originalSourceNodeId.value = null;
  originalTargetNodeId.value = null;
};

// 处理连接完成
const handleConnectionComplete = (targetId) => {
  console.log("连接完成，目标节点ID:", targetId);
  console.log("源节点ID:", sourceNodeId.value);
  operationSource.value = "canvas";
  // 存储原始的目标节点ID
  originalTargetNodeId.value = targetId;
console.log(555555555555,targetId)
  // 查找目标节点，使用其 nodeTemplateId
  let targetNode = graphNodes.value.find(
    (node) => String(node.id) === String(targetId),
  );
  console.log('All graph nodes:', graphNodes.value);
  console.log('Looking for target node with id:', targetId);
  console.log('Found target node:', targetNode);

  // 查找源节点
  let sourceNode = graphNodes.value.find(
    (node) => String(node.id) === String(originalSourceNodeId.value),
  );
  console.log('Looking for source node with id:', originalSourceNodeId.value);
  console.log('Found source node:', sourceNode);
  
  // 如果通过id找不到节点，尝试通过nodeHash查找
  if (!sourceNode) {
    sourceNode = graphNodes.value.find(
      (node) => String(node.nodeHash) === String(originalSourceNodeId.value),
    );
    console.log('Looking for source node by nodeHash:', originalSourceNodeId.value);
    console.log('Found source node by nodeHash:', sourceNode);
  }
  if (!targetNode) {
    targetNode = graphNodes.value.find(
      (node) => String(node.nodeHash) === String(targetId),
    );
    console.log('Looking for target node by nodeHash:', targetId);
    console.log('Found target node by nodeHash:', targetNode);
  }

  // 尝试从组件库中查找对应的 nodeTemplateId
  let targetTemplateId =
    targetNode && targetNode.nodeTemplateId
      ? Number(targetNode.nodeTemplateId)
      : 0;
  if (!targetTemplateId && targetNode) {
    // 从组件库中查找对应名称的组件
    const targetComponent = components.value.find(
      (comp) => comp.nodeTemplateName === targetNode.name,
    );
    if (targetComponent && targetComponent.nodeTemplateId) {
      targetTemplateId = Number(targetComponent.nodeTemplateId);
      // 更新节点的 nodeTemplateId
      targetNode.nodeTemplateId = targetTemplateId;
    }
  }

  targetNodeId.value = targetTemplateId || Number(targetId);
  console.log("目标节点模板ID:", targetNodeId.value);
  console.log("目标节点信息:", targetNode);

  // 验证连接是否符合选中的关系模板
  if (selectedRelationshipTemplate.value) {
    const relationshipTemplate = selectedRelationshipTemplate.value;
    
    // 获取源节点和目标节点的实体模板名称
    const sourceTemplateName = sourceNode ? (sourceNode.nodeTemplateName || sourceNode.name) : "";
    const targetTemplateName = targetNode ? (targetNode.nodeTemplateName || targetNode.name) : "";
    
    // 从关系模板中获取期望的实体模板名称
    const expectedStartNode = nodeTemplates.value.find(
      (node) => String(node.nodeTemplateId) === String(relationshipTemplate.startNodeTemplateId)
    );
    const expectedEndNode = nodeTemplates.value.find(
      (node) => String(node.nodeTemplateId) === String(relationshipTemplate.endNodeTemplateId)
    );
    
    const expectedStartName = expectedStartNode ? expectedStartNode.nodeTemplateName : "";
    const expectedEndName = expectedEndNode ? expectedEndNode.nodeTemplateName : "";
    
    // 检查节点类型是否匹配关系模板
    const isStartNodeMatch = sourceTemplateName === expectedStartName;
    const isEndNodeMatch = targetTemplateName === expectedEndName;
    
    if (!isStartNodeMatch || !isEndNodeMatch) {
      // 显示错误提示
      ElMessage.error(`连接类型不匹配！该关系只能连接 ${expectedStartName} → ${expectedEndName}`);
      
      // 退出连线模式
      isConnecting.value = false;
      // 清空源节点和目标节点ID
      sourceNodeId.value = null;
      targetNodeId.value = null;
      originalSourceNodeId.value = null;
      originalTargetNodeId.value = null;
      // 不清除选中的关系模板，保持左侧面板的选中状态
      // 这样用户可以继续使用同一个关系类型进行连接尝试
      // 清除虚线连线
      if (contentRef.value && contentRef.value.resetConnectionState) {
        contentRef.value.resetConnectionState();
      }
      return;
    }
  }

  // 设置结束节点名称
  endNodeName.value = targetNode ? targetNode.name : "";

  // 不立即退出连线模式，等待用户保存或取消关系后再退出
  // isConnecting.value = false;

  // 设置当前操作类型为关系
  currentOperation.value = "relationship";
  currentNodeTemplateId.value = 0;
  
  // 无论是否有选中的关系模板，创建新连线时关系名称都置空
  if (selectedRelationshipTemplate.value) {
    const relationshipTemplate = selectedRelationshipTemplate.value;
    relationshipName.value = relationshipTemplate.relationTemplateName;
    relationName.value = ""; // 重置关系名称为空
    
    // 设置关系类型
    let relationTypeText = "定向";
    switch (relationshipTemplate.relationTemplateType) {
      case "1":
        relationTypeText = "定向";
        break;
      case "2":
        relationTypeText = "双向";
        break;
      case "3":
        relationTypeText = "循环";
        break;
    }
    relationshipType.value = relationTypeText;
    
    // 设置关系属性
    entityProperties.value = relationshipTemplate.properties
      ? relationshipTemplate.properties.map((prop) => ({
          name: prop.propertyKey,
          type: prop.propertyType.toLowerCase(),
          value: "",
        }))
      : [];
    
    // 设置是否加入组件库
    addToComponentLibrary.value = relationshipTemplate.isLibraryFlag === "1";
    
    // 设置当前关系的模板ID
    currentRelationTemplateId.value = relationshipTemplate.relationTemplateId || 0;
  } else {
    // 没有选中的关系模板，重置为默认值
    relationshipName.value = "";
    relationName.value = "";
    relationshipType.value = "定向";
    entityDescription.value = "";
    entityProperties.value = [];
    addToComponentLibrary.value = false;
    currentRelationTemplateId.value = 0;
  }

  // 打开属性面板
  showPropertyPanel.value = true;
  console.log("打开关系属性面板");
};

const handleSavePropertyPanel = (data) => {
  showPropertyPanel.value = false;
  // 保存实体或关系的属性
  hasData.value = true;
  savedEntitiesCount.value += 1;
  // 根据当前操作类型处理
  if (data.currentOperation === "entity") {
    // 更新entityProperties变量，这样当用户再次点击同一个实体类型或组件时，属性面板会显示修改后的值
    entityProperties.value = [...data.entityProperties];
    console.log(999999999999,data,currentNodeTemplateId.value)
    if (selectedNodeId.value) {
      // 更新现有节点
      const nodeIndex = graphNodes.value.findIndex(node => node.id === selectedNodeId.value);
      if (nodeIndex !== -1) {
        // 更新节点信息
        graphNodes.value[nodeIndex] = {
          ...graphNodes.value[nodeIndex],
          name: data.nodeName || data.entityName,
          description: data.entityDescription || "",
          properties: data.entityProperties,
          backgroundColor: data.backgroundColor || "#43D7B5",
          nodeName: data.nodeName || data.entityName,
          nodeDescription: data.entityDescription || "",
          nodeColor: data.backgroundColor || "#43D7B5",
          nodeTemplateId: data.nodeTemplateId,
        };
        
        // 更新临时存储中的节点
        const pendingIndex = pendingGraphNodes.value.findIndex(node => node.id === selectedNodeId.value);
        if (pendingIndex !== -1) {
          pendingGraphNodes.value[pendingIndex] = {
            ...pendingGraphNodes.value[pendingIndex],
            name: data.nodeName || data.entityName,
            description: data.entityDescription || "",
            properties: data.entityProperties,
            backgroundColor: data.backgroundColor || "#43D7B5",
            nodeName: data.nodeName || data.entityName,
            nodeDescription: data.entityDescription || "",
            nodeColor: data.backgroundColor || "#43D7B5",
            nodeTemplateId: data.nodeTemplateId,
          };
        }
        
        // 手动触发响应式更新
        graphNodes.value = [...graphNodes.value];
        console.log("节点已更新:", graphNodes.value[nodeIndex]);
      }
    } else {
      
      // 创建新节点并添加到画布和临时存储
      const newNode = {
        type: "entity",
        name: data.nodeName || data.entityName,
        description: data.entityDescription || "",
        x: rightClickPosition.value.x,
        y: rightClickPosition.value.y,
        properties: data.entityProperties,
        backgroundColor: data.backgroundColor || "#43D7B5",
        nodeTemplateId: data.nodeTemplateId,
        isLibraryFlag: "0",
        nodeTemplateName: data.entityName,
        nodeName: data.nodeName || data.entityName,
        nodeDescription: data.entityDescription || "",
        nodeColor: data.backgroundColor || "#43D7B5",
        nodeId: "", // 后端生成
        nodeHash: "", // 后端生成
      };
      
      // 生成唯一的 id，确保每次创建都创建新节点
      const uniqueId = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
      newNode.id = uniqueId;
      // 节点的哈希值由后端生成，前端不生成
      // 第一次新增节点时nodeHash为空，当修改或连线时已经查回来了就用接口返回的

      // 添加到画布
      graphNodes.value.push(newNode);
      // 添加到临时存储
      pendingGraphNodes.value.push(newNode);

      console.log("节点已添加到画布:", newNode);
    }
  } else if (data.currentOperation === "relationship") {

    // 获取关系类型对应的数值
    const getRelationTypeValue = (type) => {
      switch (type) {
        case "定向":
          return "1";
        case "双向":
          return "2";
        case "循环":
          return "3";
        default:
          return "1";
      }
    };

    if (selectedEdgeId.value) {
      // 更新现有关系
      const edgeIndex = graphEdges.value.findIndex(edge => edge.id === selectedEdgeId.value);
      if (edgeIndex !== -1) {
        // 更新关系信息
        graphEdges.value[edgeIndex] = {
          ...graphEdges.value[edgeIndex],
          data: {
            name: data.relationName || data.relationshipName,
            type: data.relationshipType,
            properties: data.entityProperties,
          },
          relationName: data.relationName || data.relationshipName,
          relationType: getRelationTypeValue(data.relationshipType),
          relationTrigger: data.selectedTriggerWord || "",
          relationTemplateName: data.relationshipName,
          relationTemplateId: data.relationTemplateId,
        };
        
        // 更新临时存储中的关系
        const pendingIndex = pendingGraphEdges.value.findIndex(edge => edge.id === selectedEdgeId.value);
        if (pendingIndex !== -1) {
          pendingGraphEdges.value[pendingIndex] = {
            ...pendingGraphEdges.value[pendingIndex],
            data: {
              name: data.relationName || data.relationshipName,
              type: data.relationshipType,
              properties: data.entityProperties,
            },
            relationName: data.relationName || data.relationshipName,
            relationType: getRelationTypeValue(data.relationshipType),
            relationTrigger: data.selectedTriggerWord || "",
            relationTemplateName: data.relationshipName,
            relationTemplateId: data.relationTemplateId,
          };
        }
        
        // 手动触发响应式更新
        graphEdges.value = [...graphEdges.value];
        console.log("关系已更新:", graphEdges.value[edgeIndex]);
      }
    } else {
      // 新关系已由 handleUpdateNodes 从接口加载，这里不需要再添加
      // handleUpdateNodes 会在 save 事件之前被触发，已经从接口获取了最新数据
      console.log('新关系将由 handleUpdateNodes 从接口加载，跳过本地添加');

      // 清空源节点和目标节点ID，准备下一次连线
      sourceNodeId.value = null;
      targetNodeId.value = null;
      originalSourceNodeId.value = null;
      originalTargetNodeId.value = null;
      // 退出连线模式
      isConnecting.value = false;
    }
  }

  // 更新当前子领域的数量
  const currentSubDomainObj = subDomains.value.find(
    (subDomain) => subDomain.name === currentSubDomain.value,
  );
  if (currentSubDomainObj) {
    currentSubDomainObj.count += 1;
  }

  // 重置操作来源标记
  isFromComponentLibrary.value = false;
  isFromCanvas.value = false;
  isCreatingRelationship.value = false;

  // 清除节点选中状态
  if (contentRef.value && contentRef.value.clearNodeSelection) {
    contentRef.value.clearNodeSelection();
    console.log("保存属性后，清除节点选中状态");
  }
  // 清除连线选中状态
  if (contentRef.value && contentRef.value.clearEdgesSelection) {
    contentRef.value.clearEdgesSelection();
    console.log("保存属性后，清除连线选中状态");
  }
  // 清除模型列表选中状态
  // if (sidebarRef.value && sidebarRef.value.handleClearSelections) {
  //   sidebarRef.value.handleClearSelections();
  //   console.log("保存属性后，清除模型列表选中状态");
  // }

  // 清除选中的关系模板，避免后续连线时仍使用该模板进行校验
  // selectedRelationshipTemplate.value = null;
  // 重置已点击关系模板的标记
  // hasClickedRelationshipTemplate.value = false;
  console.log("保存属性后，清除选中的关系模板");

  // 保存关系后，清除虚线
  if (data.currentOperation === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("保存关系后，调用resetConnectionState方法清除虚线");
  }
};

const handleAddProperty = () => {
  // 此方法不再需要，因为属性添加逻辑已在 RightPropertyPanel 组件中本地处理
  console.log("add-property event received");
};

// 处理拖拽开始
const handleDragStart = (event, type, item) => {
  event.dataTransfer.setData("type", type);
  event.dataTransfer.setData("item", JSON.stringify(item));
};

// 处理拖拽结束
const handleDragEnd = (event) => {
  // 可以在这里添加拖拽结束后的处理逻辑
};

// 处理拖拽放置
const handleDrop = (event) => {
  event.preventDefault();
  const type = event.dataTransfer.getData("type");
  const item = JSON.parse(event.dataTransfer.getData("item"));

  // 获取目标元素的位置
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();

  // 计算相对于目标元素的坐标
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 获取模板名称（兼容字符串和对象）
  const templateName = typeof item === "string" ? item : (item.nodeTemplateName || item.name);
  
  // 获取 nodeTemplateId（如果是对象且包含 nodeTemplateId）
  const templateId = typeof item === "object" ? (item.nodeTemplateId || 0) : 0;

  // 查找对应的实体模板信息
  const entityTemplate = nodeTemplates.value.find(
    (template) => template.nodeTemplateName === templateName
  );

  // 创建新的图谱节点
  const newNode = {
    type: type,
    name: templateName,
    x: x,
    y: y,
    // 新拖拽的节点不设置description，保存后才设置
    // description: entityTemplate ? entityTemplate.nodeTemplateDescription : "",
    // 添加属性信息
    properties: entityTemplate && entityTemplate.properties ? entityTemplate.properties.map((prop) => ({
      name: prop.propertyKey,
      type: prop.propertyType.toLowerCase(),
      value: "",
    })) : [],
    // 添加节点模板ID（优先使用查找到的模板ID，其次是拖拽传递的ID）
    nodeTemplateId: entityTemplate ? entityTemplate.nodeTemplateId : templateId,
    // 添加背景颜色
    backgroundColor: entityTemplate ? entityTemplate.nodeTemplateColor : backgroundColor.value,
    // 添加库标记
    isLibraryFlag: entityTemplate ? entityTemplate.isLibraryFlag : "0",
    // 添加必要的字段
    nodeTemplateName: templateName,
    // 新拖拽的节点不设置nodeName和nodeDescription，保存后才设置
    // nodeName: typeof item === "string" ? item : item.name,
    // nodeDescription: entityTemplate ? entityTemplate.nodeTemplateDescription : "",
    nodeColor: entityTemplate ? entityTemplate.nodeTemplateColor : backgroundColor.value,
  };
  
  // 生成唯一的 id，确保每次拖拽都创建新节点
  const uniqueId = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
  newNode.id = uniqueId;
  // 节点的哈希值由后端生成，前端不生成
  // 第一次新增节点时nodeHash为空，当修改或连线时已经查回来了就用接口返回的

  // 添加到画布
  graphNodes.value.push(newNode);
  // 添加到临时存储
  pendingGraphNodes.value.push(newNode);
  hasData.value = true;
  
  // 选中新创建的节点
  selectedNodeId.value = uniqueId;
  selectedEdgeId.value = null;
  
  // 设置操作来源为画布
  isFromCanvas.value = true;
  isFromComponentLibrary.value = false;
  operationSource.value = "canvas";
  
  // 打开属性面板
  currentOperation.value = "entity";
  entityName.value = templateName;
  nodeName.value = undefined; // 设置为undefined，这样RightPropertyPanel会显示为空
  entityDescription.value = "";
  entityProperties.value = entityTemplate && entityTemplate.properties ? entityTemplate.properties.map((prop) => ({
    name: prop.propertyKey,
    type: prop.propertyType.toLowerCase(),
    value: "",
  })) : [];
  backgroundColor.value = entityTemplate ? entityTemplate.nodeTemplateColor : backgroundColor.value;
  addToComponentLibrary.value = entityTemplate ? entityTemplate.isLibraryFlag === "1" : false;
  currentNodeTemplateId.value = entityTemplate ? entityTemplate.nodeTemplateId : templateId;
  currentRelationTemplateId.value = 0;
  
  // 重置连接状态
  isConnecting.value = false;
  sourceNodeId.value = null;
  targetNodeId.value = null;
  originalSourceNodeId.value = null;
  originalTargetNodeId.value = null;
  
  showPropertyPanel.value = true;
  console.log("拖拽创建节点完成，打开属性面板:", newNode);
};

// 处理节点鼠标按下
const handleNodeMouseDown = (event, nodeId) => {
  // 处理节点鼠标按下事件
};

// 处理鼠标移动
const handleMouseMove = (event, nodeId, position) => {
  // 更新节点位置
  const node = graphNodes.value.find((n) => n.id === nodeId);
  if (node) {
    node.x = position.x;
    node.y = position.y;
  }
};

// 处理鼠标释放
const handleMouseUp = () => {
  // 处理鼠标释放事件
};


// 图谱创建相关状态
const isConfirmButtonDisabled = ref(false);


// 根据sequenceId获取图谱数据
const fetchGraphBySequenceId = async (sequenceId) => {
  try {
    // 开始加载状态
    isLoadingTemplates.value = true;
    
    // 只执行图谱数据查询，实体和关系类型数据从props获取
    const graphResponse = await projectService.getGraphBySequenceId(sequenceId);
    
    // 处理图谱数据
    if (graphResponse && graphResponse.resultCode === "0000" && graphResponse.data) {
      const { nodes, relations } = graphResponse.data;
      
      // 清空现有数据
      graphNodes.value = [];
      graphEdges.value = [];
      
      // 处理节点数据
      if (nodes && Array.isArray(nodes)) {
        // 使用实际容器大小来计算节点位置
        const getContainerSize = () => {
          // 尝试获取内容区域的实际大小
          if (contentRef.value && contentRef.value.$el) {
            const contentArea = contentRef.value.$el.querySelector('.content-area');
            if (contentArea) {
              return {
                width: contentArea.clientWidth,
                height: contentArea.clientHeight
              };
            }
          }
          // 默认值作为 fallback
          return {
            width: 800,
            height: 600
          };
        };
        const containerSize = getContainerSize();
        const containerWidth = containerSize.width;
        const containerHeight = containerSize.height;

        // 预处理关系数据，确保格式正确
        const processedRelations = relations
          ? relations.map((relation, index) => ({
              ...relation,
              id: String(relation.relationHash || `edge-${index}`),
              source: relation.startNodeHash,
              target: relation.endNodeHash,
            })).filter(relation => relation.source && relation.target)
          : [];

        // 使用基于节点关系的智能布局算法计算节点位置
        const nodePositions = calculateNodePositions(nodes, processedRelations, containerWidth, containerHeight);

        nodes.forEach((node) => {
          const nodeId = node.nodeHash;
          const pos = nodePositions.get(nodeId);
          const x = pos ? pos.x : containerWidth / 2;
          const y = pos ? pos.y : containerHeight / 2;

          // 转换节点属性格式
          const nodeProperties = node.properties ? node.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue
          })) : [];

          // 创建新节点
          const newNode = {
            id: node.nodeHash,
            type: "entity",
            name: node.nodeName,
            description: node.nodeDescription || "",
            x: x,
            y: y,
            properties: nodeProperties,
            backgroundColor: node.nodeColor || "#43D7B5",
            nodeTemplateId: node.nodeTemplateId || 0,
            isLibraryFlag: "0",
            nodeHash: node.nodeHash,
            nodeTemplateName: node.nodeTemplateName,
            nodeName: node.nodeName,
            nodeDescription: node.nodeDescription || "",
            nodeColor: node.nodeColor || "#43D7B5",
            nodeId: node.nodeId,
          };

          // 添加到节点列表
          graphNodes.value.push(newNode);
        });
      }
      
      // 处理关系数据
      if (relations && Array.isArray(relations)) {
        // 创建节点ID集合，用于快速查找
        const nodeIds = new Set(graphNodes.value.map(node => node.id));
        
        relations.forEach((relation) => {
          // 检查起始节点和结束节点是否存在
          if (!nodeIds.has(relation.startNodeHash) || !nodeIds.has(relation.endNodeHash)) {
            // 如果节点不存在，跳过该关系
            return;
          }
          
          // 转换关系属性格式
          const edgeProperties = relation.properties ? relation.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue
          })) : [];
          
          // 获取关系类型对应的显示文本
          let relationTypeText = "定向";
          switch (relation.relationType) {
            case "1":
              relationTypeText = "定向";
              break;
            case "2":
              relationTypeText = "双向";
              break;
            case "3":
              relationTypeText = "循环";
              break;
          }
          
          // 创建新关系
          const newEdge = {
            id: String(relation.relationHash),
            source: relation.startNodeHash,
            target: relation.endNodeHash,
            data: {
              name: relation.relationName,
              type: relationTypeText,
              properties: edgeProperties,
            },
            relationTemplateId: relation.relationTemplateId || 0,
            isLibraryFlag: "0",
            relationHash: relation.relationHash,
            relationName: relation.relationName,
            relationType: relation.relationType,
            relationTrigger: relation.relationTrigger || "",
            startNodeHash: relation.startNodeHash,
            endNodeHash: relation.endNodeHash,
            relationTemplateName: relation.relationTemplateName || "",
            relationId: relation.relationId,
          };
          
          // 添加到关系列表
          graphEdges.value.push(newEdge);
        });
      }
      
      // 设置有数据标志
      hasData.value = (graphNodes.value.length > 0 || graphEdges.value.length > 0);
    }
    
    // 使用从props传递的实体和关系类型数据
    entityTypes.value = props.entityTypes || [];
    relationshipTypes.value = props.relationshipTypes || [];
    relationTemplates.value = props.relationTemplates || [];
    
    console.log("从props获取的实体类型数量:", entityTypes.value.length);
    console.log("从props获取的关系类型数量:", relationshipTypes.value.length);
    console.log("从props获取的关系模板数量:", relationTemplates.value.length);
  } catch (error) {
    console.error("获取数据失败:", error);
    ElMessage.error("获取数据失败，请稍后重试");
    
    // 发生错误时，保持数据为空，显示空状态
    entityTypes.value = [];
    relationshipTypes.value = [];
    relationTemplates.value = [];
  } finally {
    // 结束加载状态
    isLoadingTemplates.value = false;
  }
};

// 根据articleId获取图谱数据
const fetchGraphByArticleId = async (articleId) => {
  try {
    // 开始加载状态
    isLoadingTemplates.value = true;
    
    // 只执行图谱数据查询，实体和关系类型数据从props获取
    const graphResponse = await projectService.getGraphByArticleId(articleId);
    
    // 处理图谱数据
    if (graphResponse && graphResponse.resultCode === "0000" && graphResponse.data) {
      const { nodes, relations } = graphResponse.data;
      
      // 清空现有数据
      graphNodes.value = [];
      graphEdges.value = [];
      
      // 处理节点数据
      if (nodes && Array.isArray(nodes)) {
        // 使用实际容器大小来计算节点位置
        const getContainerSize = () => {
          // 尝试获取内容区域的实际大小
          if (contentRef.value && contentRef.value.$el) {
            const contentArea = contentRef.value.$el.querySelector('.content-area');
            if (contentArea) {
              return {
                width: contentArea.clientWidth,
                height: contentArea.clientHeight
              };
            }
          }
          // 默认值作为 fallback
          return {
            width: 800,
            height: 600
          };
        };
        const containerSize = getContainerSize();
        const containerWidth = containerSize.width;
        const containerHeight = containerSize.height;

        // 预处理关系数据，确保格式正确
        const processedRelations = relations
          ? relations.map((relation, index) => ({
              ...relation,
              id: String(relation.relationHash || `edge-${index}`),
              source: relation.startNodeHash,
              target: relation.endNodeHash,
            })).filter(relation => relation.source && relation.target)
          : [];

        // 使用基于节点关系的智能布局算法计算节点位置
        const nodePositions = calculateNodePositions(nodes, processedRelations, containerWidth, containerHeight);

        nodes.forEach((node) => {
          const nodeId = node.nodeHash;
          const pos = nodePositions.get(nodeId);
          const x = pos ? pos.x : containerWidth / 2;
          const y = pos ? pos.y : containerHeight / 2;

          // 转换节点属性格式
          const nodeProperties = node.properties ? node.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue
          })) : [];

          // 创建新节点
          const newNode = {
            id: node.nodeHash,
            type: "entity",
            name: node.nodeName,
            description: node.nodeDescription || "",
            x: x,
            y: y,
            properties: nodeProperties,
            backgroundColor: node.nodeColor || "#43D7B5",
            nodeTemplateId: node.nodeTemplateId || 0,
            isLibraryFlag: "0",
            nodeHash: node.nodeHash,
            nodeTemplateName: node.nodeTemplateName,
            nodeName: node.nodeName,
            nodeDescription: node.nodeDescription || "",
            nodeColor: node.nodeColor || "#43D7B5",
            nodeId: node.nodeId,
          };

          // 添加到节点列表
          graphNodes.value.push(newNode);
        });
      }

      // 处理关系数据
      if (relations && Array.isArray(relations)) {
        // 创建节点ID集合，用于快速查找
        const nodeIds = new Set(graphNodes.value.map(node => node.id));
        
        relations.forEach((relation) => {
          // 检查起始节点和结束节点是否存在
          if (!nodeIds.has(relation.startNodeHash) || !nodeIds.has(relation.endNodeHash)) {
            // 如果节点不存在，跳过该关系
            return;
          }
          
          // 转换关系属性格式
          const edgeProperties = relation.properties ? relation.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue
          })) : [];
          
          // 获取关系类型对应的显示文本
          let relationTypeText = "定向";
          switch (relation.relationType) {
            case "1":
              relationTypeText = "定向";
              break;
            case "2":
              relationTypeText = "双向";
              break;
            case "3":
              relationTypeText = "循环";
              break;
          }
          
          // 创建新关系
          const newEdge = {
            id: String(relation.relationHash),
            source: relation.startNodeHash,
            target: relation.endNodeHash,
            data: {
              name: relation.relationName,
              type: relationTypeText,
              properties: edgeProperties,
            },
            relationTemplateId: relation.relationTemplateId || 0,
            isLibraryFlag: "0",
            relationHash: relation.relationHash,
            relationName: relation.relationName,
            relationType: relation.relationType,
            relationTrigger: relation.relationTrigger || "",
            startNodeHash: relation.startNodeHash,
            endNodeHash: relation.endNodeHash,
            relationTemplateName: relation.relationTemplateName || "",
            relationId: relation.relationId,
          };
          
          // 添加到关系列表
          graphEdges.value.push(newEdge);
        });
      }
      
      // 设置有数据标志
      hasData.value = (graphNodes.value.length > 0 || graphEdges.value.length > 0);
    }
    
    // 使用从props传递的实体和关系类型数据
    entityTypes.value = props.entityTypes || [];
    relationshipTypes.value = props.relationshipTypes || [];
    relationTemplates.value = props.relationTemplates || [];
    
    console.log("从props获取的实体类型数量:", entityTypes.value.length);
    console.log("从props获取的关系类型数量:", relationshipTypes.value.length);
    console.log("从props获取的关系模板数量:", relationTemplates.value.length);
  } catch (error) {
    console.error("获取数据失败:", error);
    ElMessage.error("获取数据失败，请稍后重试");
    
    // 发生错误时，保持数据为空，显示空状态
    entityTypes.value = [];
    relationshipTypes.value = [];
    relationTemplates.value = [];
  } finally {
    // 结束加载状态
    isLoadingTemplates.value = false;
  }
};

// ============ 节点布局算法相关 ============
// 根据边数计算节点大小
const calculateNodeSizeByEdges = (nodeId, nodes, edges) => {
  const edgeCount = edges.filter(edge => edge.source === nodeId || edge.target === nodeId).length;
  const nodeCount = nodes.length;
  const minSize = nodeCount > 30 ? 30 : 60;
  const maxSize = 120;
  return Math.min(maxSize, minSize + edgeCount * 10);
};

// 限制节点位置在画布边界内
const clampNodePosition = (x, y, nodeHalfWidth, nodeHalfHeight, width, height) => {
  // 如果没有提供宽度和高度，使用默认值
  let canvasWidth = width || 800;
  let canvasHeight = height || 600;

  // 确保画布宽度有效
  canvasWidth = Math.max(100, canvasWidth);

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
const checkNodeOverlap = (x1, y1, size1, x2, y2, size2, margin = 60) => {
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
    const nodeId = node.id ? (typeof node.id === "string" ? node.id : node.id.toString()) :
                  (node.nodeHash ? (typeof node.nodeHash === "string" ? node.nodeHash : node.nodeHash.toString()) :
                  `node-${nodes.indexOf(node)}`);
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

  // 找出所有中心节点（边数大于等于1的节点，确保至少有一个中心节点）
  nodes.forEach(node => {
    const nodeId = node.id ? (typeof node.id === "string" ? node.id : node.id.toString()) :
                  (node.nodeHash ? (typeof node.nodeHash === "string" ? node.nodeHash : node.nodeHash.toString()) :
                  `node-${nodes.indexOf(node)}`);
    const edgeCount = nodeEdgeCounts.get(nodeId) || 0;
    if (edgeCount >= 1 && !processedNodes.has(nodeId)) {
      centerNodes.push(nodeId);
      processedNodes.add(nodeId);
    }
  });

  // 如果没有中心节点（所有节点都没有边），至少选择一个节点作为中心
  if (centerNodes.length === 0 && nodes.length > 0) {
    const firstNode = nodes[0];
    const nodeId = firstNode.id ? (typeof firstNode.id === "string" ? firstNode.id : firstNode.id.toString()) :
                  (firstNode.nodeHash ? (typeof firstNode.nodeHash === "string" ? firstNode.nodeHash : firstNode.nodeHash.toString()) :
                  `node-0`);
    centerNodes.push(nodeId);
    processedNodes.add(nodeId);
  }

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
    const clampedCenter = clampNodePosition(nodeX, nodeY, size / 2, size / 2, width, height);
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
      const radius = 250; // 增加环绕半径，确保节点不会在连线上

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
                const newDistance = currentDistance + 60; // 增加每次调整的距离
                x = centerPos.x + newDistance * Math.cos(angle);
                y = centerPos.y + newDistance * Math.sin(angle);
                break;
              }
            }
            if (!overlap) break;
            attempts++;
          }

          // 限制在画布边界内
          const clamped = clampNodePosition(x, y, connectedSize / 2, connectedSize / 2, width, height);
          positions.set(connectedNodeId, clamped);
        }
      });
    }
  });

  // 布局剩余的节点（没有连接或只连接一个节点的节点）
  const remainingNodes = nodes.filter(node => {
    const nodeId = node.id ? (typeof node.id === "string" ? node.id : node.id.toString()) :
                  (node.nodeHash ? (typeof node.nodeHash === "string" ? node.nodeHash : node.nodeHash.toString()) :
                  `node-${nodes.indexOf(node)}`);
    return !positions.has(nodeId);
  });

  remainingNodes.forEach(node => {
    const nodeId = node.id ? (typeof node.id === "string" ? node.id : node.id.toString()) :
                  (node.nodeHash ? (typeof node.nodeHash === "string" ? node.nodeHash : node.nodeHash.toString()) :
                  `node-${nodes.indexOf(node)}`);
    const size = nodeSizes.get(nodeId) || 60;

    // 在画布中心区域生成位置，避免出现在边缘
    let attempts = 0;
    let x, y;
    let overlap;

    do {
      overlap = false;
      // 在画布中心区域生成位置，限制在画布中心的60%范围内
      const centerAreaWidth = width * 0.6;
      const centerAreaHeight = height * 0.6;
      const centerOffsetX = (width - centerAreaWidth) / 2;
      const centerOffsetY = (height - centerAreaHeight) / 2;

      x = centerOffsetX + Math.random() * (centerAreaWidth - size - 80) + size / 2 + 40;
      y = centerOffsetY + Math.random() * (centerAreaHeight - size - 80) + size / 2 + 40;

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
    const clamped = clampNodePosition(x, y, size / 2, size / 2, width, height);
    positions.set(nodeId, clamped);
  });

  return positions;
};
// ============ 节点布局算法相关结束 ============

// 根据topicId获取图谱数据
const fetchGraphByTopicId = async (topicId) => {
  try {
    // 开始加载状态
    isLoadingTemplates.value = true;
    
    // 只执行图谱数据查询，实体和关系类型数据从props获取
    const graphResponse = await projectService.getGraphByTopicId(topicId);
    
    // 处理图谱数据
    if (graphResponse && graphResponse.resultCode === "0000" && graphResponse.data) {
      const { nodes, relations } = graphResponse.data;
      
      // 清空现有数据
      graphNodes.value = [];
      graphEdges.value = [];
      
      // 处理节点数据
      if (nodes && Array.isArray(nodes)) {
        // 使用实际容器大小来计算节点位置
        const getContainerSize = () => {
          // 尝试获取内容区域的实际大小
          if (contentRef.value && contentRef.value.$el) {
            const contentArea = contentRef.value.$el.querySelector('.content-area');
            if (contentArea) {
              return {
                width: contentArea.clientWidth,
                height: contentArea.clientHeight
              };
            }
          }
          // 默认值作为 fallback
          return {
            width: 800,
            height: 600
          };
        };
        const containerSize = getContainerSize();
        const containerWidth = containerSize.width;
        const containerHeight = containerSize.height;

        // 预处理关系数据，确保格式正确
        const processedRelations = relations
          ? relations.map((relation, index) => ({
              ...relation,
              id: String(relation.relationHash || `edge-${index}`),
              source: relation.startNodeHash,
              target: relation.endNodeHash,
            })).filter(relation => relation.source && relation.target)
          : [];

        // 使用基于节点关系的智能布局算法计算节点位置
        const nodePositions = calculateNodePositions(nodes, processedRelations, containerWidth, containerHeight);

        nodes.forEach((node) => {
          const nodeId = node.nodeHash;
          const pos = nodePositions.get(nodeId);
          const x = pos ? pos.x : containerWidth / 2;
          const y = pos ? pos.y : containerHeight / 2;

          // 转换节点属性格式
          const nodeProperties = node.properties ? node.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue
          })) : [];

          // 创建新节点
          const newNode = {
            id: node.nodeHash,
            type: "entity",
            name: node.nodeName,
            description: node.nodeDescription || "",
            x: x,
            y: y,
            properties: nodeProperties,
            backgroundColor: node.nodeColor || "#43D7B5",
            nodeTemplateId: node.nodeTemplateId || 0,
            isLibraryFlag: "0",
            nodeHash: node.nodeHash,
            nodeTemplateName: node.nodeTemplateName,
            nodeName: node.nodeName,
            nodeDescription: node.nodeDescription || "",
            nodeColor: node.nodeColor || "#43D7B5",
            nodeId: node.nodeId,
          };

          // 添加到节点列表
          graphNodes.value.push(newNode);
        });
      }
      
      // 处理关系数据
      if (relations && Array.isArray(relations)) {
        // 创建节点ID集合，用于快速查找
        const nodeIds = new Set(graphNodes.value.map(node => node.id));
        
        relations.forEach((relation) => {
          // 检查起始节点和结束节点是否存在
          if (!nodeIds.has(relation.startNodeHash) || !nodeIds.has(relation.endNodeHash)) {
            // 如果节点不存在，跳过该关系
            return;
          }
          
          // 转换关系属性格式
          const edgeProperties = relation.properties ? relation.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue
          })) : [];
          
          // 获取关系类型对应的显示文本
          let relationTypeText = "定向";
          switch (relation.relationType) {
            case "1":
              relationTypeText = "定向";
              break;
            case "2":
              relationTypeText = "双向";
              break;
            case "3":
              relationTypeText = "循环";
              break;
          }
          
          // 创建新关系
          const newEdge = {
            id: String(relation.relationHash),
            source: relation.startNodeHash,
            target: relation.endNodeHash,
            data: {
              name: relation.relationName,
              type: relationTypeText,
              properties: edgeProperties,
            },
            relationTemplateId: relation.relationTemplateId || 0,
            isLibraryFlag: "0",
            relationHash: relation.relationHash,
            relationName: relation.relationName,
            relationType: relation.relationType,
            relationTrigger: relation.relationTrigger || "",
            startNodeHash: relation.startNodeHash,
            endNodeHash: relation.endNodeHash,
            relationTemplateName: relation.relationTemplateName || "",
            relationId: relation.relationId,
          };
          
          // 添加到关系列表
          graphEdges.value.push(newEdge);
        });
      }
      
      // 设置有数据标志
      hasData.value = (graphNodes.value.length > 0 || graphEdges.value.length > 0);
    }
    
    // 使用从props传递的实体和关系类型数据
    entityTypes.value = props.entityTypes || [];
    relationshipTypes.value = props.relationshipTypes || [];
    relationTemplates.value = props.relationTemplates || [];
    
    console.log("从props获取的实体类型数量:", entityTypes.value.length);
    console.log("从props获取的关系类型数量:", relationshipTypes.value.length);
    console.log("从props获取的关系模板数量:", relationTemplates.value.length);
  } catch (error) {
    console.error("获取数据失败:", error);
    ElMessage.error("获取数据失败，请稍后重试");
    
    // 发生错误时，保持数据为空，显示空状态
    entityTypes.value = [];
    relationshipTypes.value = [];
    relationTemplates.value = [];
  } finally {
    // 结束加载状态
    isLoadingTemplates.value = false;
  }
};

// 处理添加组件到实体类型
const handleAddEntityType = (componentName) => {
  // 检查实体类型中是否已存在该组件名称
  if (!entityTypes.value.includes(componentName)) {
    // 添加到实体类型中
    entityTypes.value.push(componentName);
  }
};

// 处理节点拖拽结束
const handleNodeDragEnd = (data) => {
  console.log("Home组件接收到节点拖拽结束事件:", data);
  console.log(
    "接收到的nodeId类型:",
    typeof data.nodeId,
    "nodeId值:",
    data.nodeId,
  );
  console.log("当前graphNodes:", graphNodes.value);

  // 遍历所有节点，找到并更新对应节点
  let nodeFound = false;
  for (let i = 0; i < graphNodes.value.length; i++) {
    const node = graphNodes.value[i];
    console.log(`检查节点 ${i}: id=${node.id}, 类型=${typeof node.id}`);

    // 尝试多种匹配方式
    if (node.id === data.nodeId || String(node.id) === String(data.nodeId)) {
      console.log("找到匹配节点:", node);
      // 更新节点位置
      graphNodes.value[i] = {
        ...node,
        x: data.position.x,
        y: data.position.y,
      };
      console.log("更新后的节点:", graphNodes.value[i]);
      nodeFound = true;
      break;
    }
  }

  if (nodeFound) {
    // 手动触发响应式更新
    graphNodes.value = [...graphNodes.value];
    console.log("触发响应式更新");
    // 手动保存状态
    saveState();
    console.log("保存状态到localStorage");
  } else {
    console.log("未找到对应节点，节点位置未更新");
  }

  // 触发 node-drag-end 事件，传递数据给父组件
  emit("node-drag-end", data);
};

// 处理模式变化
const handleModeChange = (mode) => {
  currentMode.value = mode;
  // 切换模式时隐藏属性面板
  showPropertyPanel.value = false;
};

// 处理实体类型点击
const handleEntityTypeClick = (template) => {
  console.log("点击实体类型:", template);
  console.log("Before setting showPropertyPanel:", showPropertyPanel.value);

  // 设置操作来源为非组件库
  isFromComponentLibrary.value = false;
  // 设置操作来源为非画布
  isFromCanvas.value = false;
  operationSource.value = "library";
  // 设置 LeftTemplatePanel 组件中的选中状态
  if (sidebarRef.value && sidebarRef.value.setSelectedEntityType) {
    sidebarRef.value.setSelectedEntityType(template.nodeTemplateId);
    console.log("设置实体类型选中状态:", template.nodeTemplateId);
  }

  // 清除之前的选中状态
  if (contentRef.value) {
    contentRef.value.clearNodeSelection();
    // contentRef.value.clearEdgesSelection();
  }

  // 高亮画布中所有使用此模板创建的节点（通过 nodeTemplateId 匹配）
  if (contentRef.value && contentRef.value.graphContainerRef) {
    const graph = contentRef.value.graphContainerRef.graph;
    if (graph) {
      const nodes = graph.getData().nodes || [];
      nodes.forEach((node) => {
        if (node.nodeTemplateId === template.nodeTemplateId) {
          graph.setElementState(node.id, ["selected"]);
        }
      });
    }
  }

  // 打开属性面板，设置当前操作类型为实体
  currentOperation.value = "entity";
  entityName.value = template.nodeTemplateName;

  // 使用传入的模板信息
  if (template) {
    console.log("找到实体模板:", template);
    // 设置实体描述（如果有）
    entityDescription.value = template.nodeTemplateDescription || template.description || "";
    // 设置实体属性
    if (template.properties && Array.isArray(template.properties)) {
      entityProperties.value = template.properties.map((prop) => ({
        name: prop.propertyKey,
        type: prop.propertyType.toLowerCase(),
        value: "",
      }));
    } else {
      entityProperties.value = [];
    }
    // 设置背景颜色
    backgroundColor.value = template.nodeTemplateColor || template.backgroundColor || "#43D7B5";
    // 设置是否加入组件库
    addToComponentLibrary.value = template.isLibraryFlag === "1";
    // 设置当前节点的模板ID
    currentNodeTemplateId.value = template.nodeTemplateId || 0;
    currentRelationTemplateId.value = 0;
  } else {
    console.log("未找到实体模板");
    // 如果找不到模板信息，重置默认值
    entityDescription.value = "";
    entityProperties.value = [];
    backgroundColor.value = "#43D7B5";
    addToComponentLibrary.value = false;
    currentNodeTemplateId.value = 0;
    currentRelationTemplateId.value = 0;
  }

  showPropertyPanel.value = true;
  console.log("After setting showPropertyPanel:", showPropertyPanel.value);
};

// 处理关系类型点击
const handleRelationshipTypeClick = (template) => {
  console.log("点击关系类型:", template);
  console.log("Before setting showPropertyPanel:", showPropertyPanel.value);

  // 设置操作来源为非组件库
  isFromComponentLibrary.value = false;
  // 设置操作来源为非画布
  isFromCanvas.value = false;
  operationSource.value = "library";
  // 设置 LeftTemplatePanel 组件中的选中状态
  if (sidebarRef.value && sidebarRef.value.setSelectedRelationshipType) {
    sidebarRef.value.setSelectedRelationshipType(template.relationTemplateId);
    console.log("设置关系类型选中状态:", template.relationTemplateId);
  }

  // 清除之前的选中状态
  if (contentRef.value) {
    // contentRef.value.clearNodeSelection();
    contentRef.value.clearEdgesSelection();
  }

  // 高亮画布中所有使用此模板创建的连线（通过 relationTemplateId 匹配）
  if (contentRef.value && contentRef.value.graphContainerRef) {
    const graph = contentRef.value.graphContainerRef.graph;
    if (graph) {
      const edges = graph.getData().edges || [];
      edges.forEach((edge) => {
        if (edge.relationTemplateId === template.relationTemplateId) {
          graph.setElementState(edge.id, ["selected"]);
        }
      });
    }
  }

  // 打开属性面板，设置当前操作类型为关系
  currentOperation.value = "relationship";
  relationshipName.value = template.relationTemplateName;

  // 使用传入的模板信息
  if (template) {
    // 存储当前选中的关系模板
    selectedRelationshipTemplate.value = template;
    // 标记已点击了关系模板
    hasClickedRelationshipTemplate.value = true;
    
    // 设置关系类型
    let relationTypeText = "定向";
    switch (template.relationTemplateType) {
      case "1":
        relationTypeText = "定向";
        break;
      case "2":
        relationTypeText = "双向";
        break;
      case "3":
        relationTypeText = "循环";
        break;
    }
    relationshipType.value = relationTypeText;
    // 设置关系属性
    entityProperties.value = template.properties
      ? template.properties.map((prop) => ({
          name: prop.propertyKey,
          type: prop.propertyType.toLowerCase(),
          value: "",
        }))
      : [];
    // 设置是否加入组件库
    addToComponentLibrary.value = template.isLibraryFlag === "1";
    // 设置当前关系的模板ID
    currentRelationTemplateId.value = template.relationTemplateId || 0;
    currentNodeTemplateId.value = 0;

    // 设置开始和结束节点名称
    const startNode = nodeTemplates.value.find(
      (node) =>
        String(node.nodeTemplateId) === String(template.startNodeTemplateId),
    );
    const endNode = nodeTemplates.value.find(
      (node) =>
        String(node.nodeTemplateId) === String(template.endNodeTemplateId),
    );
    startNodeName.value = startNode ? startNode.nodeTemplateName : "";
    endNodeName.value = endNode ? endNode.nodeTemplateName : "";
  } else {
    // 如果找不到模板信息，重置默认值
    selectedRelationshipTemplate.value = null;
    relationshipType.value = "定向";
    entityProperties.value = [];
    addToComponentLibrary.value = false;
    currentRelationTemplateId.value = 0;
    currentNodeTemplateId.value = 0;
    startNodeName.value = "";
    endNodeName.value = "";
  }

  showPropertyPanel.value = true;
  console.log("After setting showPropertyPanel:", showPropertyPanel.value);
};

// 处理组件点击
const handleComponentClick = (componentName) => {
  console.log("点击组件:", componentName);
  console.log("Before setting showPropertyPanel:", showPropertyPanel.value);

  // 设置操作来源为组件库
  operationSource.value = "library";
  isFromComponentLibrary.value = true;
  // 设置操作来源为非画布
  isFromCanvas.value = false;

  // 设置 LeftTemplatePanel 组件中的选中状态
  if (sidebarRef.value && sidebarRef.value.setSelectedComponent) {
    sidebarRef.value.setSelectedComponent(componentName);
    console.log("设置组件选中状态:", componentName);
  }

  // 清除之前的选中状态
  // if (contentRef.value) {
  //   contentRef.value.clearNodeSelection();
  //   contentRef.value.clearEdgesSelection();
  // }

  // 高亮画布中所有对应组件的元素
  if (contentRef.value && contentRef.value.graphContainerRef) {
    const graph = contentRef.value.graphContainerRef.graph;
    if (graph) {
      // 检查节点
      const nodes = graph.getData().nodes || [];
      nodes.forEach((node) => {
        if (node.data && node.data.name === componentName) {
          graph.setElementState(node.id, ["selected"]);
        }
      });

      // 检查连线
      const edges = graph.getData().edges || [];
      edges.forEach((edge) => {
        if (edge.data && edge.data.name === componentName) {
          graph.setElementState(edge.id, ["selected"]);
        }
      });
    }
  }

  // 从components数组中查找对应的组件信息
  const component = components.value.find(
    (comp) =>
      comp.nodeTemplateName === componentName ||
      comp.relationTemplateName === componentName,
  );

  if (component) {
    // 判断是实体组件还是关系组件
    const isEntityComponent = component.nodeTemplateId !== undefined;
    const isRelationshipComponent = component.relationTemplateId !== undefined;

    if (isEntityComponent) {
      // 实体组件
      currentOperation.value = "entity";
      entityName.value = component.nodeTemplateName;
      // 设置实体描述（如果有）
      entityDescription.value = component.nodeTemplateDescription || "";
      // 设置实体属性
      entityProperties.value = component.properties
        ? component.properties.map((prop) => ({
            name: prop.propertyKey,
            type: prop.propertyType.toLowerCase(),
            value: "",
          }))
        : [];
      // 设置背景颜色
      backgroundColor.value = component.nodeTemplateColor || "#43D7B5";
      // 设置是否加入组件库
      addToComponentLibrary.value = component.isLibraryFlag === "1";
      // 设置当前节点的模板ID
      currentNodeTemplateId.value = component.nodeTemplateId || 0;
      currentRelationTemplateId.value = 0;
    } else if (isRelationshipComponent) {
      // 关系组件
      currentOperation.value = "relationship";
      relationshipName.value = component.relationTemplateName;
      // 设置关系类型
      relationshipType.value = component.relationTemplateType
        ? {
            1: "定向",
            2: "双向",
            3: "循环",
          }[component.relationTemplateType] || "定向"
        : "定向";
      // 设置关系属性
      entityProperties.value = component.properties
        ? component.properties.map((prop) => ({
            name: prop.propertyKey,
            type: prop.propertyType.toLowerCase(),
            value: "",
          }))
        : [];
      // 设置是否加入组件库
      addToComponentLibrary.value = component.isLibraryFlag === "1";
      // 设置当前关系的模板ID
      currentRelationTemplateId.value = component.relationTemplateId || 0;
      currentNodeTemplateId.value = 0;
    }
  } else {
    // 如果找不到组件信息，默认按实体处理
    currentOperation.value = "entity";
    entityName.value = componentName;
    entityDescription.value = "";
    entityProperties.value = [];
    backgroundColor.value = "#43D7B5";
    addToComponentLibrary.value = false;
    currentNodeTemplateId.value = 0;
    currentRelationTemplateId.value = 0;
  }

  showPropertyPanel.value = true;
  console.log("After setting showPropertyPanel:", showPropertyPanel.value);
};

// 处理组件库搜索
const handleComponentLibrarySearch = async (query) => {
  // 设置加载状态
  isLoadingComponents.value = true;
  try {
    const response = await projectService.queryLibraryTemplate(query);
    if (response && response.data) {
      // 合并节点模板和关系模板
      const allComponents = [];
      if (
        response.data.nodeTemplates &&
        Array.isArray(response.data.nodeTemplates)
      ) {
        allComponents.push(...response.data.nodeTemplates);
      }
      if (
        response.data.relationTemplates &&
        Array.isArray(response.data.relationTemplates)
      ) {
        allComponents.push(...response.data.relationTemplates);
      }
      components.value = allComponents;
    } else {
      components.value = [];
    }
  } catch (error) {
    console.error("搜索组件库失败:", error);
    components.value = [];
  } finally {
    // 结束加载状态
    isLoadingComponents.value = false;
  }
};

// 处理添加组件到模型
const handleAddComponentToModel = async (component) => {
  try {
    // Determine template type
    const templateType = component.nodeTemplateId ? "node" : "relation";
    const templateId = component.nodeTemplateId || component.relationTemplateId;

    // Call addToModel API
    await projectService.addToModel({
      topicId: currentTopicId.value,
      templateId: templateId,
      templateType: templateType,
    });

    // After successful addition, re-query template data to update lists
    await handleTopicClick(
      {
        id: currentTopicId.value,
        name: currentSubDomain.value,
      },
      true,
    );
    ElMessage.success("添加成功");
  } catch (error) {
    // ElMessage.error("添加失败，请重试");
    console.error("添加组件到模型失败:", error);
  }
};

// 存储当前选中的节点或连线的模板ID
const currentNodeTemplateId = ref(0);
const currentRelationTemplateId = ref(0);

// 标记当前操作是否来自组件库
const isFromComponentLibrary = ref(false);
// 标记当前操作是否来自画布
const isFromCanvas = ref(false);
// 标记当前是否正在画布中创建连线
const isCreatingRelationship = ref(false);
// 存储当前选中的节点ID
const selectedNodeId = ref(null);
// 存储当前选中的边ID
const selectedEdgeId = ref(null);
// 选中的关系模板
const selectedRelationshipTemplate = ref(null);
// 是否点击了左侧面板的关系模板
const hasClickedRelationshipTemplate = ref(false);

// 组件库列表
const components = ref([]);

// 计算当前选中的节点
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return graphNodes.value.find(node => node.id === selectedNodeId.value) || null;
});

// 计算当前选中的边
const selectedEdge = computed(() => {
  if (!selectedEdgeId.value) return null;
  return graphEdges.value.find(edge => edge.id === selectedEdgeId.value) || null;
});

// 处理节点点击
const handleNodeClick = (node) => {
  console.log("Home组件接收节点点击:", node);
  // 设置操作来源为画布
  operationSource.value = "canvas";
  // 打开属性面板，设置当前操作类型为实体
  currentOperation.value = "entity";
  entityName.value = node.nodeTemplateName || node.name;
  
  // 检查节点是否是新拖拽的未保存节点
  // 新拖拽的节点在pendingGraphNodes中，且没有nodeName属性（保存后会设置）
  const pendingNode = pendingGraphNodes.value.find(pendingNode => pendingNode.id === node.id);
  const isPendingNode = !!pendingNode;
  const isSaved = !!pendingNode?.nodeName; // 保存后的节点会有nodeName属性
  
  console.log("节点点击检查:", {
    nodeId: node.id,
    isPendingNode,
    isSaved,
    pendingNodeName: pendingNode?.nodeName,
    nodeName: node.nodeName,
    nodeDescription: node.description
  });
  
  // 如果是新拖拽的未保存节点，置空节点名称和定义描述
  if (isPendingNode && !isSaved) {
    nodeName.value = undefined; // 设置为undefined，这样RightPropertyPanel会显示为空
    entityDescription.value = "";
    console.log("置空节点名称和描述");
  } else {
    // 否则展示实际节点信息
    nodeName.value = node.nodeName || "";
    entityDescription.value = node.description || "";
    console.log("展示实际节点信息:", { nodeName: nodeName.value, entityDescription: entityDescription.value });
  }
  
  entityProperties.value = node.properties || [];
  backgroundColor.value = node.backgroundColor || "#43D7B5";
  addToComponentLibrary.value = node.isLibraryFlag === "1";
  // 设置当前节点的模板ID
  currentNodeTemplateId.value = node.nodeTemplateId || 0;
  currentRelationTemplateId.value = 0;
  // 设置操作来源为画布
  isFromCanvas.value = true;
  isFromComponentLibrary.value = false;
  // 存储当前选中的节点ID
  selectedNodeId.value = node.id;
  selectedEdgeId.value = null;
  
  // 重置连接状态，退出连线模式
  isConnecting.value = false;
  // 清空源节点和目标节点ID
  sourceNodeId.value = null;
  targetNodeId.value = null;
  originalSourceNodeId.value = null;
  originalTargetNodeId.value = null;
  // 清除虚线连接
  if (contentRef.value && contentRef.value.resetConnectionState) {
    contentRef.value.resetConnectionState();
  }
  
  showPropertyPanel.value = true;
  console.log("设置showPropertyPanel为true");

  // 同步左侧面板高亮，保留之前的选中状态
  if (sidebarRef.value) {
    // 清除之前的选中状态
    // sidebarRef.value.handleClearSelections();

    // 使用 nodeTemplateId 来匹配实体模板
    if (node.nodeTemplateId) {
      // 设置实体模板选中状态（使用ID）
      if (sidebarRef.value.setSelectedEntityType) {
        sidebarRef.value.setSelectedEntityType(node.nodeTemplateId);
      }
    } else {
      // 如果没有 nodeTemplateId，检查是否在组件库中
      const component = components.value.find(
        (comp) => comp.nodeTemplateName === node.name,
      );
      if (component && sidebarRef.value.setSelectedComponent) {
        sidebarRef.value.setSelectedComponent(node.name);
      }
    }
  }
};

// 处理边点击
const handleEdgeClick = (edge) => {
  console.log("Home组件接收边点击:", edge);
  try {
    // 设置操作来源为画布
    operationSource.value = "canvas";
    // 打开属性面板，设置当前操作类型为关系
    currentOperation.value = "relationship";
    // 获取关系模板名称
    let templateName = "";
    if (edge.relationTemplateId) {
      const template = components.value.find(comp => comp.relationTemplateId === edge.relationTemplateId);
      if (template) {
        templateName = template.relationTemplateName;
      }
    }
    relationshipName.value = edge.relationTemplateName || templateName || edge.relationName || edge.data?.name || "";
    relationName.value = edge.relationName || edge.data?.name || "";
    relationshipType.value = edge.data?.type || "定向";
    relationTrigger.value = edge.relationTrigger || edge.data?.relationTrigger || "";
    entityProperties.value = edge.data?.properties || [];
    // 设置是否加入组件库
    addToComponentLibrary.value = edge.isLibraryFlag === "1";
    // 设置当前连线的模板ID
    currentRelationTemplateId.value = edge.relationTemplateId || 0;
    currentNodeTemplateId.value = 0;
    // 设置操作来源为画布，不是正在创建连线
    isFromCanvas.value = true;
    isFromComponentLibrary.value = false;
    isCreatingRelationship.value = false;
    // 存储当前选中的边ID
    selectedEdgeId.value = edge.id;
    selectedNodeId.value = null;

    // 获取开始和结束节点
    const startNode = graphNodes.value.find(
      (node) => String(node.id) === String(edge.source),
    );
    const endNode = graphNodes.value.find(
      (node) => String(node.id) === String(edge.target),
    );

    // 同步左侧面板高亮，保留之前的选中状态
    if (sidebarRef.value) {
      // 清除之前的选中状态
      // sidebarRef.value.handleClearSelections();

      // 使用 relationTemplateId 来匹配关系模板
      if (edge.relationTemplateId) {
        // 设置关系模板选中状态（使用ID）
        if (sidebarRef.value.setSelectedRelationshipType) {
          sidebarRef.value.setSelectedRelationshipType(edge.relationTemplateId);
        }
      } else {
        // 如果没有 relationTemplateId，检查是否在组件库中
        const relationshipName = edge.data?.name || "";
        const component = components.value.find(
          (comp) => comp.relationTemplateName === relationshipName,
        );
        if (component && sidebarRef.value.setSelectedComponent) {
          sidebarRef.value.setSelectedComponent(relationshipName);
        }
      }
    }

    // 设置开始和结束节点名称
    startNodeName.value = startNode ? startNode.name : "";
    endNodeName.value = endNode ? endNode.name : "";

    // 设置开始和结束节点模板ID
    sourceNodeId.value = startNode
      ? startNode.nodeTemplateId || Number(edge.source)
      : null;
    targetNodeId.value = endNode
      ? endNode.nodeTemplateId || Number(edge.target)
      : null;

    // 直接设置showPropertyPanel为true，保持面板显示
    showPropertyPanel.value = true;
    console.log("设置showPropertyPanel为true");
  } catch (error) {
    console.error("处理边点击事件失败:", error);
    // 即使出错也要显示属性面板
    showPropertyPanel.value = true;
  }
};

// 获取画布容器大小
const getCanvasSize = () => {
  // 尝试获取窗口大小，作为画布大小的参考
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 考虑到页面布局，减去一定的边距和其他元素的高度
  const canvasWidth = Math.max(800, windowWidth - 400); // 减去侧边栏和其他元素的宽度
  const canvasHeight = Math.max(600, windowHeight - 200); // 减去顶部导航栏和其他元素的高度

  return {
    width: canvasWidth,
    height: canvasHeight,
  };
};

// 处理节点数据更新
const handleUpdateNodes = (templateData) => {
  console.log("更新节点数据:", templateData);
  
  // 判断是模板数据还是查询数据
  const isTemplateData = templateData && templateData.nodeTemplates;
  const isQueryData = templateData && templateData.nodes;
  
  if (!isTemplateData && !isQueryData) {
    console.log("数据格式不匹配，不更新");
    return;
  }
  
  // 只清空画布上的节点和关系数据，不清空模板数据
  graphNodes.value = [];
  graphEdges.value = [];
  
  // 只有当是模板数据时，才更新模板相关数据
  if (isTemplateData) {
    entityTypes.value = [];
    relationshipTypes.value = [];
  }

  // 计算画布大小，使用实际容器大小
  const getContainerSize = () => {
    // 尝试获取内容区域的实际大小
    if (contentRef.value && contentRef.value.$el) {
      const contentArea = contentRef.value.$el.querySelector('.content-area');
      if (contentArea) {
        return {
          width: contentArea.clientWidth,
          height: contentArea.clientHeight
        };
      }
    }
    // 默认值作为 fallback
    return {
      width: 800,
      height: 600
    };
  };
  const containerSize = getContainerSize();
  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  // 处理节点数据
  const nodesToProcess = isQueryData ? templateData.nodes : templateData.nodeTemplates;

  // 预处理关系数据，确保格式正确
  const relationsToProcess = isQueryData ? templateData.relations : templateData.relationTemplates;
  const processedRelations = relationsToProcess
    ? relationsToProcess.map((relation, index) => ({
        ...relation,
        id: String(relation.relationHash || relation.relationTemplateId || `edge-${index}`),
        source: relation.startNodeHash,
        target: relation.endNodeHash,
      })).filter(relation => relation.source && relation.target)
    : [];

  // 使用基于节点关系的智能布局算法计算节点位置
  const nodePositions = calculateNodePositions(nodesToProcess, processedRelations, containerWidth, containerHeight);

  nodesToProcess.forEach((nodeOrTemplate) => {
    const nodeId = nodeOrTemplate.nodeHash;
    const pos = nodePositions.get(nodeId);
    const x = pos ? pos.x : containerWidth / 2;
    const y = pos ? pos.y : containerHeight / 2;

    // 转换节点属性格式
    const nodeProperties = nodeOrTemplate.properties
      ? nodeOrTemplate.properties.map((prop) => ({
          name: prop.propertyKey,
          type: "string",
          value: prop.propertyValue || "",
        }))
      : [];

    // 构建新节点
    const newNode = {
      id: nodeOrTemplate.nodeHash,
      type: "entity",
      name: isQueryData ? nodeOrTemplate.nodeName : nodeOrTemplate.nodeTemplateName,
      description: isQueryData ? (nodeOrTemplate.nodeDescription || "") : (nodeOrTemplate.nodeTemplateDescription || ""),
      x: x,
      y: y,
      properties: nodeProperties,
      backgroundColor: nodeOrTemplate.nodeColor || "#43D7B5",
      nodeTemplateId: nodeOrTemplate.nodeTemplateId || 0,
      isLibraryFlag: "0",
      nodeHash: nodeOrTemplate.nodeHash,
      nodeTemplateName: isQueryData ? nodeOrTemplate.nodeTemplateName : nodeOrTemplate.nodeTemplateName,
      nodeName: isQueryData ? nodeOrTemplate.nodeName : nodeOrTemplate.nodeTemplateName,
      nodeDescription: isQueryData ? (nodeOrTemplate.nodeDescription || "") : (nodeOrTemplate.nodeTemplateDescription || ""),
      nodeColor: nodeOrTemplate.nodeColor || "#43D7B5",
      nodeId: nodeOrTemplate.nodeId,
    };

    if (isTemplateData && nodeOrTemplate.nodeTemplateName) {
      entityTypes.value.push(nodeOrTemplate.nodeTemplateName);
    }

    graphNodes.value.push(newNode);
  });

  // 处理关系数据
  if (relationsToProcess && Array.isArray(relationsToProcess)) {
    // 如果是模板数据，保存关系模板
    if (isTemplateData) {
      relationTemplates.value = templateData.relationTemplates;
    }

    // 创建节点ID集合，用于快速检查节点是否存在
    const nodeIds = new Set(graphNodes.value.map((node) => node.id));

    relationsToProcess.forEach((relationOrTemplate) => {
      // 获取起始节点和结束节点的哈希值
      const startHash = isQueryData ? relationOrTemplate.startNodeHash : relationOrTemplate.startNodeHash;
      const endHash = isQueryData ? relationOrTemplate.endNodeHash : relationOrTemplate.endNodeHash;
      
      // 检查节点是否存在
      if (!nodeIds.has(startHash) || !nodeIds.has(endHash)) {
        console.warn(
          `跳过关系，因为节点 ${startHash} 或 ${endHash} 不存在`,
        );
        return;
      }

      // 转换关系属性格式
      const edgeProperties = relationOrTemplate.properties
        ? relationOrTemplate.properties.map((prop) => ({
            name: prop.propertyKey,
            type: "string",
            value: prop.propertyValue || "",
          }))
        : [];

      // 获取关系类型对应的显示文本
      let relationTypeText = "定向";
      const relationTypeValue = isQueryData ? relationOrTemplate.relationType : relationOrTemplate.relationTemplateType;
      switch (relationTypeValue) {
        case "1":
          relationTypeText = "定向";
          break;
        case "2":
          relationTypeText = "双向";
          break;
        case "3":
          relationTypeText = "循环";
          break;
      }

      const newEdge = {
        id: String(isQueryData ? relationOrTemplate.relationHash : (relationOrTemplate.relationId || relationOrTemplate.relationHash)),
        source: startHash,
        target: endHash,
        data: {
          name: isQueryData ? relationOrTemplate.relationName : (relationOrTemplate.relationName || relationOrTemplate.relationTemplateName),
          type: relationTypeText,
          properties: edgeProperties,
        },
        relationTemplateId: relationOrTemplate.relationTemplateId || 0,
        isLibraryFlag: "0",
        relationHash: isQueryData ? relationOrTemplate.relationHash : relationOrTemplate.relationHash,
        relationId: relationOrTemplate.relationId,
        relationName: isQueryData ? relationOrTemplate.relationName : (relationOrTemplate.relationName || relationOrTemplate.relationTemplateName),
        relationTemplateName: isQueryData ? relationOrTemplate.relationTemplateName : relationOrTemplate.relationTemplateName,
        relationTrigger: relationOrTemplate.relationTrigger || "",
        relationType: relationTypeValue,
        startNodeHash: startHash,
        endNodeHash: endHash,
      };

      if (isTemplateData && relationOrTemplate.relationTemplateName) {
        relationshipTypes.value.push(relationOrTemplate.relationTemplateName);
      }

      graphEdges.value.push(newEdge);
    });
  }
  
  // 设置有数据标志
  hasData.value = (graphNodes.value.length > 0 || graphEdges.value.length > 0);
  
  // 刷新画布
  if (contentRef.value && contentRef.value.graphContainerRef) {
    if (contentRef.value.graphContainerRef.forceRedraw) {
      contentRef.value.graphContainerRef.forceRedraw();
    } else if (contentRef.value.graphContainerRef.refreshCanvas) {
      contentRef.value.graphContainerRef.refreshCanvas();
    }
  }
  console.log("节点数据更新完成:", graphNodes.value, graphEdges.value);
};

// 处理更新组件库数据
const handleUpdateLibrary = (libraryData) => {
  console.log("更新组件库数据:", libraryData);
  if (libraryData) {
    // 合并节点模板和关系模板
    const allComponents = [];
    if (libraryData.nodeTemplates && Array.isArray(libraryData.nodeTemplates)) {
      allComponents.push(...libraryData.nodeTemplates);
    }
    if (
      libraryData.relationTemplates &&
      Array.isArray(libraryData.relationTemplates)
    ) {
      allComponents.push(...libraryData.relationTemplates);
    }
    components.value = allComponents;
    console.log("组件库更新完成，共", allComponents.length, "个组件");
  } else {
    components.value = [];
  }
};

// 处理清除选中状态
const handleClearSelections = () => {
  // 这里不需要做任何操作，因为 LeftTemplatePanel 组件会处理清除选中状态的逻辑
  console.log("清除模型列表选中状态");
};

// 设置选中节点
const setSelectedNode = (node) => {
  // 这里可以实现选中节点的逻辑
  console.log("设置选中节点:", node);
};

// 处理退出
const handleQuit = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("quit");
  graphNodes.value = [];
  graphEdges.value = [];
  pendingGraphNodes.value = [];
  pendingGraphEdges.value = [];
  hasData.value = false;
  // 清除左侧模板面板的选中状态
  if (sidebarRef.value && sidebarRef.value.handleClearSelections) {
    sidebarRef.value.handleClearSelections();
  }
  // 清除选中的关系模板，避免后续连线时仍使用该模板进行校验
  selectedRelationshipTemplate.value = null;
  // 重置已点击关系模板的标记
  hasClickedRelationshipTemplate.value = false;
};
const handleSaveGraph2 = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("quit");
  graphNodes.value = [];
  graphEdges.value = [];
  pendingGraphNodes.value = [];
  pendingGraphEdges.value = [];
  hasData.value = false;
};
// 处理提交
const handleSubmit = () => {
  console.log("GraphEditor组件接收到提交事件");
  emit("submit");
};

// 处理清除
const handleClear = () => {
  console.log("GraphEditor组件接收到清除事件");
  
  // 首先重置连接状态，清除临时边和虚拟节点
  if (contentRef.value && contentRef.value.resetConnectionState) {
    contentRef.value.resetConnectionState();
  }
  
  // 只保留接口返回的节点和连线，清除手动添加的
  // 接口返回的节点和连线通常有 nodeHash 或 relationHash 属性，但手动添加的也会生成这些属性
  // 所以我们需要检查节点和连线是否在pendingGraphNodes或pendingGraphEdges中
  const pendingNodeIds = new Set(pendingGraphNodes.value.map(node => node.id));
  const pendingEdgeIds = new Set(pendingGraphEdges.value.map(edge => edge.id));
  
  // 过滤掉手动添加的节点（在pendingGraphNodes中的节点）
  graphNodes.value = graphNodes.value.filter(node => !pendingNodeIds.has(node.id));
  // 过滤掉手动添加的连线（在pendingGraphEdges中的连线）
  graphEdges.value = graphEdges.value.filter(edge => !pendingEdgeIds.has(edge.id));
  
  // 清除临时存储
  pendingGraphNodes.value = [];
  pendingGraphEdges.value = [];
  
  // 关闭属性面板
  showPropertyPanel.value = false;
  
  // 清除选中状态
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
  
  // 退出连线模式
  isConnecting.value = false;
  // 清空源节点和目标节点ID
  sourceNodeId.value = null;
  targetNodeId.value = null;
  originalSourceNodeId.value = null;
  originalTargetNodeId.value = null;
  
  // 不清除选中的关系模板，保持当前选中状态
  // 这样当用户点击画布空白取消连线后，再次连线时仍会进行校验
};
const content = computed(() => {
  // 优先使用选中的段落内容
  if (props.selectedSequence && props.selectedSequence.sequenceContent) {
    return props.selectedSequence.sequenceContent;
  }
  // 如果没有选中的段落，使用marks中的内容
  if (!props.marks || props.marks.length === 0) return "";
  return props.marks.map((mark) => mark.content ?? "").join("");
});
const textStore = useTextStore();

// 处理保存图谱
// 生成基于节点信息的哈希值
const generateNodeHash = (node) => {
  // 节点的哈希值由后端生成，前端不生成
  return ""
};

// 根据节点ID获取节点哈希值
const getNodeHash = (nodeId) => {
  console.log('getNodeHash called with nodeId:', nodeId);
  if (!nodeId) return '';
  const node = graphNodes.value.find(n => String(n.id) === String(nodeId));
  console.log('Found node:', node);
  if (!node) {
    console.error('Node not found for id:', nodeId);
    console.error('All nodes:', graphNodes.value);
  }
  const hash = node ? node.nodeHash : '';
  console.log('Returning hash:', hash);
  return hash;
};

// 根据节点ID查找节点的nodeHash
const findNodeHashBySource = (sourceId) => {
  console.log('findNodeHashBySource called with sourceId:', sourceId);
  if (!sourceId) return '';
  
  // 首先尝试通过id查找节点
  let node = graphNodes.value.find(n => String(n.id) === String(sourceId));
  console.log('Found node by id:', node);
  
  // 如果通过id找不到，尝试通过nodeHash查找
  if (!node) {
    node = graphNodes.value.find(n => String(n.nodeHash) === String(sourceId));
    console.log('Found node by nodeHash:', node);
  }
  
  const hash = node ? node.nodeHash : '';
  console.log('Returning hash:', hash);
  return hash;
};

const handleSaveGraph = async () => {
  try {

    
    // 检查是否有待提交的数据
    if (
      graphNodes.value.length === 0 &&
      graphEdges.value.length === 0
    ) {
      ElMessage.warning("请先创建节点或连线");
      return;
    }

    // 构建保存数据
    const saveData = {
      articleId: props.articleId || "",
      sequenceId: props.sequenceId || "",
      sequenceContent: content.value,
      sequencePositionList: props.selectedSequence && props.selectedSequence.sequencePositionList
        ? props.selectedSequence.sequencePositionList
        : props.marks && props.marks.length > 0
        ? props.marks.flatMap(mark => 
            mark.rects && mark.rects.length > 0
              ? mark.rects.map(rect => ({
                  sequenceX0: rect.x0,
                  sequenceY0: rect.y0,
                  sequenceX1: rect.x1,
                  sequenceY1: rect.y1,
                  sequencePage: rect.page
                }))
              : []
          )
        : [],
      graphNode: graphNodes.value.map((node) => ({
        nodeHash: node.nodeHash || "",
        nodeTemplateName: node.nodeTemplateName || node.name,
        nodeName: node.nodeName || node.name,
        nodeDescription: node.nodeDescription || node.description || "",
        nodeColor: node.nodeColor || node.backgroundColor || "#43D7B5",
        nodeTemplateId: node.nodeTemplateId,
        properties: (node.properties || []).map((prop) => ({
          propertyKey: prop.name,
          propertyValue: prop.value || "",
        })),
      })),
      graphRelation: graphEdges.value.map((edge) => {
        // 查找实际连接的节点，获取其当前哈希值
        const startNode = graphNodes.value.find(node => node.id === edge.source);
        const endNode = graphNodes.value.find(node => node.id === edge.target);
        
        return {
          relationName: edge.relationName || edge.data?.name || "",
          relationType: edge.relationType || "1",
          relationTrigger: edge.relationTrigger || "",
          startNodeHash:edge.startNodeHash,
          endNodeHash:edge.endNodeHash,
          properties: (edge.data?.properties || []).map((prop) => ({
            propertyKey: prop.name,
            propertyValue: prop.value || "",
          })),
          relationTemplateName: edge.relationTemplateName || "",
          relationTemplateId: edge.relationTemplateId,
        };
      }),
    };

    console.log("提交数据:", saveData);

    // 调用 saveGraph 接口
    await projectService.saveGraph(saveData);

    ElMessage.success("保存成功");

    // 保存成功后，清空临时存储，因为这些节点和连线已经被保存到服务器
    pendingGraphNodes.value = [];
    pendingGraphEdges.value = [];

    // 保存成功后，调用接口重新获取最新的图谱数据
    if (props.sequenceId) {
      await fetchGraphBySequenceId(props.sequenceId);
    }
    
    // 触发提交事件，通知父组件更新数据
  emit('submit');
  
  // 关闭弹窗
  dialogVisible.value = false;
  emit('update:visible', false);
} catch (error) {
  console.error("保存失败:", error);
  ElMessage.error("保存失败，请重试");
}
};

// 处理删除节点或连线
const handleDeleteItem = () => {
  if (currentOperation.value === "entity" && selectedNodeId.value) {
    // 删除选中的节点
    graphNodes.value = graphNodes.value.filter(node => node.id !== selectedNodeId.value);
    // 删除与该节点相关的连线
    graphEdges.value = graphEdges.value.filter(edge => edge.source !== selectedNodeId.value && edge.target !== selectedNodeId.value);
    // 清空选中状态
    selectedNodeId.value = null;
  } else if (currentOperation.value === "relationship" && selectedEdgeId.value) {
    // 删除选中的连线
    graphEdges.value = graphEdges.value.filter(edge => edge.id !== selectedEdgeId.value);
    // 清空选中状态
    selectedEdgeId.value = null;
  }
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title=""
    width="82%"
    style="height: 92%; margin-top: 4vh; padding: 0"
    :class="dialogClassName2"
    @close="handleClose"
    :append-to-body="true"
  >
    <div class="home-container">
      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 左侧侧边栏 -->
        <LeftTemplatePanel
          ref="sidebarRef"
          :is-loading-templates="isLoadingTemplates"
          :is-loading-components="isLoadingComponents"
          :has-data="hasData"
          :entity-types="entityTypes"
          :relationship-types="relationshipTypes"
          :relation-templates="relationTemplates"
          :node-templates="nodeTemplates"
          :components="components"
          @open-add-dialog="openAddDialog"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @create-graph-click="handleCreateGraphClick"
          @graph-click="handleGraphClick"
          @edit-graph="handleEditGraph"
          @topic-click="handleTopicClick"
          @add-entity-type="handleAddEntityType"
          @entity-type-click="handleEntityTypeClick"
          @relationship-type-click="handleRelationshipTypeClick"
          @component-click="handleComponentClick"
          @component-library-search="handleComponentLibrarySearch"
          @add-component-to-model="handleAddComponentToModel"
        />

        <!-- 中间内容 -->
        <Content
          ref="contentRef"
          :current-sub-domain="currentSubDomain"
          :current-mode="currentMode"
          :has-data="hasData"
          :graph-nodes="graphNodes"
          :graph-edges="graphEdges"
          :entity-properties="entityProperties"
          :currentGraphCreateMethod="props.currentGraphCreateMethod"
          @add-entity="handleAddEntity"
          :is-connecting="isConnecting"
          :has-clicked-relationship-template="hasClickedRelationshipTemplate"
          @create-relationship="handleCreateRelationship"
          @connection-complete="handleConnectionComplete"
          @drop="handleDrop"
          @node-mouse-down="handleNodeMouseDown"
          @mouse-move="handleMouseMove"
          @mouse-up="handleMouseUp"
          @node-drag-end="handleNodeDragEnd"
          @node-click="handleNodeClick"
          @edge-click="handleEdgeClick"
          @quit="handleQuit"
          @clear="handleClear"
          @save-graph="handleSaveGraph2"
        />
        <div class="content-wrapper" v-show="content != '' && showReferenceText">
          参考文本:
          <p>{{ content }}</p>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <RightPropertyPanel
        ref="rightPropertyPanelRef"
        :show-property-panel="showPropertyPanel"
        :current-operation="currentOperation"
        :entity-name="entityName"
        :node-name="nodeName"
        :entity-description="entityDescription"
        :entity-properties="entityProperties"
        :relationship-name="relationshipName"
        :relation-name="relationName"
        :relationship-type="relationshipType"
        :start-node-name="startNodeName"
        :end-node-name="endNodeName"
        :add-to-component-library="addToComponentLibrary"
        :background-color="backgroundColor"
        :topic-id="props.topicId"
        :start-node-template-id="sourceNodeId"
        :end-node-template-id="targetNodeId"
        :node-template-id="currentNodeTemplateId"
        :relation-template-id="currentRelationTemplateId"
        :is-from-component-library="isFromComponentLibrary"
        :is-from-canvas="isFromCanvas"
        :is-creating-relationship="isCreatingRelationship"
        :reference-content="content"
        :show-reference-text="props.showReferenceText"
        :operation-source="operationSource"
        :relation-trigger="relationTrigger"
        :article-id="props.articleId"
        :sequence-id="props.sequenceId"
        :currentGraphCreateMethod="props.currentGraphCreateMethod"
        :node-id="selectedNode ? selectedNode.nodeId : ''"
        :node-hash="selectedNode ? selectedNode.nodeHash : ''"
        :relation-id="selectedEdge ? selectedEdge.relationId : ''"
        :relation-hash="selectedEdge ? selectedEdge.relationHash : ''"
        :start-node-hash="selectedEdge ? (selectedEdge.startNodeHash || findNodeHashBySource(selectedEdge.source)) : (originalSourceNodeId ? findNodeHashBySource(originalSourceNodeId) : '')"
        :end-node-hash="selectedEdge ? (selectedEdge.endNodeHash || findNodeHashBySource(selectedEdge.target)) : (originalTargetNodeId ? findNodeHashBySource(originalTargetNodeId) : '')"
        :start-node-id="selectedEdge ? selectedEdge.startNodeId : ''"
        :end-node-id="selectedEdge ? selectedEdge.endNodeId : ''"
        :selected-sequence="props.selectedSequence"
        :marks="props.marks"
        :currentLevel="props.level"
        @close="handleClosePropertyPanel"
        @save="handleSavePropertyPanel"
        @add-property="handleAddProperty"
        @update-nodes="handleUpdateNodes"
        @update-library="handleUpdateLibrary"
        @delete-item="handleDeleteItem"
      />
    </div>
    <!-- <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="handleQuit">退出</el-button>
        <el-button class="confirm-btn" @click="handleCancel">取消</el-button>
      </span>
    </template> -->
  </el-dialog>
</template>
<style lang="scss">
.graph-editor-dialog {
  .el-dialog__header {
    padding-bottom: 0 !important;
  }
  .el-dialog__body {
    border: none !important;
    padding: 0 !important;
    height: 100% !important;
  }
  .el-dialog__headerbtn {
    //z-index: 9999999;
  }
}
</style>
<style scoped lang="scss">
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  .content-wrapper {
    position: absolute;
    bottom: 100px;
    left: 360px;
    width: 72%;
    padding: 26px 30px;
    background: #ffffff;
    border: 1px solid rgba(224, 226, 235, 1);
    box-shadow: 0px 0px 18px 0px rgba(0, 0, 0, 0.06);
    font-size: 16px;
    color: #333333;
    font-weight: 600;
    border-radius: 20px;
    p {
      padding-top: 8px;
      font-size: 14px;
      color: #666666;
      font-weight: 400;
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar {
    width: 280px;
  }
}

@media (max-width: 992px) {
  .sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    padding: 10px;
  }

  .content {
    flex: 1;
  }
}

/* 自定义删除弹框样式 - 使用全局样式选择器 */
:global(.el-message-box) {
  width: 500px !important;
}

:global(.el-message-box__content) {
  padding: 30px 20px !important;
}

:global(.el-message-box__btns .el-button--primary) {
  background-color: rgba(61, 210, 176, 1) !important;
  border-color: rgba(61, 210, 176, 1) !important;
  color: white !important;
}

:global(.el-message-box__btns .el-button--primary:hover) {
  background-color: rgba(61, 210, 176, 0.9) !important;
  border-color: rgba(61, 210, 176, 0.9) !important;
}

:global(.el-message-box__btns .el-button--default) {
  background-color: white !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}

:global(.el-message-box__btns .el-button--default:hover),
:global(.el-message-box__btns .el-button:hover:not(.el-button--primary)) {
  background-color: #f5f7fa !important;
  border-color: #c0c4cc !important;
  color: #606266 !important;
  --el-button-hover-bg-color: #f5f7fa !important;
  --el-button-hover-border-color: #c0c4cc !important;
  --el-button-hover-text-color: #606266 !important;
}

/* 弹框关闭按钮样式 */
:global(.el-message-box__headerbtn:hover .el-message-box__close) {
  color: rgba(61, 210, 176, 1) !important;
}
</style>

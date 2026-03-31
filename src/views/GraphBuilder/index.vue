<template>
  <div class="project-builder-container">
    <!-- 左侧侧边栏 -->
    <Sidebar
      ref="sidebarRef"
      :all-option="allOption"
      :active-graph-item="currentGraphId"
      :current-domain="currentDomain"
      :current-sub-domain="currentSubDomain"
      :domains="domains"
      :sub-domains="subDomains"
      :sub-sub-domains="subSubDomains"
      :topics="topics"
      :graphs="graphs"
      :search-options="searchOptions"
      :topic-search-options="topicSearchOptions"
      :graph-search-options="graphSearchOptions"
      :is-loading-domains="isLoadingDomains"
      :is-loading-topics="isLoadingTopics"
      :is-loading-graphs="isLoadingGraphs"
      :is-loading-templates="isLoadingTemplates"
      :is-loading-components="isLoadingComponents"
      :has-data="hasData"
      :entity-types="entityTypes"
      :relationship-types="relationshipTypes"
      :relation-templates="relationTemplates"
      :current-mode="currentMode"
      :node-templates="nodeTemplates"
      :currentGraphCreateMethod="currentGraphCreateMethod"
      :components="components"
      @delete-domain="handleDeleteDomain"
      @open-add-dialog="openAddDialog"
      @open-add-topic-dialog="openAddTopicDialog"
      @open-add-graph-dialog="openAddGraphDialog"
      @domain-click="handleDomainClick"
      @sub-domain-click="handleSubDomainClick"
      @back-to-domains="handleBackToDomains"
      @back-to-sub-domains="handleBackToSubDomains"
      @back-to-sub-GraphList="backToSubGraphList"
      @search="handleSearch"
      @select-search-item="selectSearchItem"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @create-graph-click="handleCreateGraphClick"
      @graph-click="handleGraphClick"
      @edit-graph="handleEditGraph"
      @delete-graph="handleDeleteGraph"
      @delete-topic="handleDeleteTopic"
      @topic-search="handleTopicSearch"
      @search-icon-click="handleSearchIconClick"
      @topic-search-icon-click="handleTopicSearchIconClick"
      @graph-search="handleGraphSearch"
      @graph-search-icon-click="handleGraphSearchIconClick"
      @clear-domain-history="clearDomainSearchHistory"
      @clear-topic-history="clearTopicSearchHistory"
      @clear-graph-history="clearGraphSearchHistory"
      @topic-click="handleTopicClick"
      @entity-type-click="handleEntityTypeClick"
      @relationship-type-click="handleRelationshipTypeClick"
      @component-click="handleComponentClick"
      @component-library-search="handleComponentLibrarySearch"
      @add-component-to-model="handleAddComponentToModel"
      @add-entity-type="handleAddEntityType"
      @copy-domain="handleCopyDomain"
      @copy-topic="handleCopyTopic"
    />
    <!-- 右侧内容区域 -->
    <div class="content-container">
      <!-- 新增/编辑弹窗textUrl -->
      <AddGraphDialog
        v-model:visible="showGraphDialog"
        :is-confirm-button-disabled="isConfirmButtonDisabled"
        :loading="isLoading"
        @create-graph="handleCreateGraph"
        @cancel="handleCancelCreateGraph"
      />
      <div v-if="currentGraphId && currentGraphCreateMethod == '0'" class="text-container">
        <Text
          ref="textRef"
          :src="textUrl"
          :page="currentPage"
          @selection-change="handlePdfSelectionChange"
          @rectangle-click="handleRectangleClick"
          @pdf-loaded="handlePdfLoaded"
        />
        <TextTool
          class="tool"
          @previous-page="hanlePreviousPage"
          @next-page="hanleNextPage"
          @jump-page="handleJumpPage"
          @refresh="hanleRefresh"
          @edit-graph="openGraphEditor"
        />
      </div>
      <div class="graph-container" v-if="currentMode === 'graph'">
        <!-- 自文本创建的图谱使用GraphViewer2 -->
        <GraphViewer2
          v-if="currentGraphCreateMethod == '0'"
          :key="graphViewerKey"
          ref="graphViewer"
          :nodes="graphNodes"
          :edges="graphEdges"
          :article-id="currentGraphId"
          :topic-id="currentSubDomainId"
          :domain-id="currentDomainId"
          :level="currentLevel"
          :pdf-loaded="pdfLoaded"
        />
        <!-- 其他创建方式的图谱使用编辑器组件 -->
        <div v-else-if="currentGraphCreateMethod == '1'||currentGraphCreateMethod == '2'" class="other-container">
          <Content
            ref="contentRef"
            :current-sub-domain="currentSubDomain"
            :current-mode="currentMode"
            :has-data="hasData"
            :graph-nodes="graphNodes"
            :graph-edges="graphEdges"
            :entity-properties="entityProperties"
            :is-connecting="isConnecting"
            :has-clicked-relationship-template="hasClickedRelationshipTemplate"
            :selected-relationship-template="selectedRelationshipTemplate"
            :node-templates="nodeTemplates"
            :relation-templates="relationTemplates"
            :currentGraphCreateMethod="currentGraphCreateMethod"
            @add-entity="handleAddEntity"
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
            @save-graph="handleSaveGraph"
            @select-relationship-template="(template) => selectedRelationshipTemplate.value = template"
          />
          <RightPropertyPanel
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
            :topic-id="currentSubDomainId"
            :start-node-template-id="sourceNodeId"
            :end-node-template-id="targetNodeId"
            :node-template-id="currentNodeTemplateId"
            :relation-template-id="currentRelationTemplateId"
            :is-from-component-library="isFromComponentLibrary"
            :is-from-canvas="isFromCanvas"
            :is-creating-relationship="isCreatingRelationship"
            :reference-content="content"
            :show-reference-text="false"
            :operation-source="operationSource"
            :relation-trigger="relationTrigger"
            :article-id="currentGraphId"
            :selected-node-id="selectedNodeId"
            :selected-edge-id="selectedEdgeId"
            :currentLevel="currentLevel"
            :sequence-id="currentSequenceId"
            :domain-id="currentDomainId"
            :currentGraphCreateMethod="currentGraphCreateMethod"
            :nodeId="selectedNode ? selectedNode.nodeId : ''"
            :nodeHash="selectedNode ? selectedNode.nodeHash : ''"
            :relationId="selectedEdge ? selectedEdge.relationId : ''"
            :relationHash="selectedEdge ? selectedEdge.relationHash : ''"
            :startNodeId="selectedEdge ? selectedEdge.startNodeId : ''"
            :endNodeId="selectedEdge ? selectedEdge.endNodeId : ''"
            :startNodeHash="selectedEdge ? (selectedEdge.startNodeHash || findNodeHashBySource(selectedEdge.source)) : (originalSourceNodeId ? findNodeHashBySource(originalSourceNodeId) : '')"
            :endNodeHash="selectedEdge ? (selectedEdge.endNodeHash || findNodeHashBySource(selectedEdge.target)) : (originalTargetNodeId ? findNodeHashBySource(originalTargetNodeId) : '')"
            @close="handleClosePropertyPanel"
            @save="handleSavePropertyPanel"
            @cancel="handleCancelPropertyPanel"
            @add-property="handleAddProperty"
            @update-nodes="handleUpdateNodes"
            @select-node="setSelectedNode"
            @delete-item="handleDeleteItem"
          />
        </div>
        <GraphViewer
          v-else
          :key="graphViewerKey"
          ref="graphViewer"
          :nodes="graphNodes"
          :edges="graphEdges"
          :article-id="currentGraphId"
          :topic-id="currentSubDomainId"
          :domain-id="currentDomainId"
          :level="currentLevel"
          :pdf-loaded="pdfLoaded"
          @edit-graph="openGraphEditor"
        />
      </div>
      <GraphEditor
        ref="graphEditorRef"
        v-model:visible="showEditor"
        :marks="markList"
        :nodes="editorNodes"
        :edges="editorEdges"
        :topic-id="currentSubDomainId"
        :article-id="currentGraphId"
        :sequence-id="currentSequenceId"
        :selected-sequence="currentSelectedSequence"
        :entity-types="entityTypes"
        :relationship-types="relationshipTypes"
        :relation-templates="relationTemplates"
        :node-templates="nodeTemplates"
        :currentGraphCreateMethod="currentGraphCreateMethod"
        :show-reference-text="!!currentSequenceId || !!pdfSelectionMark"
        :level="currentLevel"
        @node-drag-end="handleEditorNodeDragEnd"
        @add-entity-from-template="handleEditorAddEntity"
        @update:node="handleEditorUpdateNode"
        @update:edge="handleEditorUpdateEdge"
        @quit="handleEditorSubmit"
        @close-right="handleClosePropertyPanel"
        @submit="handleEditorSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { ElMessage } from "element-plus";
import Sidebar from "@/components/common/Sidebar.vue";
import AddGraphDialog from "@/components/common/AddGraphDialog.vue";
import projectService from "@/services/graph.ts";
import Text from "@/components/article/Text.vue";
import { useConverter } from "@/mock/modules/converter.ts";
import { GraphConfig, type NodeProperty } from "@/configs/graph.js";
import TextTool from "@/components/article/TextTool.vue";
// import GraphEditTool from "@/components/article/GraphEditTool.vue";
import { storeToRefs } from "pinia";
import { useTextStore } from "@/store/useTextStore";
import GraphViewer from "@/views/GraphBuilder/GraphViewer.vue";
import GraphViewer2 from "@/views/GraphBuilder/GraphViewer2.vue";
import GraphEditor from "@/views/GraphBuilder/GraphEditor.vue";
import Content from "@/components/editor/Content.vue";
import RightPropertyPanel from "@/components/editor/RightPropertyPanel.vue";
import type { Mark, Rect } from "@/configs/text";
import type { NodeTemplate } from "@/configs/graph.js";
import { template } from "lodash";

const textStore = useTextStore();
const contentRef = ref(null);
const textRef = ref<InstanceType<typeof Text> | null>(null);
const graphEditorRef = ref<InstanceType<typeof GraphEditor> | null>(null);
const graphViewer = ref(null);
const sidebarRef = ref(null);
const { currentPage, markList } = storeToRefs(textStore);
const textUrl = ref("");
const nodeTemplates = ref([]);
const nodeTemplateProperties = ref([]);
const { graphTypeString2Integer } = useConverter();
// 从localStorage读取状态，或使用默认值
const loadState = () => {
  const savedState = localStorage.getItem("GrapherPageState");
  if (savedState) {
    return JSON.parse(savedState);
  }
  return {
    currentDomain: "",
    currentDomainId: "",
    currentSubDomain: "",
    currentSubDomainId: "",
    currentGraphId: "",
    currentGraphName: "",
    domains: [],
    subDomains: [],
    subSubDomains: [],
    hasData: false,
    graphs: [],
    graphNodes: [],
    currentLevel: 0,
    currentGraphCreateMethod:''
  };
};

const allOption = ref("全部");
const currentDomain = ref("");
const currentDomainId = ref("");
const currentSubDomain = ref("");
const currentSubDomainId = ref("");
const currentGraphId = ref("");
const currentGraphName = ref("");
const currentGraphCreateMethod = ref("");
// 用于强制重新创建 GraphViewer 组件的 key
const graphViewerKey = ref(Date.now());
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
const entityDescription = ref("");
const entityProperties = ref([]);
const hasData = ref(false);
const savedEntitiesCount = ref(0);

const entityTypes = ref([]);
const relationshipTypes = ref([]);
const relationTemplates = ref([]);
// 当前操作类型：'entity' 或 'relationship'
const currentOperation = ref("");
// 关系名称
const relationshipName = ref("");
// 关系类型
const relationshipType = ref("定向");
// 图谱节点
const graphNodes = ref([]);
// 图谱边数据
const graphEdges = ref([]);
// PDF 选区内容与坐标（由 TextSelection 经 Text 传入）
const pdfSelectionContent = ref("");
const pdfSelectionRects = ref<Rect[]>([]);
const pdfSelectionMark = ref<Mark | null>(null);
// 图谱列表
const graphs = ref([]);
// 显示图谱创建对话框
const showGraphDialog = ref(false);
// 保存右键点击的位置
const rightClickPosition = ref({ x: 0, y: 0 });
// 专题列表加载状态
const isLoadingTopics = ref(false);
const isLoadingGraphs = ref(false);
// 连线模式状态
const isConnecting = ref(false);
// 源节点ID
const sourceNodeId = ref(null);
// 目标节点ID
const targetNodeId = ref(null);
// 当前模式：'ontology' 或 'graph'
const currentMode = ref("graph");
//开启 graphEditor
const showEditor = ref(false);
// 编辑器内使用的节点/边（与 GraphViewer 的 graphNodes/graphEdges 分离，不传回给 GraphViewer）
const editorNodes = ref([]);
const editorEdges = ref([]);
// 当前目录层级
const currentLevel = ref(0);
// 段落列表数据
const sequenceListData = ref([]);
// 当前点击的段落 sequenceId
const currentSequenceId = ref("");
// 当前选中的段落数据
const currentSelectedSequence = ref(null);
// PDF加载状态
const pdfLoaded = ref(false);

// 编辑器相关状态
const hasClickedRelationshipTemplate = ref(false);
const currentNodeTemplateId = ref(0);
const currentRelationTemplateId = ref(0);
const isFromComponentLibrary = ref(false);
const isFromCanvas = ref(false);
const isCreatingRelationship = ref(false);
const content = ref("");
const operationSource = ref("");
const relationTrigger = ref("");
const nodeName = ref("");
const relationName = ref("");
const startNodeName = ref("");
const endNodeName = ref("");
const backgroundColor = ref("#43D7B5");
const addToComponentLibrary = ref(false);
const selectedNodeId = ref(null);
const selectedEdgeId = ref(null);
const selectedRelationshipTemplate = ref(null);
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
const pendingGraphNodes = ref([]);
const pendingGraphEdges = ref([]);
const originalSourceNodeId = ref(null);
const originalTargetNodeId = ref(null);
// 加载状态
const isLoadingDomains = ref(false);
const isLoadingTemplates = ref(false);
const isLoadingComponents = ref(false);

// 防止重复调用 fetchGraph 的标志
const isFetchingGraph = ref(false);

// 生成节点哈希值
const generateNodeHash = (node) => {
  return "";
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

/** 当前在配置属性的节点（AddNodeDialog 确定后创建，用于属性弹窗回写） */
const nodeForPropertyDialog = ref(null);
/** 拖放/右键添加节点时的画布坐标（供 AddNodeDialog 确定时使用） */
const addNodePosition = ref({ x: 0, y: 0 });

// ============ 历史搜索记录相关 ============
// 存储在不同上下文中的历史记录
const domainSearchHistory = ref([]); // 领域搜索历史
const topicSearchHistory = ref([]); // 专题搜索历史
const graphSearchHistory = ref([]); // 图谱搜索历史
// 图谱搜索选项
const graphSearchOptions = ref([]);

// 从localStorage加载历史搜索记录
const loadSearchHistory = () => {
  const savedDomainHistory = localStorage.getItem("domainSearchHistory");
  const savedTopicHistory = localStorage.getItem("topicSearchHistory");
  const savedGraphHistory = localStorage.getItem("graphSearchHistory");

  if (savedDomainHistory) {
    domainSearchHistory.value = JSON.parse(savedDomainHistory);
  }
  if (savedTopicHistory) {
    topicSearchHistory.value = JSON.parse(savedTopicHistory);
  }
  if (savedGraphHistory) {
    graphSearchHistory.value = JSON.parse(savedGraphHistory);
  }
};

// 保存历史搜索记录到localStorage
const saveSearchHistory = () => {
  localStorage.setItem(
    "domainSearchHistory",
    JSON.stringify(domainSearchHistory.value),
  );
  localStorage.setItem(
    "topicSearchHistory",
    JSON.stringify(topicSearchHistory.value),
  );
  localStorage.setItem(
    "graphSearchHistory",
    JSON.stringify(graphSearchHistory.value),
  );
};

// 添加领域搜索历史记录
const addDomainSearchHistory = (query) => {
  if (!query || query.trim() === "") return;

  const trimmedQuery = query.trim();
  // 移除已存在的相同记录
  domainSearchHistory.value = domainSearchHistory.value.filter(
    (item) => item !== trimmedQuery,
  );
  // 添加到开头
  domainSearchHistory.value.unshift(trimmedQuery);
  // 限制最多10条记录
  if (domainSearchHistory.value.length > 10) {
    domainSearchHistory.value = domainSearchHistory.value.slice(0, 10);
  }
  saveSearchHistory();
};

// 添加专题搜索历史记录
const addTopicSearchHistory = (query) => {
  if (!query || query.trim() === "") return;

  const trimmedQuery = query.trim();
  // 移除已存在的相同记录
  topicSearchHistory.value = topicSearchHistory.value.filter(
    (item) => item !== trimmedQuery,
  );
  // 添加到开头
  topicSearchHistory.value.unshift(trimmedQuery);
  // 限制最多10条记录
  if (topicSearchHistory.value.length > 10) {
    topicSearchHistory.value = topicSearchHistory.value.slice(0, 10);
  }
  saveSearchHistory();
};

// 添加图谱搜索历史记录
const addGraphSearchHistory = (query) => {
  if (!query || query.trim() === "") return;

  const trimmedQuery = query.trim();
  // 移除已存在的相同记录
  graphSearchHistory.value = graphSearchHistory.value.filter(
    (item) => item !== trimmedQuery,
  );
  // 添加到开头
  graphSearchHistory.value.unshift(trimmedQuery);
  // 限制最多10条记录
  if (graphSearchHistory.value.length > 10) {
    graphSearchHistory.value = graphSearchHistory.value.slice(0, 10);
  }
  saveSearchHistory();
};

// 清除领域搜索历史
const clearDomainSearchHistory = () => {
  domainSearchHistory.value = [];
  saveSearchHistory();
  // 更新搜索下拉框为历史记录（空状态）
  updateDomainSearchOptions();
};

// 清除专题搜索历史
const clearTopicSearchHistory = () => {
  topicSearchHistory.value = [];
  saveSearchHistory();
  // 更新专题搜索下拉框为历史记录（空状态）
  updateTopicSearchOptions();
};

// 清除图谱搜索历史
const clearGraphSearchHistory = () => {
  graphSearchHistory.value = [];
  saveSearchHistory();
  // 更新图谱搜索下拉框为历史记录（空状态）
  updateGraphSearchOptions();
};

// 更新领域搜索下拉框选项（显示历史记录）
const updateDomainSearchOptions = () => {
  if (domainSearchHistory.value.length > 0) {
    searchOptions.value = domainSearchHistory.value.map((item) => ({
      value: item,
      isHistory: true,
    }));
  } else {
    searchOptions.value = [{ value: "暂无搜索历史", disabled: true }];
  }
};

// 更新专题搜索下拉框选项（显示历史记录）
const updateTopicSearchOptions = () => {
  if (topicSearchHistory.value.length > 0) {
    topicSearchOptions.value = topicSearchHistory.value.map((item) => ({
      value: item,
      isHistory: true,
    }));
  } else {
    topicSearchOptions.value = [{ value: "暂无搜索历史", disabled: true }];
  }
};

// 更新图谱搜索下拉框选项（显示历史记录）
const updateGraphSearchOptions = () => {
  if (graphSearchHistory.value.length > 0) {
    graphSearchOptions.value = graphSearchHistory.value.map((item) => ({
      value: item,
      isHistory: true,
    }));
  } else {
    graphSearchOptions.value = [{ value: "暂无搜索历史", disabled: true }];
  }
};
// ============ 历史搜索记录相关结束 ============

// 保存状态到localStorage
const saveState = () => {
  const state = {
    currentDomain: currentDomain.value,
    currentDomainId: currentDomainId.value,
    currentSubDomain: currentSubDomain.value,
    currentSubDomainId: currentSubDomainId.value,
    currentGraphId: currentGraphId.value,
    currentGraphName: currentGraphName.value,
    domains: domains.value,
    subDomains: subDomains.value,
    subSubDomains: subSubDomains.value,
    hasData: hasData.value,
    graphs: graphs.value,
    currentLevel: currentLevel.value,
    topics: topics.value,
    currentGraphCreateMethod:currentGraphCreateMethod.value,
  };
  localStorage.setItem("GrapherPageState", JSON.stringify(state));
};

const openAddGraphDialog = () => {
  showAddGraphDialog.value = true;
};

// 监听状态变化，自动保存
watch(
  [
    currentDomain,
    currentDomainId,
    currentSubDomain,
    currentSubDomainId,
    currentGraphId,
    currentGraphName,
    currentLevel,
    domains,
    subDomains,
    subSubDomains,
    hasData,
    graphs,
    graphNodes,
    currentGraphCreateMethod,
  ],
  () => {
    saveState();
  },
  { deep: true },
);

// 监听模式变化，当从本体设计切回图谱构建时重新加载图谱列表
watch(
  currentMode,
  async (newMode, oldMode) => {
    if (newMode === 'graph' && oldMode === 'ontology' && currentSubDomainId.value) {
      // 先设置加载状态，清空图谱列表，确保显示加载中
      isLoadingGraphs.value = true;
      graphs.value = [];
      // 重新加载图谱列表
      console.log("监听模式变化，当从本体设计切回图谱构建时重新加载图谱列表",currentSubDomainId.value)
      await fetchGraph(currentSubDomainId.value);
    }
  }
);

// 存储所有领域列表
const allDomains = ref([]);

// 组件挂载时加载状态
onMounted(async () => {
  const savedState = loadState();
  currentDomain.value = savedState.currentDomain;
  currentDomainId.value = savedState.currentDomainId;
  currentSubDomain.value = savedState.currentSubDomain;
  currentSubDomainId.value = savedState.currentSubDomainId;
  currentGraphId.value = savedState.currentGraphId;
  currentGraphCreateMethod.value=savedState.currentGraphCreateMethod
  currentGraphName.value = savedState.currentGraphName;
  subDomains.value = savedState.subDomains;
  subSubDomains.value = savedState.subSubDomains;
  hasData.value = savedState.hasData;
  domains.value = savedState.domains;
  topics.value= savedState.topics;
  // 不直接从localStorage加载graphs，避免显示旧数据
  graphs.value = [];
  graphNodes.value = savedState.graphNodes || [];
  currentLevel.value = savedState.currentLevel;

  // 立即设置领域加载状态，避免显示空状态
  isLoadingDomains.value = true;
  // 如果当前有选中的领域，立即设置专题加载状态
  if (currentDomain.value) {
    isLoadingTopics.value = true;
  }
  // 如果当前有选中的专题，立即设置图谱加载状态
  if (currentSubDomain.value) {
    isLoadingGraphs.value = true;
  }
  // 如果当前有选中的图谱，立即设置模板加载状态
  if (currentGraphId.value) {
    isLoadingTemplates.value = true;
  }

  // 加载历史搜索记录
  loadSearchHistory();

  // 初始化搜索下拉框选项
  updateDomainSearchOptions();
  updateTopicSearchOptions();
  updateGraphSearchOptions();
  if(currentLevel.value==0){
    // 调用接口获取所有领域列表
    try {
      await fetchAllDomains();
    } finally {
      isLoadingDomains.value = false;
    }
  } else {
    // 如果不是领域列表页，取消领域加载状态
    isLoadingDomains.value = false;
  }

  // 如果当前有选中的领域，获取对应的专题列表
  if (currentDomain.value) {
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
    );
    if (currentDomainObj) {
      if(currentLevel.value==1){
        try {
          await fetchTopics(currentDomainObj.id);
        } finally {
          isLoadingTopics.value = false;
        }
      } else {
        // 如果不是专题列表页，取消专题加载状态
        isLoadingTopics.value = false;
      } 
      // 如果当前有选中的专题，获取对应的图谱列表
      if (currentSubDomain.value) {
        const currentSubDomainObj = topics.value.find(
          (topic) => topic.name === currentSubDomain.value,
        );
        if (currentSubDomainObj) {
          console.log("onmounted",currentSubDomainObj.id)
           if(currentLevel.value==2){
              await fetchGraph(currentSubDomainObj.id);
           }
          // await fetchEntityAndRelationTypes(currentSubDomainObj.id);

          // 如果当前有选中的图谱，获取对应的数据
          if (currentGraphId.value) {
            if(currentLevel.value==3){
              await fetchEntityAndRelationTypes(currentSubDomainObj.id);
            }
            if (currentGraphCreateMethod.value === '0') {
              // 文本创建方式，获取文章URL和段落列表
              const response = await projectService.getArticleUrl(
                currentGraphId.value,
              );
              textUrl.value = response.data;
              currentPage.value = 0;
              hasData.value = true;

              // 调用段落列表查询接口
              await getSequenceList(currentGraphId.value);
            } else if (currentGraphCreateMethod.value === '1' || currentGraphCreateMethod.value === '2') {
              // 其他创建方式，重新获取图谱数据
              await reloadGraphData(currentGraphId.value);
            }
          }
        }
      }
    }
  }
});

// 获取所有领域列表
const fetchAllDomains = async () => {
  try {
    isLoadingDomains.value = true;
    const response = await projectService.getDomainList("");
    if (response && response.data) {
      allDomains.value = response.data.map((item) => ({
        id: item.fieldId,
        name: item.fieldName,
        icon: "el-icon-menu",
      }));
      // 初始时显示所有领域
      domains.value = [...allDomains.value];
      // 更新原始搜索选项（用于后续高亮显示）
      originalSearchOptions.value = allDomains.value.map((domain) => ({
        value: domain.name,
      }));
    }
  } catch (error) {
    console.error("获取领域列表失败:", error);
  } finally {
    isLoadingDomains.value = false;
  }
};

// 搜索领域列表
const searchDomains = async (condition = "") => {
  try {
    const response = await projectService.getDomainList(condition);
    if (response && response.data) {
      return response.data.map((item) => ({
        id: item.fieldId,
        name: item.fieldName,
        icon: "el-icon-menu",
      }));
    }
    return [];
  } catch (error) {
    console.error("搜索领域列表失败:", error);
    return [];
  }
};

const handleDeleteDomain = async (id) => {
  console.log("开始删除领域，ID:", id);
  try {
    // 询问是否删除
    console.log("显示确认对话框");
    await ElMessageBox.confirm("确定要删除该领域吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "custom-delete-dialog",
      confirmButtonClass: "confirm-btn",
      cancelButtonClass: "cancel-btn",
    });

    console.log("用户确认删除，执行删除操作");
    // 用户确认删除
    await projectService.deleteDomain(id);
    console.log("删除操作成功，重新获取领域列表");
    // 删除成功后，重新获取所有领域列表
    await fetchAllDomains();
    console.log("重新获取领域列表成功");
  } catch (error) {
    // 如果用户取消删除，error 会被捕获，这里不做处理
    console.log("删除操作被中断，错误:", error);
    if (error !== "cancel") {
      console.error("删除领域失败:", error);
    }
  }
};

const openAddDialog = () => {
  showAddDialog.value = true;
};

const handleAddDomain = async (name) => {
  if (name) {
    try {
      const response = await projectService.addDomain({ fieldName: name });
      if (response && response.data) {
        // 新增成功后，重新获取所有领域列表
        await fetchAllDomains();
        newDomainName.value = "";
        showAddDialog.value = false;
      }
    } catch (error) {
      console.error("新增领域失败:", error);
    }
  }
};

// 处理搜索输入变化 - 只更新下拉框显示历史记录，不调用接口
const handleSearch = (query) => {
  searchQuery.value = query;

  if (currentSubDomainId.value && currentMode.value === 'graph') {
    // 在图谱页面，只更新下拉框显示历史记录，不调用接口
    if (query) {
      // 如果有输入内容，过滤历史记录
      const filteredHistory = graphSearchHistory.value.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
      );
      if (filteredHistory.length > 0) {
        graphSearchOptions.value = filteredHistory.map((item) => ({
          value: item,
          isHistory: true,
        }));
      } else {
        graphSearchOptions.value = [{ value: "暂无匹配历史", disabled: true }];
      }
    } else {
      // 输入框为空，显示全部历史记录
      updateGraphSearchOptions();
    }
  } else if (currentDomain.value) {
    // 在专题页面，只更新下拉框显示历史记录，不调用接口
    if (query) {
      // 如果有输入内容，过滤历史记录
      const filteredHistory = topicSearchHistory.value.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
      );
      if (filteredHistory.length > 0) {
        topicSearchOptions.value = filteredHistory.map((item) => ({
          value: item,
          isHistory: true,
        }));
      } else {
        topicSearchOptions.value = [{ value: "暂无匹配历史", disabled: true }];
      }
    } else {
      // 输入框为空，显示全部历史记录
      updateTopicSearchOptions();
    }
  } else {
    // 在领域页面，只更新下拉框显示历史记录，不调用接口
    if (query) {
      // 如果有输入内容，过滤历史记录
      const filteredHistory = domainSearchHistory.value.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
      );
      if (filteredHistory.length > 0) {
        searchOptions.value = filteredHistory.map((item) => ({
          value: item,
          isHistory: true,
        }));
      } else {
        searchOptions.value = [{ value: "暂无匹配历史", disabled: true }];
      }
    } else {
      // 输入框为空，显示全部历史记录
      updateDomainSearchOptions();
    }
  }
};

// 选择搜索下拉框中的项 - 调用接口查询
const selectSearchItem = async (value) => {
  searchQuery.value = value;

  if (currentSubDomainId.value && currentMode.value === 'graph') {
    // 在图谱页面，添加图谱搜索历史
    addGraphSearchHistory(value);
    // 调用图谱搜索接口
    await fetchGraph(currentSubDomainId.value, value);
    // 更新下拉框显示历史记录
    updateGraphSearchOptions();
  } else if (currentDomain.value) {
    // 在专题页面，添加专题搜索历史
    addTopicSearchHistory(value);
    // 调用专题搜索接口
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
    );
    if (currentDomainObj) {
      await fetchTopics(currentDomainObj.id, value);
    }
    // 更新下拉框显示历史记录
    updateTopicSearchOptions();
  } else {
    // 在领域页面，添加领域搜索历史
    addDomainSearchHistory(value);
    // 调用领域搜索接口
    const searchResults = await searchDomains(value);
    if (searchResults.length > 0) {
      domains.value = [...searchResults];
    } else {
      domains.value = [];
    }
    // 更新下拉框显示历史记录
    updateDomainSearchOptions();
  }
};

// 搜索图标点击事件处理 - 调用接口查询
const handleSearchIconClick = async (query) => {
  if (query) {
    // 添加领域搜索历史
    addDomainSearchHistory(query);
    // 调用接口搜索领域列表
    const searchResults = await searchDomains(query);

    // 更新领域列表
    if (searchResults.length === 0) {
      domains.value = [];
    } else {
      domains.value = [...searchResults];
    }
  } else {
    // 搜索框为空，重新获取所有领域列表
    await fetchAllDomains();
  }
  // 更新下拉框显示历史记录
  updateDomainSearchOptions();
};


// 专题搜索图标点击事件处理 - 调用接口查询
const handleTopicSearchIconClick = async (query) => {
  const currentDomainObj = domains.value.find(
    (domain) => domain.name === currentDomain.value,
  );
  if (currentDomainObj) {
    if (query) {
      // 添加专题搜索历史
      addTopicSearchHistory(query);
      // 调用接口获取专题列表
      const response = await projectService.getTopicProjectList(
        query,
        currentDomainObj.id,
      );
      // 更新专题列表
      if (response && response.data && response.data.length > 0) {
        topics.value = response.data.map((item) => ({
          id: item.topicId,
          name: item.topicName,
          fieldId: item.fieldId,
        }));
      } else {
        topics.value = [];
      }
    } else {
      // 搜索框为空，获取所有专题并显示
      const response = await projectService.getTopicProjectList(
        "",
        currentDomainObj.id,
      );
      if (response && response.data) {
        topics.value = response.data.map((item) => ({
          id: item.topicId,
          name: item.topicName,
          fieldId: item.fieldId,
        }));
      } else {
        topics.value = [];
      }
    }
    // 更新下拉框显示历史记录
    updateTopicSearchOptions();
  }
};

// 图谱搜索处理 - 只更新下拉框显示历史记录，不调用接口
const handleGraphSearch = (query) => {
  // 只更新下拉框显示历史记录，不调用接口
  if (query) {
    // 如果有输入内容，过滤历史记录
    const filteredHistory = graphSearchHistory.value.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
    if (filteredHistory.length > 0) {
      graphSearchOptions.value = filteredHistory.map((item) => ({
        value: item,
        isHistory: true,
      }));
    } else {
      graphSearchOptions.value = [{ value: "暂无匹配历史", disabled: true }];
    }
  } else {
    // 输入框为空，显示全部历史记录
    updateGraphSearchOptions();
  }
};

// 图谱搜索图标点击事件处理 - 调用接口查询
const handleGraphSearchIconClick = async (query) => {
  if (currentSubDomainId.value) {
    if (query) {
      // 添加图谱搜索历史
      addGraphSearchHistory(query);
      // 调用接口获取图谱列表
      await fetchGraph(currentSubDomainId.value, query);
    } else {
      // 搜索框为空，获取所有图谱并显示
      await fetchGraph(currentSubDomainId.value, "");
    }
    // 更新图谱搜索下拉框选项
    updateGraphSearchOptions();
  }
};

const handleBackToDomains = async() => {
  currentDomain.value = "";
  currentSubDomain.value = "";
  currentGraphId.value = "";
  currentGraphName.value = "";
  currentGraphCreateMethod.value = "";
  currentLevel.value = 0;
  subDomains.value = [];
  subSubDomains.value = [];
  // 清空图谱数据，避免显示上一个页面的图谱
  graphNodes.value = [];
  graphEdges.value = [];
  // 清空文本URL，隐藏文本区域
  textUrl.value = "";
  // 重新获取领域列表数据
  isLoadingDomains.value = true;
  try {
    await fetchAllDomains();
  } finally {
    isLoadingDomains.value = false;
  }
  // 更新时间戳，强制重新创建 GraphViewer 组件
  graphViewerKey.value = Date.now();
  // 切换回领域页面，更新下拉框显示领域搜索历史
  updateDomainSearchOptions();
  saveState();
};

const handleBackToSubDomains = async() => {
  // 保存当前子领域名称，用于显示数量
  const previousSubDomain = currentSubDomain.value;
  currentSubDomain.value = "";
  currentSubDomainId.value = "";
  currentGraphId.value = "";
  currentGraphName.value = "";
  currentGraphCreateMethod.value = "";
  currentLevel.value = 1;
  subSubDomains.value = [];
  // 清空图谱数据，避免显示上一个页面的图谱
  graphNodes.value = [];
  graphEdges.value = [];
  // 清空文本URL，隐藏文本区域
  textUrl.value = "";
  // 重新获取专题列表数据
  const currentDomainObj = domains.value.find(
    (domain) => domain.name === currentDomain.value,
  );
  if (currentDomainObj) {
    isLoadingTopics.value = true;
    try {
      await fetchTopics(currentDomainObj.id);
    } finally {
      isLoadingTopics.value = false;
    }
  }
  // 更新时间戳，强制重新创建 GraphViewer 组件
  graphViewerKey.value = Date.now();
  // 可以在这里更新子领域的数量
  // 例如：subDomains中找到对应的子领域并更新其数量
  saveState();
};
const backToSubGraphList = async() => {
  // 从图谱详情页面返回时，保持子领域名称不变，只清空图谱相关信息
  // 这样就会回到图谱列表页面，而不是专题列表页面
  currentGraphId.value = "";
  currentGraphName.value = "";
  currentGraphCreateMethod.value = "";
  // 设置层级为 2，确保显示图谱列表页面
  currentLevel.value = 2;
  // 清空图谱数据，避免返回列表页后显示详情页的图谱
  graphNodes.value = [];
  graphEdges.value = [];
  // 清空文本URL，隐藏文本区域
  textUrl.value = "";
  subSubDomains.value = [];
  await fetchGraph(currentSubDomainId.value);
  // 更新时间戳，强制重新创建 GraphViewer 组件
  // graphViewerKey.value = Date.now();
  // 可以在这里更新子领域的数量
  // 例如：subDomains中找到对应的子领域并更新其数量
  saveState();
};
// 存储专题列表
const topics = ref([]);
// 专题搜索条件
const topicSearchQuery = ref("");

// 处理领域点击，获取该领域下的专题列表
const handleDomainClick = async (domain) => {
  currentDomain.value = domain.name;
  currentDomainId.value = domain.id;
  currentSubDomain.value = "";
  currentGraphName.value = "";
  currentGraphId.value = "";
  currentLevel.value = 1;
  currentGraphCreateMethod.value = "";
  // 清空图谱数据，避免显示上一个页面的图谱
  graphNodes.value = [];
  graphEdges.value = [];
  // 清空文本URL，隐藏文本区域
  textUrl.value = "";
  // 更新时间戳，强制重新创建 GraphViewer 组件
  graphViewerKey.value = Date.now();
  // 立即清空topics列表，避免显示上一个领域的专题数据
  topics.value = [];
  // 设置加载状态
  isLoadingTopics.value = true;

  // 调用接口获取专题列表
  await fetchTopics(domain.id);
  // 取消加载状态
  isLoadingTopics.value = false;

  // 切换到专题页面，更新下拉框显示专题搜索历史
  updateTopicSearchOptions();
  saveState();
};

// 获取专题列表
const fetchTopics = async (fieldId, condition = "") => {
  try {
    const currentDomainObj = domains.value.find(
      (domain) => domain.id === currentDomainId.value,
    );
    if (!currentDomainObj) return;

    const response = await projectService.getTopicProjectList(
      condition,
      currentDomainObj.id,
    );
    if (response && response.data) {
      topics.value = response.data.map((item) => ({
        id: item.topicId,
        name: item.topicName,
        fieldId: item.fieldId,
      }));
    } else {
      topics.value = [];
    }
  } catch (error) {
    console.error("获取专题列表失败:", error);
    topics.value = [];
  }
};

//获取图谱列表
const fetchGraph = async (topicId, condition = "") => {
  console.log("搜索接口公共处",condition)
  // 防止重复调用
  if (isFetchingGraph.value) return;

  try {
    
    const currentTopicObj = topics.value.find((topic) => topic.id === topicId);
    if (!currentTopicObj) return;

    isFetchingGraph.value = true;
    isLoadingGraphs.value = true;

    const response = await projectService.getGraphList(currentTopicObj.id, condition);
      
    if (response && response.data) {
      graphs.value = [];
      for (const graph of response.data) {
        const newGraph: GraphConfig = {
          id: graph.articleId,
          name: graph.articleName,
          articleUrl: null,
          articleName: graph.articleName,
          topicId: graph.topicId,
          topicName: currentSubDomain.value,
          domainId: currentDomainId.value,
          domainName: currentDomain.value,
          createMethod: graph.createMethod,
          createdAt: graph.createTime,
        };
        graphs.value.push(newGraph);
      }
    } else {
      graphs.value = [];
    }

      //graphs.value = response.data.map((item) => ({
      //  id: item.articleId,
      //  name: item.articleName,
      //  topicId: item.topicId,
      //}));
  } catch (error) {
    console.error("获取图谱列表失败:", error);
    graphs.value = [];
  } finally {
    isLoadingGraphs.value = false;
    isFetchingGraph.value = false;
  }
};

// 删除专题
const handleDeleteTopic = async (id) => {
  try {
    // 询问是否删除
    await ElMessageBox.confirm("确定要删除该专题吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "custom-delete-dialog",
      confirmButtonClass: "confirm-btn",
      cancelButtonClass: "cancel-btn",
    });

    // 用户确认删除
    await projectService.deleteTopic(id);

    // 删除成功后，重新获取专题列表
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
    );
    if (currentDomainObj) {
      await fetchTopics(currentDomainObj.id);
    }
  } catch (error) {
    // 如果用户取消删除，error 会被捕获，这里不做处理
    if (error !== "cancel") {
      console.error("删除专题失败:", error);
    }
  }
};

// 处理复制领域
const handleCopyDomain = async (id, newName) => {
  try {
    // 调用复制领域接口
    await projectService.copyField(id, newName);
    // 复制成功后，重新获取领域列表
    await fetchAllDomains();
    ElMessage.success("复制领域成功");
  } catch (error) {
    console.error("复制领域失败:", error);
  }
};

// 处理复制专题
const handleCopyTopic = async (id, newName) => {
  try {
    // 调用复制专题接口
    await projectService.copyTopic(id, newName);
    // 复制成功后，重新获取专题列表
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
    );
    if (currentDomainObj) {
      await fetchTopics(currentDomainObj.id);
    }
    ElMessage.success("复制专题成功");
  } catch (error) {
    console.error("复制专题失败:", error);
  }
};

// 搜索专题 - 只更新下拉框显示历史记录，不调用接口
const handleTopicSearch = (query) => {
  topicSearchQuery.value = query;

  // 只更新下拉框显示历史记录，不调用接口
  if (query) {
    // 如果有输入内容，过滤历史记录
    const filteredHistory = topicSearchHistory.value.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
    if (filteredHistory.length > 0) {
      topicSearchOptions.value = filteredHistory.map((item) => ({
        value: item,
        isHistory: true,
      }));
    } else {
      topicSearchOptions.value = [{ value: "暂无匹配历史", disabled: true }];
    }
  } else {
    // 输入框为空，显示全部历史记录
    updateTopicSearchOptions();
  }
};

// 处理专题点击，设置当前子领域为专题名称-handleTopic
const handleTopicClick = async (subDomain) => {
  currentSubDomain.value = subDomain.name;
  currentSubDomainId.value = subDomain.id;
  currentLevel.value = 2;
  currentGraphId.value = "";
  currentGraphName.value = "";
  // 清空图谱数据，避免显示上一个页面的图谱
  graphNodes.value = [];
  graphEdges.value = [];
  // 清空文本URL，隐藏文本区域
  textUrl.value = "";
  // 更新时间戳，强制重新创建 GraphViewer 组件
  graphViewerKey.value = Date.now();
  console.log("处理专题点击handleTopicClick",subDomain.id)
  await fetchGraph(subDomain.id);
  // await fetchEntityAndRelationTypes(subDomain.id);
  saveState();
};

// 获取实体和关系类型列表
const fetchEntityAndRelationTypes = async (topicId) => {
  try {
    isLoadingTemplates.value = true;
    const response = await projectService.queryTemplate(topicId);
    if (response && response.data) {
      // 处理实体类型
      if (response.data.nodeTemplates && Array.isArray(response.data.nodeTemplates)) {
        entityTypes.value = response.data.nodeTemplates.map((item) => item.nodeTemplateName);
        nodeTemplates.value = response.data.nodeTemplates;
      } else {
        entityTypes.value = [];
        nodeTemplates.value = [];
      }

      // 处理关系类型
      if (response.data.relationTemplates && Array.isArray(response.data.relationTemplates)) {
        relationTemplates.value = response.data.relationTemplates;
      } else {
        relationTemplates.value = [];
      }
    } else {
      entityTypes.value = [];
      nodeTemplates.value = [];
      relationTemplates.value = [];
    }
  } catch (error) {
    console.error("获取实体和关系类型列表失败:", error);
    entityTypes.value = [];
    nodeTemplates.value = [];
    relationTemplates.value = [];
  } finally {
    isLoadingTemplates.value = false;
  }
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


// 接收 PDF 选区内容与坐标（来自 TextSelection → Text）
const handlePdfSelectionChange = (payload: Mark) => {
  pdfSelectionContent.value = payload.content;
  pdfSelectionRects.value = payload.rects ?? [];
  pdfSelectionMark.value = payload;

  textStore.addMark(payload);
  // 在 PDF 上绘制该选区下划线（通过 Text → TextSelection.drawMark）
  textRef.value?.drawMark?.(payload);
};

//上一页
const hanlePreviousPage = () => {
  //pageNum.value = Math.max(0, pageNum.value - 1);
  notifyPageChange(pageNum.value);
};

//下一页
const hanleNextPage = () => {
  //pageNum.value = pageNum.value + 1;
  notifyPageChange(pageNum.value);
};

// 跳页至
const handleJumpPage = (page: number) => {
  //pageNum.value = page;
  notifyPageChange(pageNum.value);
};

// 图谱创建相关状态
const isConfirmButtonDisabled = ref(false);
const isLoading = ref(false);

// 处理创建图谱
const handleCreateGraph = async (graphData) => {
  if (!graphData.graphName) {
    return;
  }
  const state = loadState();
  if (!graphData.createMethod) {
    return;
  }

  isConfirmButtonDisabled.value = true;
  isLoading.value = true;

  // 构造图谱数据
  const graphDataToSend = {
    articleName: graphData.graphName,
    createMethod: graphTypeString2Integer(graphData.createMethod).toString(),
    topicId: state.currentSubDomainId,
    uploadedFile:
      graphData.createMethod === "text" ? graphData.uploadedFile : null,
    databaseName:
      graphData.createMethod === "database" ? graphData.databaseName : "",
    anyContent: graphData.createMethod === "any" ? graphData.anyContent : "",
  };

  // 这里可以处理图谱创建的逻辑，例如保存图谱数据到后端
  console.log("创建图谱:", graphDataToSend);

  // 模拟创建成功
  console.log("state.currentSubDomainId:", state.currentSubDomainId);
  try {
    const addGraphResponse = await projectService.addArticle(graphDataToSend);
    console.log("添加图谱响应:", addGraphResponse);
    if (addGraphResponse.resultCode === "0000") {
      console.log("重新获取图谱列表，确保数据同步:", state.currentSubDomainId);
      // 重新获取图谱列表，确保数据同步
      await fetchGraph(state.currentSubDomainId);
      
      // 关闭弹窗
      showGraphDialog.value = false;
    }
  } catch (error) {
    console.error("创建图谱失败:", error);
  } finally {
    isConfirmButtonDisabled.value = false;
    isLoading.value = false;
  }
};

// 处理创建图谱点击
const handleCreateGraphClick = () => {
  showGraphDialog.value = true;
};

// 处理取消创建图谱
const handleCancelCreateGraph = () => {
  showGraphDialog.value = false;
};

// 处理图谱点击
const handleGraphClick = async (graph) => {
  console.log("点击图谱:", graph);
  // 清除选中的关系模板，避免后续连线时仍使用该模板进行校验
  selectedRelationshipTemplate.value = null;
  // 重置已点击关系模板的标记
  hasClickedRelationshipTemplate.value = false;
  currentLevel.value = 3;
  currentGraphId.value = graph.id;
  currentGraphName.value = graph.name;
  console.log("图谱列表",graph)
  currentGraphCreateMethod.value = graph.createMethod;
  // 更新时间戳，强制重新创建 GraphViewer 组件
  graphViewerKey.value = Date.now();
  // 清空当前图谱数据，避免在详情页显示列表页的图谱
  graphNodes.value = [];
  graphEdges.value = [];
  // 先设置 hasData 为 false，避免在PDF加载完成前显示图谱
  hasData.value = false;
  // 先设置 pdfLoaded 为 false
  pdfLoaded.value = false;
  
  // 点击图谱时隐藏属性面板
  showPropertyPanel.value = false;
  fetchEntityAndRelationTypes(graph.topicId);
  if(currentGraphCreateMethod.value === '0'){
    // 设置 hasData 为 true，显示关系图（文本创建方式在获取PDF URL后显示）
    hasData.value = true;
    projectService.getArticleUrl(graph.id).then(response => {
      textUrl.value = response.data;
      currentPage.value = 0;
      
      // 清除之前的标记，避免切换图谱时残留上一个图谱的黄色下划线
      textStore.setMarkList([]);
      if (textRef.value) {
        textRef.value.clearMark();
      }
      
      // 调用段落列表查询接口
      getSequenceList(graph.id);
    });
  } else {
    // 其他创建方式（'1' 或 '2'），调用查询接口获取图谱数据
    try {
      console.log('开始获取其他创建方式的图谱数据，articleId:', graph.id);
      const response = await projectService.getGraphByArticleId(graph.id);
      console.log('获取图谱数据响应:', response);
      if (response && response.data) {
        // 转换节点数据格式，确保每个节点都有 id 字段
        const rawNodes = response.data.nodes || [];
        const rawEdges = response.data.relations || [];

        // 转换节点数据格式，统一使用 nodeHash 作为 id
        graphNodes.value = rawNodes.map(node => {
          const nodeHash = node.nodeHash || node.nodeId || node.id;
          // 转换属性格式
          const properties = (node.properties || []).map(prop => ({
            name: prop.propertyKey || prop.name,
            type: prop.propertyType || prop.type || 'string',
            value: prop.propertyValue || prop.value || '',
          }));

          return {
            id: nodeHash,
            nodeId: node.nodeId,
            nodeHash: nodeHash,
            name: node.nodeName || node.name,
            nodeName: node.nodeName,
            type: node.nodeType || node.type,
            nodeType: node.nodeType,
            description: node.nodeDescription || node.description,
            nodeDescription: node.nodeDescription,
            backgroundColor: node.nodeColor || node.backgroundColor || '#43D7B5',
            nodeColor: node.nodeColor,
            properties: properties,
            nodeTemplateId: node.nodeTemplateId,
            nodeTemplateName: node.nodeTemplateName,
          };
        });

        // 转换边数据格式，确保 source 和 target 对应节点的 id（nodeHash）
        graphEdges.value = rawEdges.map(edge => {
          // 获取边的源和目标标识（使用 nodeHash）
          const sourceKey = edge.startNodeHash || edge.startNodeId || edge.source;
          const targetKey = edge.endNodeHash || edge.endNodeId || edge.target;

          // 直接使用 nodeHash 作为 source 和 target
          const sourceId = sourceKey;
          const targetId = targetKey;

          // 转换属性格式
          const edgeProperties = (edge.properties || []).map(prop => ({
            name: prop.propertyKey || prop.name,
            type: prop.propertyType || prop.type || 'string',
            value: prop.propertyValue || prop.value || '',
          }));

          return {
            id: String(edge.relationId || edge.id || edge.relationHash),
            relationId: edge.relationId,
            relationHash: edge.relationHash,
            source: String(sourceId),
            target: String(targetId),
            startNodeId: edge.startNodeId,
            endNodeId: edge.endNodeId,
            startNodeHash: edge.startNodeHash,
            endNodeHash: edge.endNodeHash,
            data: {
              name: edge.relationName || edge.name,
              type: edge.relationType || edge.type || '定向',
              properties: edgeProperties,
            },
            relationName: edge.relationName,
            relationType: edge.relationType,
            relationTemplateId: edge.relationTemplateId,
            relationTemplateName: edge.relationTemplateName,
          };
        });
        
        console.log('图谱数据加载成功，节点数:', graphNodes.value.length, '边数:', graphEdges.value.length);
        console.log('转换后的节点数据:', graphNodes.value);
        console.log('转换后的边数据:', graphEdges.value);
      } else {
        console.log('接口返回数据为空');
        graphNodes.value = [];
        graphEdges.value = [];
      }
      // 数据加载完成后再显示图谱，确保EditorContainer能正确渲染节点和连线
      hasData.value = true;
    } catch (error) {
      console.error('获取图谱数据失败:', error);
      ElMessage.error('获取图谱数据失败');
      graphNodes.value = [];
      graphEdges.value = [];
      // 即使出错也显示图谱（空状态）
      hasData.value = true;
    }
  }
};

// 重新加载图谱数据（用于页面刷新后恢复数据）
const reloadGraphData = async (articleId) => {
  console.log('重新加载图谱数据，articleId:', articleId);
  try {
    const response = await projectService.getGraphByArticleId(articleId);
    console.log('重新加载图谱数据响应:', response);
    if (response && response.data) {
      // 转换节点数据格式，确保每个节点都有 id 字段
      const rawNodes = response.data.nodes || [];
      const rawEdges = response.data.relations || [];

      // 转换节点数据格式，统一使用 nodeHash 作为 id
      graphNodes.value = rawNodes.map(node => {
        const nodeHash = node.nodeHash || node.nodeId || node.id;
        // 转换属性格式
        const properties = (node.properties || []).map(prop => ({
          name: prop.propertyKey || prop.name,
          type: prop.propertyType || prop.type || 'string',
          value: prop.propertyValue || prop.value || '',
        }));

        return {
          id: nodeHash,
          nodeId: node.nodeId,
          nodeHash: nodeHash,
          name: node.nodeName || node.name,
          nodeName: node.nodeName,
          type: node.nodeType || node.type,
          nodeType: node.nodeType,
          description: node.nodeDescription || node.description,
          nodeDescription: node.nodeDescription,
          backgroundColor: node.nodeColor || node.backgroundColor || '#43D7B5',
          nodeColor: node.nodeColor,
          properties: properties,
          nodeTemplateId: node.nodeTemplateId,
          nodeTemplateName: node.nodeTemplateName,
        };
      });

      // 转换边数据格式，确保 source 和 target 对应节点的 id（nodeHash）
      graphEdges.value = rawEdges.map(edge => {
        // 获取边的源和目标标识（使用 nodeHash）
        const sourceKey = edge.startNodeHash || edge.startNodeId || edge.source;
        const targetKey = edge.endNodeHash || edge.endNodeId || edge.target;

        // 直接使用 nodeHash 作为 source 和 target
        const sourceId = sourceKey;
        const targetId = targetKey;

        // 转换属性格式
        const edgeProperties = (edge.properties || []).map(prop => ({
          name: prop.propertyKey || prop.name,
          type: prop.propertyType || prop.type || 'string',
          value: prop.propertyValue || prop.value || '',
        }));

        return {
          id: String(edge.relationId || edge.id || edge.relationHash),
          relationId: edge.relationId,
          relationHash: edge.relationHash,
          source: String(sourceId),
          target: String(targetId),
          startNodeId: edge.startNodeId,
          endNodeId: edge.endNodeId,
          startNodeHash: edge.startNodeHash,
          endNodeHash: edge.endNodeHash,
          data: {
            name: edge.relationName || edge.name,
            type: edge.relationType || edge.type || '定向',
            properties: edgeProperties,
          },
          relationName: edge.relationName,
          relationType: edge.relationType,
          relationTemplateId: edge.relationTemplateId,
          relationTemplateName: edge.relationTemplateName,
        };
      });
      
      console.log('图谱数据重新加载成功，节点数:', graphNodes.value.length, '边数:', graphEdges.value.length);
      hasData.value = true;
    } else {
      console.log('接口返回数据为空');
      graphNodes.value = [];
      graphEdges.value = [];
      hasData.value = true;
    }
  } catch (error) {
    console.error('重新加载图谱数据失败:', error);
    graphNodes.value = [];
    graphEdges.value = [];
    hasData.value = true;
  }
};

// 获取段落列表并保存图谱
const getSequenceList = async (articleId) => {
  try {
    // 调用段落列表查询接口
    const sequenceResponse = await projectService.getSequenceList(articleId);
    if (sequenceResponse.resultCode === "0000" && sequenceResponse.data) {
      // 存储段落列表数据
      sequenceListData.value = sequenceResponse.data;
      console.log("获取段落列表成功:", sequenceListData.value);
      
      // 绘制黄色下划线
      if (textRef.value && sequenceListData.value.length > 0) {
        // 先清除之前的标记
        textRef.value.clearMark();
        // 清除textStore中的标记列表，确保样式计算的准确性
        textStore.setMarkList([]);
        
        // 计算段落之间的重叠关系
        const sequenceRelations = [];
        
        // 分析每个段落的位置范围
        sequenceListData.value.forEach((sequence, index) => {
          if (sequence.sequencePositionList && sequence.sequencePositionList.length > 0) {
            const firstPos = sequence.sequencePositionList[0];
            const lastPos = sequence.sequencePositionList[sequence.sequencePositionList.length - 1];
            sequenceRelations.push({
              sequenceId: sequence.sequenceId,
              content: sequence.sequenceContent,
              startX: firstPos.sequenceX0,
              startY: firstPos.sequenceY0,
              endX: lastPos.sequenceX1,
              endY: lastPos.sequenceY1,
              length: sequence.sequenceContent.length,
              page: firstPos.sequencePage,
              sequencePositionList: sequence.sequencePositionList
            });
          }
        });
        
        // 为每个段落确定样式
        sequenceListData.value.forEach(sequence => {
          if (sequence.sequencePositionList && sequence.sequencePositionList.length > 0) {
            let style = "solid"; // 默认样式
            
            // 检查是否与其他段落重叠
            const currentSeq = sequenceRelations.find(s => s.sequenceId === sequence.sequenceId);
            if (currentSeq) {
              const overlappingSequences = sequenceRelations.filter(s => {
                if (s.sequenceId === sequence.sequenceId) return false;
                // 检查是否在同一页
                if (currentSeq.page !== s.page) return false;
                // 简单的重叠检测：检查Y坐标范围是否重叠
                return !(s.endY < currentSeq.startY || s.startY > currentSeq.endY);
              });
              
              if (overlappingSequences.length > 0) {
                // 有重叠，根据内容长度确定样式
                const isLonger = overlappingSequences.every(s => currentSeq.length > s.length);
                style = isLonger ? "double" : "dashed";
              }
            }
            
            const mark = {
              id: `sequence-${sequence.sequenceId}`,
              content: sequence.sequenceContent || "",
              rects: sequence.sequencePositionList.map(pos => ({
                x0: pos.sequenceX0,
                y0: pos.sequenceY0,
                x1: pos.sequenceX1,
                y1: pos.sequenceY1,
                width: pos.sequenceX1 - pos.sequenceX0,
                height: pos.sequenceY1 - pos.sequenceY0,
                page: pos.sequencePage
              })),
              type: 0, // MarkType.submitted
              articleId: articleId,
              color: "#ffff00", // 黄色
              sequenceId: sequence.sequenceId,
              style: style // 添加样式信息
            };
            // 将标记添加到 textStore 中，确保手动选中文本时不会消失
            if (!textStore.markList.some(m => m.id === mark.id)) {
              textStore.addMark(mark);
            } else {
              // 如果标记已存在，更新它的样式
              const existingMark = textStore.markList.find(m => m.id === mark.id);
              if (existingMark) {
                existingMark.style = style;
                // 保存更新后的标记列表
                textStore.setMarkList([...textStore.markList]);
              }
            }
            textRef.value.drawMark(mark);
          }
        });
      }
    }
  } catch (error) {
    console.error("获取段落列表或保存图谱失败:", error);
  }
};

// 处理编辑图谱
const handleEditGraph = (graph) => {
  console.log("编辑图谱:", graph);
  // 可以在这里打开编辑对话框
};

// 处理删除图谱
const handleDeleteGraph = (graph) => {
  console.log("删除图谱:", graph.id, "名称:", graph.name);
  // 从图谱列表中移除

  ElMessageBox.confirm(`确定是否删除图谱 "${graph.name}" 吗`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then((result) => {
      projectService.deleteArticle(graph.id).then((response) => {
        graphs.value = graphs.value.filter((g) => g.id !== graph.id);
        console.log(response);
        nextTick(() => {
          if (graphViewer.value) {
            graphViewer.value.fetchGraphData();
          }
        });
      });
    })
    .catch((e) => {
      console.log("删除失败");
      console.log(e);
    });
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
};

// 处理添加实体
const handleAddEntity = (position) => {
  currentOperation.value = "entity";
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

// 处理创建关系
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
  console.log(444444444444444, sourceId);
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

// 处理连接完成
const handleConnectionComplete = (targetId) => {
  console.log("连接完成，目标节点ID:", targetId);
  console.log("源节点ID:", sourceNodeId.value);
  operationSource.value = "canvas";
  // 存储原始的目标节点ID
  originalTargetNodeId.value = targetId;
  console.log(555555555555, targetId);
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
  let targetTemplateId = targetNode && targetNode.nodeTemplateId
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

  // 获取模板名称和ID（兼容字符串和对象）
  const templateName = typeof item === "string" ? item : (item.nodeTemplateName || item.name);
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
    nodeId: "", // 后端生成
    nodeHash: "", // 后端生成
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

// 处理退出
const handleQuit = () => {
  console.log("退出编辑器");
  // 可以在这里添加退出编辑器的处理逻辑
};

// 处理清除
const handleClear = () => {
  console.log("清除画布");
  
  // 首先重置连接状态，清除临时边和虚拟节点
  if (contentRef.value && contentRef.value.resetConnectionState) {
    contentRef.value.resetConnectionState();
  }
  
  // 清除节点和连线的选中状态
  if (contentRef.value && contentRef.value.clearNodeSelection) {
    contentRef.value.clearNodeSelection();
  }
  if (contentRef.value && contentRef.value.clearEdgesSelection) {
    contentRef.value.clearEdgesSelection();
  }
  
  // 只保留接口返回的节点和连线，清除手动添加的
  // 手动添加的节点和边存储在 pendingGraphNodes 和 pendingGraphEdges 中
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
};

// 处理提交
const handleSubmit = () => {
  console.log("提交图谱");
  handleSaveGraph();
};

// 处理删除项目
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

// 处理保存图谱
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
      articleId: currentGraphId.value || "",
      sequenceId: currentSequenceId.value || "",
      sequenceContent: content.value,
      sequencePositionList: currentSelectedSequence.value && currentSelectedSequence.value.sequencePositionList
        ? currentSelectedSequence.value.sequencePositionList
        : [],
      graphNode: graphNodes.value.map((node) => ({
        nodeHash: node.nodeHash || generateNodeHash(node),
        nodeName: node.nodeName || node.name,
        nodeTemplateId: node.nodeTemplateId || 0,
        nodeTemplateName: node.nodeTemplateName || node.name,
        nodeDescription: node.nodeDescription || node.description || "",
        nodeColor: node.nodeColor || node.backgroundColor || "#43D7B5",
        properties: node.properties || [],
      })),
      graphRelation: graphEdges.value.map((edge) => {
        // 查找源节点和目标节点
        const startNode = graphNodes.value.find(
          (node) => String(node.id) === String(edge.source)
        );
        const endNode = graphNodes.value.find(
          (node) => String(node.id) === String(edge.target)
        );

        return {
          relationHash: edge.relationHash || edge.id,
          relationName: edge.relationName || edge.data?.name || "",
          relationTemplateId: edge.relationTemplateId || 0,
          relationTemplateName: edge.relationTemplateName || edge.data?.name || "",
          relationType: edge.relationType || "1",
          relationTrigger: edge.relationTrigger || "",
          startNodeHash: startNode ? (startNode.nodeHash || generateNodeHash(startNode)) : edge.startNodeHash || edge.source,
          endNodeHash: endNode ? (endNode.nodeHash || generateNodeHash(endNode)) : edge.endNodeHash || edge.target,
          properties: edge.data?.properties || edge.properties || [],
        };
      }),
    };

    console.log("保存图谱数据:", saveData);

    // 调用保存接口
    const response = await projectService.saveGraph(saveData);

    if (response && response.resultCode === "0000") {
      ElMessage.success("图谱保存成功");
      // 保存成功后，清空临时存储
      pendingGraphNodes.value = [];
      pendingGraphEdges.value = [];
    } else {
      ElMessage.error("图谱保存失败，请稍后重试");
    }
  } catch (error) {
    console.error("保存图谱失败:", error);
    ElMessage.error("图谱保存失败，请稍后重试");
  }
};

// 处理关闭属性面板
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

// 处理取消属性面板
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

// 处理保存属性面板
const handleSavePropertyPanel = (data) => {
  showPropertyPanel.value = false;
  // 保存实体或关系的属性
  hasData.value = true;
  savedEntitiesCount.value += 1;
  // 根据当前操作类型处理
  if (data.currentOperation === "entity") {
    // 更新entityProperties变量，这样当用户再次点击同一个实体类型或组件时，属性面板会显示修改后的值
    entityProperties.value = [...data.entityProperties];
    console.log(999999999999, data, currentNodeTemplateId.value);
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

// 处理添加属性
const handleAddProperty = () => {
  // 可以在这里添加添加属性的处理逻辑
};

// 处理节点数据更新
const handleUpdateNodes = (templateData) => {
  console.log("handleUpdateNodes 接收到的数据:", templateData);
  console.log("templateData.nodes:", templateData.nodes);
  console.log("templateData.relations:", templateData.relations);
  
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
  const padding = 80;

  // 处理节点数据
  const nodesToProcess = isQueryData ? templateData.nodes : templateData.nodeTemplates;
  const nodeCount = nodesToProcess.length;
  
  nodesToProcess.forEach((nodeOrTemplate, index) => {
    console.log(`处理第 ${index} 个节点，原始数据:`, nodeOrTemplate);
    // 计算节点位置
    let x, y;
    if (nodeCount === 1) {
      // 只有一个节点时放在画布上方中心
      x = containerWidth / 2.3;
      y = containerHeight / 3;
    } else {
      const centerX = containerWidth / 2.3;
      const centerY = containerHeight / 3;
      const semiMajorAxis = (containerWidth - 2 * padding * 2) / 2;
      const semiMinorAxis = (containerHeight - 2 * padding * 1.5) / 2;
      const angle = (2 * Math.PI * index) / nodeCount;
      const randomRadiusFactor = 0.5 + Math.random() * 0.5;
      x = centerX + semiMajorAxis * randomRadiusFactor * Math.cos(angle);
      y = centerY + semiMinorAxis * randomRadiusFactor * Math.sin(angle);
      const randomOffset = 60;
      x += (Math.random() - 0.5) * randomOffset;
      y += (Math.random() - 0.5) * randomOffset;
    }

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
    console.log(`构建的第 ${index} 个新节点:`, newNode);

    if (isTemplateData && nodeOrTemplate.nodeTemplateName) {
      entityTypes.value.push(nodeOrTemplate.nodeTemplateName);
    }

    graphNodes.value.push(newNode);
  });

  // 处理关系数据
  const relationsToProcess = isQueryData ? templateData.relations : templateData.relationTemplates;
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

// 处理模式变化
const handleModeChange = (mode) => {
  currentMode.value = mode;
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

  // 清除之前的选中状态
  if (contentRef.value) {
    contentRef.value.clearNodeSelection();
    // contentRef.value.clearEdgesSelection();
  }

  // 兼容图谱构建模式（传入字符串）和本体设计模式（传入对象）
  if (typeof template === 'string') {
    // 图谱构建模式：传入的是实体模板名称
    // 设置 LeftTemplatePanel 组件中的选中状态
    if (sidebarRef.value && sidebarRef.value.setSelectedEntityType) {
      sidebarRef.value.setSelectedEntityType(template);
      console.log("设置实体类型选中状态:", template);
    }

    // 高亮画布中所有对应类型的节点（使用名称匹配）
    if (contentRef.value && contentRef.value.graphContainerRef) {
      const graph = contentRef.value.graphContainerRef.graph;
      if (graph) {
        const nodes = graph.getData().nodes || [];
        nodes.forEach((node) => {
          if (node.data && node.data.name === template) {
            graph.setElementState(node.id, ["selected"]);
          }
        });
      }
    }

    // 打开属性面板，设置当前操作类型为实体
    currentOperation.value = "entity";
    entityName.value = template;

    // 从nodeTemplates中查找对应的实体模板信息
    const entityTemplate = nodeTemplates.value.find(
      (t) => t.nodeTemplateName === template,
    );
    if (entityTemplate) {
      console.log("找到实体模板:", entityTemplate);
      // 设置实体描述（如果有）
      entityDescription.value = entityTemplate.nodeTemplateDescription || entityTemplate.description || "";
      // 设置实体属性
      if (entityTemplate.properties && Array.isArray(entityTemplate.properties)) {
        entityProperties.value = entityTemplate.properties.map((prop) => ({
          name: prop.propertyKey,
          type: prop.propertyType.toLowerCase(),
          value: "",
        }));
      } else {
        entityProperties.value = [];
      }
      // 设置背景颜色
      backgroundColor.value = entityTemplate.nodeTemplateColor || entityTemplate.backgroundColor || "#43D7B5";
      // 设置是否加入组件库
      addToComponentLibrary.value = entityTemplate.isLibraryFlag === "1";
      // 设置当前节点的模板ID
      currentNodeTemplateId.value = entityTemplate.nodeTemplateId || 0;
      currentRelationTemplateId.value = 0;
    } else {
      console.log("未找到实体模板:", template);
      // 如果找不到模板信息，重置默认值
      entityDescription.value = "";
      entityProperties.value = [];
      backgroundColor.value = "#43D7B5";
      addToComponentLibrary.value = false;
      currentNodeTemplateId.value = 0;
      currentRelationTemplateId.value = 0;
    }
  } else {
    // 本体设计模式：传入的是实体模板对象，使用ID进行高亮
    // 设置 LeftTemplatePanel 组件中的选中状态
    if (sidebarRef.value && sidebarRef.value.setSelectedEntityType) {
      sidebarRef.value.setSelectedEntityType(template.nodeTemplateId);
      console.log("设置实体类型选中状态:", template.nodeTemplateId);
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

  // 清除之前的选中状态
  if (contentRef.value) {
    // contentRef.value.clearNodeSelection();
    contentRef.value.clearEdgesSelection();
  }

  // 兼容图谱构建模式（传入字符串）和本体设计模式（传入对象）
  if (typeof template === 'string') {
    // 图谱构建模式：传入的是关系模板名称
    // 设置 LeftTemplatePanel 组件中的选中状态
    if (sidebarRef.value && sidebarRef.value.setSelectedRelationshipType) {
      sidebarRef.value.setSelectedRelationshipType(template);
      console.log("设置关系类型选中状态:", template);
    }

    // 高亮画布中所有对应类型的连线（使用名称匹配）
    if (contentRef.value && contentRef.value.graphContainerRef) {
      const graph = contentRef.value.graphContainerRef.graph;
      if (graph) {
        const edges = graph.getData().edges || [];
        edges.forEach((edge) => {
          if (edge.data && edge.data.name === template) {
            graph.setElementState(edge.id, ["selected"]);
          }
        });
      }
    }

    // 打开属性面板，设置当前操作类型为关系
    currentOperation.value = "relationship";
    relationshipName.value = template;

    // 从relationTemplates中查找对应的关系模板信息
    const relationshipTemplate = relationTemplates.value.find(
      (t) => t.relationTemplateName === template,
    );
    if (relationshipTemplate) {
      // 存储当前选中的关系模板
      selectedRelationshipTemplate.value = relationshipTemplate;
      // 标记已点击了关系模板
      hasClickedRelationshipTemplate.value = true;
      
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
      currentNodeTemplateId.value = 0;

      // 设置开始和结束节点名称
      const startNode = nodeTemplates.value.find(
        (node) =>
          String(node.nodeTemplateId) === String(relationshipTemplate.startNodeTemplateId),
      );
      const endNode = nodeTemplates.value.find(
        (node) =>
          String(node.nodeTemplateId) === String(relationshipTemplate.endNodeTemplateId),
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
  } else {
    // 本体设计模式：传入的是关系模板对象，使用ID进行高亮
    // 设置 LeftTemplatePanel 组件中的选中状态
    if (sidebarRef.value && sidebarRef.value.setSelectedRelationshipType) {
      sidebarRef.value.setSelectedRelationshipType(template.relationTemplateId);
      console.log("设置关系类型选中状态:", template.relationTemplateId);
    }

    // 高亮画布中所有使用此模板创建的连线（通过 relationTemplateId 匹配）
    if (contentRef.value && contentRef.value.graphContainerRef) {
      const graph = contentRef.value.graphContainerRef.graph;
      if (graph) {
        const edges = graph.getData().edges || [];
        console.log("点击关系模板，模板ID:", template.relationTemplateId, "画布边数:", edges.length);
        edges.forEach((edge) => {
          console.log("比较边:", edge.id, "relationTemplateId:", edge.relationTemplateId, "模板ID:", template.relationTemplateId);
          if (String(edge.relationTemplateId) === String(template.relationTemplateId)) {
            console.log("高亮边:", edge.id);
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
  if (contentRef.value) {
    contentRef.value.clearNodeSelection();
    contentRef.value.clearEdgesSelection();
  }

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

// 处理清除选中状态
const handleClearSelections = () => {
  // 这里不需要做任何操作，因为 LeftTemplatePanel 组件会处理清除选中状态的逻辑
  console.log("清除模型列表选中状态");
};

// 处理更新组件库
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

// 处理添加组件到模型
const handleAddComponentToModel = async (component) => {
  console.log("添加组件到模型:", component);
  // 检查实体类型中是否已存在该组件名称
  if (component.nodeTemplateId) {
    // 实体组件
    if (!entityTypes.value.includes(component.nodeTemplateName)) {
      // 添加到实体类型中
      entityTypes.value.push(component.nodeTemplateName);
    }
  } else if (component.relationTemplateId) {
    // 关系组件
    if (!relationshipTypes.value.includes(component.relationTemplateName)) {
      // 添加到关系类型中
      relationshipTypes.value.push(component.relationTemplateName);
    }
  }
};

// 处理组件库搜索
const handleComponentLibrarySearch = async (keyword) => {
  try {
    const response = await projectService.searchComponentLibrary(keyword, currentSubDomainId.value);
    if (response && response.data) {
      components.value = response.data;
    } else {
      components.value = [];
    }
  } catch (error) {
    console.error("搜索组件库失败:", error);
    components.value = [];
  }
};

// 设置选中节点
const setSelectedNode = (node) => {
  selectedNodeId.value = node.id;
  // 可以在这里添加其他选中节点的处理逻辑
};

// 编辑器中拖放实体类型添加节点：只写入 editorNodes，按模板颜色渲染
const handleEditorAddEntity = (payload: {
  position: { x: number; y: number };
  template: NodeTemplate;
}) => {
  const position = payload.position;
  addNodePosition.value = position;
  const templateColor = payload.template?.color ?? "#43D7B5";
  // 创建临时节点（使用 backgroundColor 供 EditorContainer 按模板颜色渲染）
  const tempNode = {
    id: "virtualNode",
    name: " ",
    type: "virtual",
    nodeTemplateId: payload.template?.id,
    x: position.x,
    y: position.y,
    backgroundColor: templateColor,
    properties: [] as NodeProperty[],
  };
  editorNodes.value.push(tempNode);
  // 选中该节点并打开右侧属性面板，GraphEditor 会根据 nodeTemplateId 拉取模板属性
  nextTick(() => {
    graphEditorRef.value?.setSelectedNode?.(tempNode);
  });
};

// AddNodeDialog 点击确定：用正式节点替换临时节点，并弹出属性弹窗（保留模板颜色）
const handleAddNodeConfirm = (payload: {
  id: string;
  name: string;
  type: string;
  position?: { x: number; y: number };
}) => {
  const pos = payload.position ?? addNodePosition.value;
  const newNodeId = Date.now();
  const virtualNode = editorNodes.value.find(
    (n) => String(n.id) === "virtualNode",
  );
  const backgroundColor =
    (virtualNode && "backgroundColor" in virtualNode
      ? virtualNode.backgroundColor
      : undefined) ?? "#43D7B5";
  const newNode = {
    id: newNodeId,
    name: payload.name?.trim(),
    type: payload.type,
    nodeTemplateId: payload.id,
    x: pos.x,
    y: pos.y,
    backgroundColor,
    properties: [] as NodeProperty[],
    nodeTemplateName: payload.name?.trim(),
    nodeName: payload.name?.trim(),
    nodeId: "", // 后端生成
    nodeHash: "", // 后端生成
  };
  editorNodes.value = editorNodes.value.map((n) =>
    String(n.id) === "virtualNode" ? newNode : n,
  );
  nodeForPropertyDialog.value = { ...newNode };

  // 选中新节点，右侧属性面板会显示该节点信息并拉取模板属性
  nextTick(() => {
    graphEditorRef.value?.setSelectedNode?.(newNode);
  });
};

const handleNodePropertyCancel = () => {
  nodeForPropertyDialog.value = null;
};

// 编辑器中节点拖拽结束：只更新 editorNodes 中的位置
const handleEditorNodeDragEnd = (data: {
  nodeId: string | number;
  position: { x: number; y: number };
  data?: unknown;
}) => {
  const nodeId = data.nodeId;
  const position = data.position;
  for (let i = 0; i < editorNodes.value.length; i++) {
    const node = editorNodes.value[i];
    if (String(node.id) === String(nodeId)) {
      editorNodes.value[i] = { ...node, x: position.x, y: position.y };
      break;
    }
  }
};

// 右侧属性面板更新节点：同步到 editorNodes
const handleEditorUpdateNode = (payload: {
  id: string | number;
  name?: string;
  properties?: unknown;
}) => {
  const id = payload.id;
  for (let i = 0; i < editorNodes.value.length; i++) {
    if (String(editorNodes.value[i].id) === String(id)) {
      editorNodes.value[i] = { ...editorNodes.value[i], ...payload };
      break;
    }
  }
};

// 右侧属性面板更新边：同步到 editorEdges
const handleEditorUpdateEdge = (payload: {
  source: string | number;
  target: string | number;
  data?: unknown;
  id?: string | number;
}) => {
  const edges = editorEdges.value;
  const match = (e: {
    source: string | number;
    target: string | number;
    id?: string | number;
  }) =>
    (String(e.source) === String(payload.source) &&
      String(e.target) === String(payload.target)) ||
    (payload.id != null && String(e.id) === String(payload.id));
  for (let i = 0; i < edges.length; i++) {
    if (match(edges[i])) {
      editorEdges.value[i] = { ...edges[i], ...payload };
      break;
    }
  }
};

// GraphEditor 顶部工具条 - 退出
// 这里只负责关闭编辑器，不把编辑中的节点/边写回 GraphViewer
const handleEditorQuit = () => {
  showEditor.value = false;
  // 可选：清空编辑器内部数据，避免下次残留
  editorNodes.value = [];
  editorEdges.value = [];
  // 清空选中的序列和PDF选择标记，避免下次打开编辑器时显示旧的参考文本
  currentSelectedSequence.value = null;
  pdfSelectionMark.value = null;
  hanleRefresh();
};

const openGraphEditor = async() => {
  //  const currentTopicObj = topics.value.find((topic) => topic.id === topicId);
  if( currentLevel.value == 2){
    await fetchEntityAndRelationTypes(currentSubDomainId.value);
  }
  showEditor.value = !showEditor.value;
  if (showEditor.value) {
    editorNodes.value = JSON.parse(JSON.stringify(graphNodes.value));
    editorEdges.value = JSON.parse(JSON.stringify(graphEdges.value));
    // 重置 currentSequenceId，因为这是通过编辑按钮打开的，不是通过点击段落打开的
    currentSequenceId.value = "";
    // 如果有用户手动选择的内容，将其设置为 currentSelectedSequence
    if (pdfSelectionMark.value) {
      currentSelectedSequence.value = {
        sequenceId: `manual-${Date.now()}`,
        sequenceContent: pdfSelectionMark.value.content,
        sequencePositionList: pdfSelectionMark.value.rects.map(rect => ({
          sequenceX0: rect.x0,
          sequenceY0: rect.y0,
          sequenceX1: rect.x1,
          sequenceY1: rect.y1,
          sequencePage: rect.page
        }))
      };
    } else {
      // 否则清空 currentSelectedSequence
      currentSelectedSequence.value = null;
    }
  }
};

const handleRectangleClick = (payload) => {
  // 检查是否是黄色下划线（#ffff00）
  if (payload.color === "#ffff00") {
    // 打开 GraphEditor 弹窗
    showEditor.value = true;
    if (showEditor.value) {
      editorNodes.value = JSON.parse(JSON.stringify(graphNodes.value));
      editorEdges.value = JSON.parse(JSON.stringify(graphEdges.value));
      // 保存当前点击的 sequenceId
      currentSequenceId.value = payload.sequenceId;
      // 查找并保存当前选中的段落数据
      const sequence = sequenceListData.value.find(s => s.sequenceId === payload.sequenceId);
      currentSelectedSequence.value = sequence;
    }
  }
};

// 处理PDF加载完成事件
const handlePdfLoaded = (loaded) => {
  console.log('PDF加载完成:', loaded);
  pdfLoaded.value = loaded;
  // PDF加载完成后，设置hasData为true，显示图谱
  if (loaded) {
    hasData.value = true;
  }
};

const hanleRefresh = () => {
  textRef.value?.clearEditing();
  // 只清除手动选择的蓝线（MarkType.editing），保留从接口返回的黄色下划线标记
  textStore.setMarkList(textStore.markList.filter(mark => mark.type !== 1));
  // 清空PDF选择标记，确保点击编辑按钮时不会显示旧的参考文本
  pdfSelectionMark.value = null;
  showEditor.value = false;
};

// 处理编辑器提交
const handleEditorSubmit = async () => {
  console.log('编辑器提交，重新获取图谱数据和段落列表');
  
  // 根据当前层级决定调用哪个接口
  if (currentLevel.value === 2 && currentSubDomainId.value) {
    // 专题下(level=2)，调用getGraphByTopicId
    try {
      const graphResponse = await projectService.getGraphByTopicId(currentSubDomainId.value);

      // 更新图谱数据
      if (graphResponse && graphResponse.data) {
        // 转换节点数据格式，确保每个节点都有 id 字段
        const rawNodes = graphResponse.data.nodes || [];
        const rawEdges = graphResponse.data.relations || [];

        // 转换节点数据格式，统一使用 nodeHash 作为 id
        graphNodes.value = rawNodes.map(node => {
          const nodeHash = node.nodeHash || node.nodeId || node.id;
          // 转换属性格式
          const properties = (node.properties || []).map(prop => ({
            name: prop.propertyKey || prop.name,
            type: prop.propertyType || prop.type || 'string',
            value: prop.propertyValue || prop.value || '',
          }));

          return {
            id: nodeHash,
            nodeId: node.nodeId,
            nodeHash: nodeHash,
            name: node.nodeName || node.name,
            nodeName: node.nodeName,
            type: node.nodeType || node.type,
            nodeType: node.nodeType,
            description: node.nodeDescription || node.description,
            nodeDescription: node.nodeDescription,
            backgroundColor: node.nodeColor || node.backgroundColor || '#43D7B5',
            nodeColor: node.nodeColor,
            properties: properties,
            nodeTemplateId: node.nodeTemplateId,
            nodeTemplateName: node.nodeTemplateName,
          };
        });

        // 转换边数据格式，确保 source 和 target 对应节点的 id（nodeHash）
        graphEdges.value = rawEdges.map(edge => {
          // 获取边的源和目标标识（使用 nodeHash）
          const sourceKey = edge.startNodeHash || edge.startNodeId || edge.source;
          const targetKey = edge.endNodeHash || edge.endNodeId || edge.target;

          // 直接使用 nodeHash 作为 source 和 target
          const sourceId = sourceKey;
          const targetId = targetKey;

          // 转换属性格式
          const edgeProperties = (edge.properties || []).map(prop => ({
            name: prop.propertyKey || prop.name,
            type: prop.propertyType || prop.type || 'string',
            value: prop.propertyValue || prop.value || '',
          }));

          return {
            id: String(edge.relationId || edge.id || edge.relationHash),
            relationId: edge.relationId,
            relationHash: edge.relationHash,
            source: String(sourceId),
            target: String(targetId),
            startNodeId: edge.startNodeId,
            endNodeId: edge.endNodeId,
            startNodeHash: edge.startNodeHash,
            endNodeHash: edge.endNodeHash,
            data: {
              name: edge.relationName || edge.name,
              type: edge.relationType || edge.type || '定向',
              properties: edgeProperties,
            },
            relationName: edge.relationName,
            relationType: edge.relationType,
            relationTemplateId: edge.relationTemplateId,
            relationTemplateName: edge.relationTemplateName,
          };
        });

        console.log('专题图谱数据更新成功');
      }
    } catch (error) {
      console.error('获取专题图谱数据失败:', error);
    }
  } else if (currentGraphId.value) {
    // 文章下，调用getGraphByArticleId和getSequenceList
    try {
      // 并行调用接口
      const [graphResponse, sequenceResponse] = await Promise.all([
        projectService.getGraphByArticleId(currentGraphId.value),
        projectService.getSequenceList(currentGraphId.value)
      ]);

      // 更新图谱数据
      if (graphResponse && graphResponse.data) {
        // 转换节点数据格式，确保每个节点都有 id 字段
        const rawNodes = graphResponse.data.nodes || [];
        const rawEdges = graphResponse.data.relations || [];

        // 转换节点数据格式，统一使用 nodeHash 作为 id
        graphNodes.value = rawNodes.map(node => {
          const nodeHash = node.nodeHash || node.nodeId || node.id;
          // 转换属性格式
          const properties = (node.properties || []).map(prop => ({
            name: prop.propertyKey || prop.name,
            type: prop.propertyType || prop.type || 'string',
            value: prop.propertyValue || prop.value || '',
          }));

          return {
            id: nodeHash,
            nodeId: node.nodeId,
            nodeHash: nodeHash,
            name: node.nodeName || node.name,
            nodeName: node.nodeName,
            type: node.nodeType || node.type,
            nodeType: node.nodeType,
            description: node.nodeDescription || node.description,
            nodeDescription: node.nodeDescription,
            backgroundColor: node.nodeColor || node.backgroundColor || '#43D7B5',
            nodeColor: node.nodeColor,
            properties: properties,
            nodeTemplateId: node.nodeTemplateId,
            nodeTemplateName: node.nodeTemplateName,
          };
        });

        // 转换边数据格式，确保 source 和 target 对应节点的 id（nodeHash）
        graphEdges.value = rawEdges.map(edge => {
          // 获取边的源和目标标识（使用 nodeHash）
          const sourceKey = edge.startNodeHash || edge.startNodeId || edge.source;
          const targetKey = edge.endNodeHash || edge.endNodeId || edge.target;

          // 直接使用 nodeHash 作为 source 和 target
          const sourceId = sourceKey;
          const targetId = targetKey;

          // 转换属性格式
          const edgeProperties = (edge.properties || []).map(prop => ({
            name: prop.propertyKey || prop.name,
            type: prop.propertyType || prop.type || 'string',
            value: prop.propertyValue || prop.value || '',
          }));

          return {
            id: String(edge.relationId || edge.id || edge.relationHash),
            relationId: edge.relationId,
            relationHash: edge.relationHash,
            source: String(sourceId),
            target: String(targetId),
            startNodeId: edge.startNodeId,
            endNodeId: edge.endNodeId,
            startNodeHash: edge.startNodeHash,
            endNodeHash: edge.endNodeHash,
            data: {
              name: edge.relationName || edge.name,
              type: edge.relationType || edge.type || '定向',
              properties: edgeProperties,
            },
            relationName: edge.relationName,
            relationType: edge.relationType,
            relationTemplateId: edge.relationTemplateId,
            relationTemplateName: edge.relationTemplateName,
          };
        });
        
        console.log('图谱数据更新成功');
      }
      
      // 更新段落列表数据
      if (sequenceResponse && sequenceResponse.resultCode === "0000" && sequenceResponse.data) {
        sequenceListData.value = sequenceResponse.data;
        console.log('段落列表数据更新成功');
        
        // 重新绘制黄色下划线
        if (textRef.value && sequenceListData.value.length > 0) {
          // 先清除之前的标记
          textRef.value.clearMark();
          // 清除textStore中的标记列表，确保样式计算的准确性
          textStore.setMarkList([]);
          
          // 计算段落之间的重叠关系
          const sequenceRelations = [];
          
          // 分析每个段落的位置范围
          sequenceListData.value.forEach((sequence, index) => {
            if (sequence.sequencePositionList && sequence.sequencePositionList.length > 0) {
              const firstPos = sequence.sequencePositionList[0];
              const lastPos = sequence.sequencePositionList[sequence.sequencePositionList.length - 1];
              sequenceRelations.push({
                sequenceId: sequence.sequenceId,
                content: sequence.sequenceContent,
                startX: firstPos.sequenceX0,
                startY: firstPos.sequenceY0,
                endX: lastPos.sequenceX1,
                endY: lastPos.sequenceY1,
                length: sequence.sequenceContent.length,
                page: firstPos.sequencePage,
                sequencePositionList: sequence.sequencePositionList
              });
            }
          });
          
          // 重新绘制黄色下划线
          sequenceListData.value.forEach(sequence => {
            if (sequence.sequencePositionList && sequence.sequencePositionList.length > 0) {
              let style = "solid"; // 默认样式
              
              // 检查是否与其他段落重叠
            const currentSeq = sequenceRelations.find(s => s.sequenceId === sequence.sequenceId);
            if (currentSeq) {
              const overlappingSequences = sequenceRelations.filter(s => {
                if (s.sequenceId === sequence.sequenceId) return false;
                // 检查是否在同一页
                if (currentSeq.page !== s.page) return false;
                // 简单的重叠检测：检查Y坐标范围是否重叠
                return !(s.endY < currentSeq.startY || s.startY > currentSeq.endY);
              });
              
              if (overlappingSequences.length > 0) {
                // 有重叠，根据内容长度确定样式
                const isLonger = overlappingSequences.every(s => currentSeq.length > s.length);
                style = isLonger ? "double" : "dashed";
              }
            }
              
              const mark = {
                id: `sequence-${sequence.sequenceId}`,
                content: sequence.sequenceContent || "",
                rects: sequence.sequencePositionList.map(pos => ({
                  x0: pos.sequenceX0,
                  y0: pos.sequenceY0,
                  x1: pos.sequenceX1,
                  y1: pos.sequenceY1,
                  width: pos.sequenceX1 - pos.sequenceX0,
                  height: pos.sequenceY1 - pos.sequenceY0,
                  page: pos.sequencePage
                })),
                type: 0, // MarkType.submitted
                articleId: currentGraphId.value,
                color: "#ffff00", // 黄色
                sequenceId: sequence.sequenceId,
                style: style // 添加样式信息
              };
              // 将标记添加到 textStore 中，确保手动选中文本时不会消失
              if (!textStore.markList.some(m => m.id === mark.id)) {
                textStore.addMark(mark);
              } else {
                // 如果标记已存在，更新它的样式
                const existingMark = textStore.markList.find(m => m.id === mark.id);
                if (existingMark) {
                  existingMark.style = style;
                  // 保存更新后的标记列表
                  textStore.setMarkList([...textStore.markList]);
                }
              }
              textRef.value.drawMark(mark);
            }
          });
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  }
  // 关闭编辑器
  showEditor.value = false;
  // 清空选中的序列和PDF选择标记，避免下次打开编辑器时显示旧的参考文本
  currentSelectedSequence.value = null;
  pdfSelectionMark.value = null;
};
</script>

<style scoped lang="scss">
.project-builder-container {
  position: relative;
  display: flex;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - 72px);
}

.content-container {
  flex: 1;
  display: flex;
  height: 100%;
  overflow: hidden;
}

.project-card-list-container {
  position: absolute;
  top: 0;
  left: 280px;
  width: 165vh;
  height: 85vh;
}

.text-container {
  position: relative;
  height: 100%;
  top: 0;
  left: 0;
  flex: 1;
}

.graph-container {
  position: relative;
  display: flex;
  flex: 2;
  height: 100%;
  top: 0;
  left: 0;
}

.other-container {
//  flex: 1;
  // display: flex;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
}

.other-container :deep(.content-area) {
  // flex: 1;
  height: 100%;
  overflow: hidden;
}

.other-container :deep(.property-panel) {
  width: 280px;
  height: 100%;
  border-left: 1px solid #eaeaea;
  background-color: #f9f9f9;
  overflow-y: auto;
}
.tool {
  position: absolute;
  height: 55px;
}
</style>

<style lang="scss">
/* 页码提示字体颜色优化 */
.page-notify-message .el-message__content {
  color: #303133;
  font-weight: 500;
}
</style>

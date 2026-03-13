<template>
  <div class="project-builder-container">
    <!-- 左侧侧边栏 -->
    <Sidebar
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
      :is-loading-topics="isLoadingTopics"
      :is-loading-graphs="isLoadingGraphs"
      :has-data="hasData"
      :entity-types="entityTypes"
      :relationship-types="relationshipTypes"
      :relation-templates="relationTemplates"
      :current-mode="currentMode"
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
    />
    <!-- 新增/编辑弹窗textUrl -->
    <AddGraphDialog
      v-model:visible="showGraphDialog"
      :is-confirm-button-disabled="isConfirmButtonDisabled"
      :loading="isLoading"
      @create-graph="handleCreateGraph"
      @cancel="handleCancelCreateGraph"
    />
    <div v-if="currentGraphId&&textUrl" class="text-container">
      <Text
        ref="textRef"
        :src="textUrl"
        :page="currentPage"
        @selection-change="handlePdfSelectionChange"
        @rectangle-click="handleRectangleClick"
        @pdf-loaded="handlePdfLoaded"
      />
    </div>
    <div class="graph-container" v-if="currentMode === 'graph' && !currentGraphId && currentSubDomain">
      <GraphViewer2
        ref="graphViewer"
        :nodes="graphNodes"
        :edges="graphEdges"
        :article-id="currentGraphId"
        :topic-id="currentSubDomainId"
        :domain-id="currentDomainId"
        :level="currentLevel"
        :pdf-loaded="pdfLoaded"
      />
    </div>
    <div v-if="currentGraphId" class="graph-container">
      <GraphViewer
        ref="graphViewer"
        :nodes="graphNodes"
        :edges="graphEdges"
        :article-id="currentGraphId"
        :topic-id="currentSubDomainId"
        :domain-id="currentDomainId"
        :level="currentLevel"
        :pdf-loaded="pdfLoaded"
      />
      <!-- 除了文章外其他两种情况 -->
      <!-- <Content
       v-if="！textUrl"
          ref="contentRef"
          :current-sub-domain="currentSubDomain"
          :current-mode="currentMode"
          :has-data="hasData"
          :graph-nodes="graphNodes"
          :graph-edges="graphEdges"
          :entity-properties="entityProperties"
          @add-entity="handleAddEntity"
          :is-connecting="isConnecting"
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
        /> -->
      <TextTool
       v-if="currentGraphId&&textUrl"
        class="tool"
        @previous-page="hanlePreviousPage"
        @next-page="hanleNextPage"
        @jump-page="handleJumpPage"
        @refresh="hanleRefresh"
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
      :show-reference-text="!!currentSequenceId || !!pdfSelectionMark"
      @node-drag-end="handleEditorNodeDragEnd"
      @add-entity-from-template="handleEditorAddEntity"
      @update:node="handleEditorUpdateNode"
      @update:edge="handleEditorUpdateEdge"
      @quit="handleEditorQuit"
      @close-right="handleClosePropertyPanel"
      @submit="handleEditorSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { ElMessageBox } from "element-plus";
import { ElMessage as Message } from "element-plus";
import Sidebar from "@/components/common/Sidebar.vue";
import AddGraphDialog from "@/components/common/AddGraphDialog.vue";
import projectService from "@/services/graph.ts";
import Text from "@/components/article/Text.vue";
import { useConverter } from "@/mock/modules/converter.ts";
import { GraphConfig, type NodeProperty } from "@/configs/graph.js";
import TextTool from "@/components/article/TextTool.vue";
import { storeToRefs } from "pinia";
import { useTextStore } from "@/store/useTextStore";
import GraphViewer from "@/views/GraphBuilder/GraphViewer.vue";
import GraphViewer2 from "@/views/GraphBuilder/GraphViewer2.vue";
import GraphEditor from "@/views/GraphBuilder/GraphEditor.vue";
import type { Mark, Rect } from "@/configs/text";
import type { NodeTemplate } from "@/configs/graph.js";
import { template } from "lodash";

const textStore = useTextStore();
const contentRef = ref(null);
const textRef = ref<InstanceType<typeof Text> | null>(null);
const graphEditorRef = ref<InstanceType<typeof GraphEditor> | null>(null);
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
  };
};

const allOption = ref("全部");
const currentDomain = ref("");
const currentDomainId = ref("");
const currentSubDomain = ref("");
const currentSubDomainId = ref("");
const currentGraphId = ref("");
const currentGraphName = ref("");
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
const addToComponentLibrary = ref(true);
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

// 防止重复调用 fetchGraph 的标志
const isFetchingGraph = ref(false);

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
  currentGraphName.value = savedState.currentGraphName;
  subDomains.value = savedState.subDomains;
  subSubDomains.value = savedState.subSubDomains;
  hasData.value = savedState.hasData;
  // 不直接从localStorage加载graphs，避免显示旧数据
  graphs.value = [];
  graphNodes.value = savedState.graphNodes || [];
  currentLevel.value = savedState.currentLevel;

  // 如果当前有选中的专题，立即设置加载状态，确保一进来就显示加载中
  if (currentSubDomain.value) {
    isLoadingGraphs.value = true;
  }

  // 加载历史搜索记录
  loadSearchHistory();

  // 初始化搜索下拉框选项
  updateDomainSearchOptions();
  updateTopicSearchOptions();
  updateGraphSearchOptions();

  // 调用接口获取所有领域列表
  await fetchAllDomains();

  // 如果当前有选中的领域，获取对应的专题列表
  if (currentDomain.value) {
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
    );
    if (currentDomainObj) {
      await fetchTopics(currentDomainObj.id);

      // 如果当前有选中的专题，获取对应的图谱列表
      if (currentSubDomain.value) {
        const currentSubDomainObj = topics.value.find(
          (topic) => topic.name === currentSubDomain.value,
        );
        if (currentSubDomainObj) {
          console.log("onmounted",currentSubDomainObj.id)
          await fetchGraph(currentSubDomainObj.id);
          await fetchEntityAndRelationTypes(currentSubDomainObj.id);

          // 如果当前有选中的图谱，获取对应的文章URL
          if (currentGraphId.value) {
            const response = await projectService.getArticleUrl(
              currentGraphId.value,
            );
            textUrl.value = response.data;
            currentPage.value = 0;
            hasData.value = true;
            
            // 调用段落列表查询接口
            await getSequenceList(currentGraphId.value);
          }
        }
      }
    }
  }
});

// 获取所有领域列表
const fetchAllDomains = async () => {
  try {
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

const handleBackToDomains = () => {
  currentDomain.value = "";
  currentSubDomain.value = "";
  currentGraphId.value = "";
  currentGraphName.value = "";
  subDomains.value = [];
  subSubDomains.value = [];
  // 切换回领域页面，更新下拉框显示领域搜索历史
  updateDomainSearchOptions();
  saveState();
};

const handleBackToSubDomains = () => {
  // 保存当前子领域名称，用于显示数量
  const previousSubDomain = currentSubDomain.value;
  currentSubDomain.value = "";
  currentGraphId.value = "";
  currentGraphName.value = "";
  subSubDomains.value = [];
  // 可以在这里更新子领域的数量
  // 例如：subDomains中找到对应的子领域并更新其数量
  saveState();
};
const backToSubGraphList = () => {
  // 从图谱详情页面返回时，保持子领域名称不变，只清空图谱相关信息
  // 这样就会回到图谱列表页面，而不是专题列表页面
  currentGraphId.value = "";
  currentGraphName.value = "";
  subSubDomains.value = [];
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

  // 立即清空topics列表，避免显示上一个领域的专题数据
  topics.value = [];
  // 设置加载状态
  isLoadingTopics.value = true;

  // 调用接口获取专题列表
  await fetchTopics(domain.id);
  // 取消加载状态
  textUrl.value = "";
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
        const articleUrl = await projectService.getArticleUrl(graph.articleId);
        const newGraph: GraphConfig = {
          id: graph.articleId,
          name: graph.articleName,
          articleUrl: articleUrl,
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
  console.log("处理专题点击handleTopicClick",subDomain.id)
  await fetchGraph(subDomain.id);
  await fetchEntityAndRelationTypes(subDomain.id);
  textUrl.value = "";
  saveState();
};

// 获取实体和关系类型列表
const fetchEntityAndRelationTypes = async (topicId) => {
  try {
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
  }
};

const handleCreateRelationship = (sourceId) => {
  console.log("开始创建关系，源节点ID:", sourceId);
  // 重置关系相关属性
  relationshipName.value = "";
  relationshipType.value = "定向";
  entityDescription.value = "";
  entityProperties.value = [
    { name: "名字", type: "text", value: "" },
    { name: "日期", type: "date", value: "" },
    { name: "ID", type: "number", value: "" },
  ];
  addToComponentLibrary.value = true;

  currentOperation.value = "relationship";
  isConnecting.value = true;
  sourceNodeId.value = sourceId;
  console.log("进入连线模式");
};

const handleClosePropertyPanel = () => {
  // 关闭时清除编辑器中的临时节点（拖入未确认的 virtualNode）
  editorNodes.value = editorNodes.value.filter(
    (n) => String(n.id) !== "virtualNode",
  );

  // 关闭属性面板后，清除虚线
  //if (currentOperation.value === "relationship" && contentRef.value) {
  //  contentRef.value.resetConnectionState();
  //  console.log("关闭属性面板后，调用resetConnectionState方法清除虚线");
  //}
};

// 处理连接完成
const handleConnectionComplete = (targetId) => {
  console.log("连接完成，目标节点ID:", targetId);
  console.log("源节点ID:", sourceNodeId.value);

  // 存储目标节点ID
  targetNodeId.value = targetId;

  // 退出连线模式
  isConnecting.value = false;

  // 重置关系相关属性
  relationshipName.value = "";
  relationshipType.value = "定向";
  entityDescription.value = "";
  entityProperties.value = [
    { name: "名字", type: "text", value: "" },
    { name: "日期", type: "date", value: "" },
    { name: "ID", type: "number", value: "" },
  ];
  addToComponentLibrary.value = true;

  // 设置当前操作类型为关系
  currentOperation.value = "relationship";

  // 打开属性面板
  showPropertyPanel.value = true;
  console.log("打开关系属性面板");
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

  // 创建新的图谱节点
  const newNode = {
    id: Date.now(),
    type: type,
    name: item,
    x: x,
    y: y,
    // 添加属性信息
    properties: type === "entity" ? [...entityProperties.value] : [],
    nodeTemplateName: item,
    nodeName: item,
  };

  graphNodes.value.push(newNode);
  hasData.value = true;
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
    Message.warning("请输入图谱名称");
    return;
  }
  const state = loadState();
  if (!graphData.createMethod) {
    Message.warning("请选择创建方式");
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
      hasData.value = true; // 设置 hasData 为 true，显示关系图

      //跳转至新的url
      const textUrlResponse = await projectService.getArticleUrl(
        addGraphResponse.data,
      );
      textUrl.value = textUrlResponse.data;
console.log("重新获取图谱列表，确保数据同步:", state.currentSubDomainId);
      // 重新获取图谱列表，确保数据同步
      await fetchGraph(state.currentSubDomainId);
      
      // 关闭弹窗
      showGraphDialog.value = false;
    }
  } catch (error) {
    console.error("创建图谱失败:", error);
    Message.error("创建图谱失败，请稍后重试");
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
  currentLevel.value = 3;
  currentGraphId.value = graph.id;
  currentGraphName.value = graph.name;
  const response = await projectService.getArticleUrl(graph.id);
  textUrl.value = response.data;
  currentPage.value = 0;
  // 设置 hasData 为 true，显示关系图
  hasData.value = true;
  
  // 清除之前的标记，避免切换图谱时残留上一个图谱的黄色下划线
  textStore.setMarkList([]);
  if (textRef.value) {
    textRef.value.clearMark();
  }
  
  // 调用段落列表查询接口
  await getSequenceList(graph.id);
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
        sequenceListData.value.forEach(sequence => {
          if (sequence.sequencePositionList && sequence.sequencePositionList.length > 0) {
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
              sequenceId: sequence.sequenceId
            };
            // 将标记添加到 textStore 中，确保手动选中文本时不会消失
            if (!textStore.markList.some(m => m.id === mark.id)) {
              textStore.addMark(mark);
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
const handleDeleteGraph = (id) => {
  console.log("删除图谱:", id);
  // 从图谱列表中移除

  ElMessageBox.confirm("确定是否删除图谱吗", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then((result) => {
      projectService.deleteArticle(id).then((response) => {
        graphs.value = graphs.value.filter((graph) => graph.id !== id);
        console.log(response);
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

// 处理模式变化
const handleModeChange = (mode) => {
  currentMode.value = mode;
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

const openGraphEditor = () => {
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
};

const hanleRefresh = () => {
  textRef.value?.clearEditing();
  // 只清除手动选择的蓝线（MarkType.editing），保留从接口返回的黄色下划线标记
  textStore.setMarkList(textStore.markList.filter(mark => mark.type !== 1));
  showEditor.value = false;
};

// 处理编辑器提交
const handleEditorSubmit = async () => {
  console.log('编辑器提交，重新获取图谱数据和段落列表');
  // 重新获取图谱数据和段落列表
  if (currentGraphId.value) {
    try {
      // 并行调用接口
      const [graphResponse, sequenceResponse] = await Promise.all([
        projectService.getGraphByArticleId(currentGraphId.value),
        projectService.getSequenceList(currentGraphId.value)
      ]);
      
      // 更新图谱数据
      if (graphResponse && graphResponse.data) {
        graphNodes.value = graphResponse.data.nodes || [];
        graphEdges.value = graphResponse.data.relations || [];
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
          // 重新绘制黄色下划线
          sequenceListData.value.forEach(sequence => {
            if (sequence.sequencePositionList && sequence.sequencePositionList.length > 0) {
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
                sequenceId: sequence.sequenceId
              };
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
.project-card-list-container {
  position: absolute;
  top: 0;
  left: 280px;
  width: 165vh;
  height: 85vh;
}
.text-container {
  position: relative;
  width: 35%;
  height: 100%;
  top: 0;
  left: 0;
}

.graph-container {
  position: relative;
  display: flex;
  // width: 40%;
  flex: 1;
  height: 100%;
  top: 0;
  left: 0;
}
.tool {
  position: absolute;
  left: 4%;
  bottom: 3%;
  height: 70px;
}
</style>

<style lang="scss">
/* 页码提示字体颜色优化 */
.page-notify-message .el-message__content {
  color: #303133;
  font-weight: 500;
}
</style>

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
        :is-loading-topics="isLoadingTopics"
        :has-data="hasData"
        :entity-types="entityTypes"
        :relationship-types="relationshipTypes"
        :current-mode="currentMode"
        @delete-domain="handleDeleteDomain"
        @open-add-dialog="openAddDialog"
        @open-add-topic-dialog="openAddTopicDialog"
        @open-add-graph-dialog="openAddGraphDialog"
        @domain-click="handleDomainClick"
        @sub-domain-click="handleSubDomainClick"
        @back-to-domains="handleBackToDomains"
        @back-to-sub-domains="handleBackToSubDomains"
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
        @clear-domain-history="clearDomainSearchHistory"
        @clear-topic-history="clearTopicSearchHistory"
        @topic-click="handleTopicClick"
    />
    <!-- 新增/编辑弹窗 -->
    <AddGraphDialog
        v-model:visible="showGraphDialog"
        :is-confirm-button-disabled="isConfirmButtonDisabled"
        @create-graph="handleCreateGraph"
        @cancel="handleCancelCreateGraph"
    />
    <div class="text-container">
      <Text
        ref="textRef"
        :src="textUrl"
        :page="currentPage"
        @selection-change="handlePdfSelectionChange"
      />
    </div>
    <div class="graph-container">
      <GraphViewer
        ref="graphViewer"
        :nodes="graphNodes"
        :edges="graphEdges"
        :article-id="currentGraphId"
        :topic-id="currentSubDomainId"
        :domain-id="currentDomainId"
        :level="currentLevel"
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
    <GraphEditor
        v-if="showEditor"
        style="z-index: 9"
        :marks="markList"
        :nodes="editorNodes"
        :edges="editorEdges"
        @add-entity="handleEditorAddEntity"
        @node-drag-end="handleEditorNodeDragEnd"
        @quit="handleEditorQuit"
    />
    <AddNodeDialog
        v-model:visible="showAddNodeDialog"
        :position="addNodePosition"
        :node-types="nodeTypes"
        @add-node="handleAddNodeConfirm"
        @cancel="handleAddNodeCancel"
    />
    <AddNodePropertyDialog
        v-model:visible="showAddNodePropertyDialog"
        :node-name="nodeForPropertyDialog?.name"
        :initial-properties="nodeForPropertyDialog?.properties"
        @confirm="handleNodePropertyConfirm"
        @cancel="handleAddNodeCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { ElMessage as Message } from "element-plus";
import Sidebar from "@/components/common/Sidebar.vue";
import AddGraphDialog from "@/components/common/AddGraphDialog.vue";
import AddNodeDialog from "@/components/common/AddNodeDialog.vue";
import AddNodePropertyDialog from "@/components/common/AddNodePropertyDialog.vue";
import projectService from "@/services/graph.ts"
import Text from "@/components/article/Text.vue";
import {useConverter} from "@/mock/modules/converter.ts";
import {GraphConfig} from "@/configs/graph.js";
import TextTool from "@/components/article/TextTool.vue";
import {storeToRefs} from "pinia";
import {useTextStore} from "@/store/useTextStore";
import GraphViewer from "@/views/GraphBuilder/GraphViewer.vue";
import GraphEditor from "@/views/GraphBuilder/GraphEditor.vue";
import type { Mark, Rect } from "@/configs/text"

const textStore = useTextStore();
const contentRef = ref(null);
const textRef = ref<InstanceType<typeof Text> | null>(null);
const {currentPage, markList} = storeToRefs(textStore)
const textUrl = ref("");
const nodeTypes = ref([])
const {graphTypeString2Integer} = useConverter()
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
const entityProperties = ref([
  { name: "名字", type: "text", value: "" },
  { name: "日期", type: "date", value: "" },
  { name: "ID", type: "number", value: "" },
]);
const addToComponentLibrary = ref(true);
const hasData = ref(false);
const savedEntitiesCount = ref(0);
const entityTypes = ref([]);
const relationshipTypes = ref([]);
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
//当前目录层级
const currentLevel= ref(0);
//文本信息
const showAddNodeDialog = ref(false);
const addNodePosition = ref({ x: 0, y: 0 });
const showAddNodePropertyDialog = ref(false);
/** 当前在配置属性的节点（AddNodeDialog 确定后创建，用于属性弹窗回写） */
const nodeForPropertyDialog = ref(null);

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
  showAddGraphDialog.value = true
}

// 监听状态变化，自动保存
watch(
    [
      currentDomain,
      currentSubDomain,
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
  graphs.value = savedState.graphs;
  graphNodes.value = savedState.graphNodes || [];
  currentLevel.value = savedState.currentLevel;

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

  if (currentDomain.value) {
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

  if (currentDomain.value) {
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

// 图谱搜索处理
const handleGraphSearch = (query) => {
  // 这里可以添加实时搜索逻辑
  // 例如过滤图谱列表
  if (query) {
    // 过滤图谱列表
    const filteredGraphs = graphs.value.filter((graph) =>
        graph.name.toLowerCase().includes(query.toLowerCase()),
    );
    // 这里可以更新显示的图谱列表
  }
};

// 图谱搜索图标点击事件
const handleGraphSearchIconClick = async (query) => {
  if (query) {
    // 添加图谱搜索历史
    addGraphSearchHistory(query);
    // 过滤图谱列表
    const filteredGraphs = graphs.value.filter((graph) =>
        graph.name.toLowerCase().includes(query.toLowerCase()),
    );
    // 这里可以更新显示的图谱列表
  }
  // 更新图谱搜索下拉框选项
  updateGraphSearchOptions();
};

const handleBackToDomains = () => {
  currentDomain.value = "";
  currentSubDomain.value = "";
  subDomains.value = [];
  subSubDomains.value = [];
  // 切换回领域页面，更新下拉框显示领域搜索历史
  updateDomainSearchOptions();
};

const handleBackToSubDomains = () => {
  // 保存当前子领域名称，用于显示数量
  const previousSubDomain = currentSubDomain.value;
  currentSubDomain.value = "";
  subSubDomains.value = [];
  // 可以在这里更新子领域的数量
  // 例如：subDomains中找到对应的子领域并更新其数量
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
  saveState()

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
  try {
    const currentTopicObj = topics.value.find(
        (domain) => domain.id === currentSubDomainId.value,
    );
    if (!currentTopicObj) return;

    const response = await projectService.getGraphList(
        currentTopicObj.id,
    );

    if (response && response.data) {
      graphs.value = []
      for(const graph of response.data) {
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
        }
        graphs.value.push(newGraph);
      }

      //graphs.value = response.data.map((item) => ({
      //  id: item.articleId,
      //  name: item.articleName,
      //  topicId: item.topicId,
      //}));
    } else {
      graphs.value = [];
    }
  } catch (error) {
    console.error("获取专题列表失败:", error);
    graphs.value = [];
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
  await fetchGraph(subDomain.id);
  textUrl.value = "";
  saveState();
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
  showPropertyPanel.value = false;

  // 关闭属性面板后，清除虚线
  if (currentOperation.value === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("关闭属性面板后，调用resetConnectionState方法清除虚线");
  }
};

const handleCancelPropertyPanel = () => {
  showPropertyPanel.value = false;

  // 取消属性面板后，清除虚线
  if (currentOperation.value === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("取消属性面板后，调用resetConnectionState方法清除虚线");
  }
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
  };

  graphNodes.value.push(newNode);
  hasData.value = true;
};

// 点击取消时移除编辑器内的临时节点（id 为 virtualNode）
const handleAddNodeCancel = () => {
  editorNodes.value = editorNodes.value.filter((n) => String(n.id) !== "virtualNode");
}

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

// 处理创建图谱
const handleCreateGraph = async (graphData) => {
  if (!graphData.graphName) {
    Message.warning("请输入图谱名称");
    return;
  }
  const state = loadState()
  if (!graphData.createMethod) {
    Message.warning("请选择创建方式");
    return;
  }

  isConfirmButtonDisabled.value = true;

  // 构造图谱数据
  const graphDataToSend = {
    articleName: graphData.graphName,
    createMethod: graphTypeString2Integer(graphData.createMethod).toString(),
    topicId: state.currentSubDomainId,
    uploadedFile: graphData.createMethod === "text" ? graphData.uploadedFile : null,
    databaseName: graphData.createMethod === "database" ? graphData.databaseName : "",
    anyContent: graphData.createMethod === "any" ? graphData.anyContent : "",
  };

  // 这里可以处理图谱创建的逻辑，例如保存图谱数据到后端
  console.log("创建图谱:", graphDataToSend);

  // 模拟创建成功
  const addGraphResponse = await projectService.addArticle(graphDataToSend)
  if(addGraphResponse.code === 200) {

    hasData.value = true; // 设置 hasData 为 true，显示关系图

    //跳转至新的url
    const textUrlResponse = await projectService.getArticleUrl(addGraphResponse.data);
    textUrl.value = textUrlResponse.data;

    const newGraph: GraphConfig = {
      id: addGraphResponse.data,
      name: graphData.graphName,
      articleUrl: textUrl.value,
      articleName: graphData.uploadedFile.name,
      topicId: state.currentSubDomainId,
      topicName: state.currentSubDomain,
      domainId: state.currentDomainId,
      domainName: state.currentDomain,
      createMethod: graphData.createMethod,
      createdAt: new Date().toISOString(),
    };
    graphs.value.push(newGraph);
  }
  isConfirmButtonDisabled.value = false;
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
  graphs.value = graphs.value.filter((graph) => graph.id !== id);
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

// 编辑器中右键添加节点：只写入 editorNodes，不写入 graphNodes（不传给 GraphViewer）
const handleEditorAddEntity = async (position: { x: number; y: number }) => {
  addNodePosition.value = position;
  // 创建临时节点
  const tempNode = {
    id: "virtualNode",
    name: " ",
    type: "virtual",
    x: position.x,
    y: position.y,
    properties: [],
  };
  //const response = await projectService.getNodeTypes(currentSubDomainId.value)
  //if(response && response.data)
  //{
  //  response.data.forEach((nodeType) => {
  //    console.log(nodeType);
  //  })
  //}

  editorNodes.value.push(tempNode);
  //打开添加节点对话框
  showAddNodeDialog.value = true;
};

// AddNodeDialog 点击确定：用正式节点替换临时节点，并弹出属性弹窗
const handleAddNodeConfirm = (payload: { name: string; type: string | null; position?: { x: number; y: number } }) => {
  const pos = payload.position ?? addNodePosition.value;
  const newNodeId = Date.now();
  //const defaultProperties = [{ name: "名字", type: "string" }, { name: "日期", type: "date" }];
  const newNode = {
    id: newNodeId,
    name: payload.name?.trim(),
    type: payload.type ,
    x: pos.x,
    y: pos.y,
    //properties: defaultProperties,
  };
  editorNodes.value = editorNodes.value.map((n) =>
    String(n.id) === "virtualNode" ? newNode : n
  );
  nodeForPropertyDialog.value = { ...newNode };
  showAddNodePropertyDialog.value = true;
};

// AddNodePropertyDialog 确定：把配置的属性写回对应节点
const handleNodePropertyConfirm = (properties: { name: string; type: string }[]) => {
  const id = nodeForPropertyDialog.value?.id;
  if (id == null) return;
  const list = editorNodes.value;
  for (let i = 0; i < list.length; i++) {
    if (String(list[i].id) === String(id)) {
      editorNodes.value[i] = { ...list[i], properties: properties?.length ? properties : list[i].properties };
      break;
    }
  }
  nodeForPropertyDialog.value = null;
};

const handleNodePropertyCancel = () => {
  nodeForPropertyDialog.value = null;
};

// 编辑器中节点拖拽结束：只更新 editorNodes 中的位置
const handleEditorNodeDragEnd = (data: { nodeId: string | number; position: { x: number; y: number }; data?: unknown }) => {
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

// GraphEditor 顶部工具条 - 退出
// 这里只负责关闭编辑器，不把编辑中的节点/边写回 GraphViewer
const handleEditorQuit = () => {
  showEditor.value = false;
  // 可选：清空编辑器内部数据，避免下次残留
  editorNodes.value = [];
  editorEdges.value = [];
  hanleRefresh();
};

const openGraphEditor = () => {
  showEditor.value = !showEditor.value;
  if (showEditor.value) {
    editorNodes.value = JSON.parse(JSON.stringify(graphNodes.value));
    editorEdges.value = JSON.parse(JSON.stringify(graphEdges.value));
  }
}

const hanleRefresh = () => {
  textRef.value?.clearEditing()
  textStore.clearMarkList()
  showEditor.value = false;
}
</script>

<style scoped lang="scss">
.project-builder-container {
  position: relative;
  display: flex;
  top: 0;
  left: 0;
  width: 100%;
  height: 90vh;
}
.project-card-list-container{
  position: absolute;
  top: 0;
  left: 280px;
  width: 165vh;
  height: 85vh;
}
.text-container{
  position: relative;
  width: 35%;
  height: 100%;
  top: 0;
  left: 0;
}

.graph-container{
  position: relative;
  display: flex;
  width: 40%;
  height: 100%;
  top: 0;
  left: 0;
}
.tool{
  position: absolute;
  left: 25%;
  bottom: 5%;
  height: 45px;
}
</style>

<style lang="scss">
/* 页码提示字体颜色优化 */
.page-notify-message .el-message__content {
  color: #303133;
  font-weight: 500;
}
</style>
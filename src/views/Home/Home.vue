<script setup>
import { ref, onMounted, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
// import { ElMessage as Message } from "element-plus";
import { ElMessage } from "element-plus";
import Header from "@/components/common/Header.vue";
import Sidebar from "@/components/common/Sidebar.vue";
import Content from "@/components/common/Content.vue";
import PropertyPanel from "@/components/common/PropertyPanel.vue";
import AddDomainDialog from "@/components/common/AddDomainDialog.vue";
import AddGraphDialog from "@/components/common/AddGraphDialog.vue";
import projectService from "@/services/graph.ts";

const contentRef = ref(null);
const sidebarRef = ref(null);

// 从localStorage读取状态，或使用默认值
const loadState = () => {
  const savedState = localStorage.getItem("homePageState");
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
const entityDescription = ref("");
// const entityProperties = ref([
//   { name: "名字", type: "string", value: "" },
//   { name: "日期", type: "date", value: "" },
//   { name: "ID", type: "number", value: "" },
// ]);
const entityProperties = ref([]);
const addToComponentLibrary = ref(true);
const hasData = ref(false);
const savedEntitiesCount = ref(0);
const entityTypes = ref([]);
const relationshipTypes = ref([]);
const relationTemplates = ref([]);
const backgroundColor = ref("#43D7B5");
// 当前操作类型：'entity' 或 'relationship'
const currentOperation = ref("");
// 关系名称
const relationshipName = ref("");
// 关系类型
const relationshipType = ref("定向");
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
  localStorage.setItem("homePageState", JSON.stringify(state));
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

// 组件挂载时加载状态
onMounted(async () => {
  const savedState = loadState();
  currentDomain.value = savedState.currentDomain;
  currentSubDomain.value = savedState.currentSubDomain;
  currentTopicId.value = savedState.currentTopicId || "";
  subDomains.value = savedState.subDomains;
  subSubDomains.value = savedState.subSubDomains;
  hasData.value = savedState.hasData;
  graphs.value = savedState.graphs;
  graphNodes.value = savedState.graphNodes || [];
  graphEdges.value = savedState.graphEdges || [];

  // 如果当前有选中的专题，立即设置加载状态，避免显示空状态
  if (currentTopicId.value) {
    isLoadingTemplates.value = true;
    isLoadingComponents.value = true;
  }

  // 如果当前有选中的领域，立即设置专题加载状态，避免显示空状态
  if (currentDomain.value) {
    isLoadingTopics.value = true;
  }

  // 立即设置领域加载状态，避免显示空状态
  isLoadingDomains.value = true;

  // 加载历史搜索记录
  loadSearchHistory();

  // 初始化搜索下拉框选项
  updateDomainSearchOptions();
  updateTopicSearchOptions();
  updateGraphSearchOptions();

  // 调用接口获取所有领域列表
  try {
    await fetchAllDomains();
  } finally {
    isLoadingDomains.value = false;
  }

  // 如果当前有选中的领域，获取对应的专题列表
  if (currentDomain.value) {
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
    );
    if (currentDomainObj) {
      try {
        await fetchTopics(currentDomainObj.id);
      } finally {
        isLoadingTopics.value = false;
      }

      // 如果当前有选中的专题，同时获取模板数据和组件库数据
      if (currentTopicId.value) {
        try {
          // 并行执行模板数据查询和组件库查询
          await Promise.all([
            (async () => {
              const response = await projectService.queryTemplate(
                currentTopicId.value,
              );
              if (response && response.data) {
                // 清空现有数据
                entityTypes.value = [];
                relationshipTypes.value = [];

                // 处理节点模板
                if (
                  response.data.nodeTemplates &&
                  Array.isArray(response.data.nodeTemplates)
                ) {
                  response.data.nodeTemplates.forEach((template) => {
                    if (
                      template.nodeTemplateName &&
                      !entityTypes.value.includes(template.nodeTemplateName)
                    ) {
                      entityTypes.value.push(template.nodeTemplateName);
                    }
                  });
                }

                // 处理关系模板
                if (
                  response.data.relationTemplates &&
                  Array.isArray(response.data.relationTemplates)
                ) {
                  // 保存关系模板数据
                  relationTemplates.value = response.data.relationTemplates;
                  response.data.relationTemplates.forEach((template) => {
                    if (
                      template.relationTemplateName &&
                      !relationshipTypes.value.includes(
                        template.relationTemplateName,
                      )
                    ) {
                      relationshipTypes.value.push(
                        template.relationTemplateName,
                      );
                    }
                  });
                }
              }
            })(),
            handleComponentLibrarySearch(""),
          ]);
        } catch (error) {
          console.error("获取数据失败:", error);
        } finally {
          // 结束加载状态
          isLoadingTemplates.value = false;
          isLoadingComponents.value = false;
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
        ElMessage.success("新增成功");
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
  // 清空画布数据
  graphNodes.value = [];
  graphEdges.value = [];
  // 返回领域列表时隐藏属性面板
  showPropertyPanel.value = false;
  // 切换回领域页面，更新下拉框显示领域搜索历史
  updateDomainSearchOptions();
};

const handleBackToSubDomains = () => {
  // 保存当前子领域名称，用于显示数量
  const previousSubDomain = currentSubDomain.value;
  currentSubDomain.value = "";
  subSubDomains.value = [];
  // 清空画布数据
  graphNodes.value = [];
  graphEdges.value = [];
  // 返回子领域列表时隐藏属性面板
  showPropertyPanel.value = false;
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
  currentSubDomain.value = "";
  // 切换领域时隐藏属性面板
  showPropertyPanel.value = false;
  // 清空画布数据
  graphNodes.value = [];
  graphEdges.value = [];

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

  // 根据选择的领域设置子领域
  if (domain.name === "服务") {
    subDomains.value = [
      { name: "政务服务", count: 0 },
      { name: "会议", count: 0 },
      { name: "工作总线", count: 0 },
      { name: "规划编制", count: 0 },
    ];
  } else if (domain.name === "名城") {
    subDomains.value = [
      { name: "历史文化", count: 0 },
      { name: "城市规划", count: 0 },
      { name: "基础设施", count: 0 },
      { name: "公共服务", count: 0 },
    ];
  } else if (domain.name === "规划知识") {
    subDomains.value = [
      { name: "规划理论", count: 0 },
      { name: "规划法规", count: 0 },
      { name: "规划案例", count: 0 },
      { name: "规划技术", count: 0 },
    ];
  } else if (domain.name === "空间通讯") {
    subDomains.value = [
      { name: "空间数据", count: 0 },
      { name: "通讯网络", count: 0 },
      { name: "空间分析", count: 0 },
      { name: "通讯技术", count: 0 },
    ];
  } else {
    subDomains.value = [];
  }
};

// 获取专题列表
const fetchTopics = async (fieldId, condition = "") => {
  try {
    const currentDomainObj = domains.value.find(
      (domain) => domain.name === currentDomain.value,
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
    ElMessage.error("复制领域失败，请重试");
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
    ElMessage.error("复制专题失败，请重试");
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

const handleSubDomainClick = (subDomain) => {
  currentSubDomain.value = subDomain.name;
  // 根据选择的子领域设置子子领域
  if (subDomain.name === "规划理论") {
    subSubDomains.value = [
      { name: "城市规划理论" },
      { name: "区域规划理论" },
      { name: "可持续发展理论" },
      { name: "智能城市理论" },
    ];
  } else if (subDomain.name === "规划法规") {
    subSubDomains.value = [
      { name: "城市规划法" },
      { name: "土地管理法" },
      { name: "环境保护法" },
      { name: "建筑法" },
    ];
  } else if (subDomain.name === "规划案例") {
    subSubDomains.value = [
      { name: "国内案例" },
      { name: "国际案例" },
      { name: "成功案例" },
      { name: "失败案例" },
    ];
  } else if (subDomain.name === "规划技术") {
    subSubDomains.value = [
      { name: "GIS技术" },
      { name: "遥感技术" },
      { name: "大数据分析" },
      { name: "人工智能" },
    ];
  } else {
    subSubDomains.value = [];
  }
};

// 处理专题点击，设置当前子领域为专题名称
const handleTopicClick = async (topic, skipComponentLibrarySearch = false) => {
  currentSubDomain.value = topic.name;
  currentTopicId.value = topic.id;
  // 切换专题时隐藏属性面板
  showPropertyPanel.value = false;
  // 清空子子领域，因为专题是子领域的一种
  subSubDomains.value = [];

  // 开始加载模板数据和组件库数据
  isLoadingTemplates.value = true;
  isLoadingComponents.value = !skipComponentLibrarySearch;

  // 调用接口获取节点和关系模板以及组件库数据
  try {
    // 并行执行模板数据查询和组件库查询
    await Promise.all([
      (async () => {
        const response = await projectService.queryTemplate(topic.id);
        if (response && response.data) {
          // 清空现有数据
          entityTypes.value = [];
          relationshipTypes.value = [];
          // 清空现有节点和连线数据
          graphNodes.value = [];
          graphEdges.value = [];

          // 处理节点模板
          if (
            response.data.nodeTemplates &&
            Array.isArray(response.data.nodeTemplates)
          ) {
            // 为节点模板分配位置（均匀分散分布）
            const nodeCount = response.data.nodeTemplates.length;
            const nodePositions = [];

            // 计算画布大小，使用容器大小
            const { width: canvasWidth, height: canvasHeight } =
              getCanvasSize();
            const padding = 20; // 减小边距，让节点更靠近画布边缘

            // 生成均匀分散的位置
            response.data.nodeTemplates.forEach((template, index) => {
              if (
                template.nodeTemplateName &&
                !entityTypes.value.includes(template.nodeTemplateName)
              ) {
                entityTypes.value.push(template.nodeTemplateName);
              }

              // 计算节点位置：如果只有一个节点，放在中心；否则使用圆形布局均匀分布
              let x, y;
              if (nodeCount === 1) {
                // 只有一个节点时放在画布中心
                x = canvasWidth / 2;
                y = canvasHeight / 2;
              } else {
                // 多个节点时使用混合布局，结合椭圆分布和随机分布，避免中间空白
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                // 计算椭圆的长轴和短轴，考虑边距
                const semiMajorAxis = (canvasWidth - 2 * padding * 4) / 2; // 长轴半径
                const semiMinorAxis = (canvasHeight - 2 * padding) / 2; // 短轴半径
                // 计算每个节点的角度
                const angle = (2 * Math.PI * index) / nodeCount;

                // 为了避免中间空白，使用随机半径，让节点分布在不同距离的位置
                const randomRadiusFactor = 0.5 + Math.random() * 0.5; // 0.5 到 1 之间的随机因子
                // 计算节点位置（椭圆公式，使用随机半径）
                x =
                  centerX +
                  semiMajorAxis * randomRadiusFactor * Math.cos(angle);
                y =
                  centerY +
                  semiMinorAxis * randomRadiusFactor * Math.sin(angle);

                // 添加一些随机偏移，增加分散度
                const randomOffset = 60; // 偏移量
                x += (Math.random() - 0.5) * randomOffset;
                y += (Math.random() - 0.5) * randomOffset;
              }

              // 保存位置
              nodePositions.push({ x, y });

              // 将节点模板转换为画布节点
              const nodeProperties = template.properties
                ? template.properties.map((prop) => ({
                    name: prop.propertyKey,
                    type: prop.propertyType.toLowerCase(),
                    value: "",
                  }))
                : [];

              const newNode = {
                id: template.nodeTemplateId,
                type: "entity",
                name: template.nodeTemplateName,
                description: template.nodeTemplateDescription || "",
                x: x,
                y: y,
                properties: nodeProperties,
                backgroundColor: template.nodeTemplateColor || "#43D7B5",
                nodeTemplateId: template.nodeTemplateId,
                isLibraryFlag: template.isLibraryFlag || "0",
              };

              graphNodes.value.push(newNode);
            });
          }

          // 处理关系模板
          if (
            response.data.relationTemplates &&
            Array.isArray(response.data.relationTemplates)
          ) {
            // 保存关系模板数据
            relationTemplates.value = response.data.relationTemplates;
            // 创建节点 ID 集合，用于快速检查节点是否存在
            const nodeIds = new Set(graphNodes.value.map((node) => node.id));

            response.data.relationTemplates.forEach((template) => {
              if (
                template.relationTemplateName &&
                !relationshipTypes.value.includes(template.relationTemplateName)
              ) {
                relationshipTypes.value.push(template.relationTemplateName);
              }

              // 检查 startNodeTemplateId 和 endNodeTemplateId 是否存在于节点模板中
              if (
                !nodeIds.has(template.startNodeTemplateId) ||
                !nodeIds.has(template.endNodeTemplateId)
              ) {
                console.warn(
                  `跳过关系模板 ${template.relationTemplateId}，因为节点 ${template.startNodeTemplateId} 或 ${template.endNodeTemplateId} 不存在`,
                );
                return;
              }

              // 将关系模板转换为画布连线
              const edgeProperties = template.properties
                ? template.properties.map((prop) => ({
                    name: prop.propertyKey,
                    type: prop.propertyType.toLowerCase(),
                    value: "",
                  }))
                : [];

              // 获取关系类型对应的显示文本
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

              const newEdge = {
                id: template.relationTemplateId.toString(),
                source: template.startNodeTemplateId.toString(),
                target: template.endNodeTemplateId.toString(),
                data: {
                  name: template.relationTemplateName,
                  type: relationTypeText,
                  properties: edgeProperties,
                },
                relationTemplateId: template.relationTemplateId,
                isLibraryFlag: template.isLibraryFlag || "0",
              };

              graphEdges.value.push(newEdge);
            });
          }
        }
      })(),
      skipComponentLibrarySearch
        ? Promise.resolve()
        : handleComponentLibrarySearch(""),
    ]);
  } catch (error) {
    console.error("获取数据失败:", error);
  } finally {
    // 结束加载状态
    isLoadingTemplates.value = false;
    isLoadingComponents.value = false;
  }
};

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
  addToComponentLibrary.value = true;
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
  // 重置关系相关属性
  relationshipName.value = "";
  relationshipType.value = "定向";
  entityDescription.value = "";
  // entityProperties.value = [
  //   { name: "名字", type: "string", value: "" },
  //   { name: "日期", type: "date", value: "" },
  //   { name: "ID", type: "number", value: "" },
  // ];
  entityProperties.value = [];
  addToComponentLibrary.value = true;

  currentOperation.value = "relationship";
  currentNodeTemplateId.value = 0;
  currentRelationTemplateId.value = 0;
  isConnecting.value = true;

  // 存储原始的源节点ID
  originalSourceNodeId.value = sourceId;

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
    console.log("关闭属性面板后，调用resetConnectionState方法清除虚线");
  }
  console.log(
    "关闭属性面板后22222",
    contentRef.value,
    contentRef.value.clearNodeSelection,
  );
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
  if (sidebarRef.value && sidebarRef.value.handleClearSelections) {
    sidebarRef.value.handleClearSelections();
    console.log("关闭属性面板后，清除模型列表选中状态");
  }

  // 如果当前是关系操作，退出连线模式
  if (currentOperation.value === "relationship") {
    isConnecting.value = false;
    // 清空源节点和目标节点ID
    sourceNodeId.value = null;
    targetNodeId.value = null;
    originalSourceNodeId.value = null;
    originalTargetNodeId.value = null;
  }
};

const handleCancelPropertyPanel = () => {
  showPropertyPanel.value = false;

  // 取消属性面板后，清除虚线
  if (currentOperation.value === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("取消属性面板后，调用resetConnectionState方法清除虚线");
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

  // 如果当前是关系操作，退出连线模式
  if (currentOperation.value === "relationship") {
    isConnecting.value = false;
    // 清空源节点和目标节点ID
    sourceNodeId.value = null;
    targetNodeId.value = null;
    originalSourceNodeId.value = null;
    originalTargetNodeId.value = null;
  }
};

// 处理连接完成
const handleConnectionComplete = (targetId) => {
  console.log("连接完成，目标节点ID:", targetId);
  console.log("源节点ID:", sourceNodeId.value);

  // 存储原始的目标节点ID
  originalTargetNodeId.value = targetId;

  // 查找目标节点，使用其 nodeTemplateId
  const targetNode = graphNodes.value.find(
    (node) => String(node.id) === String(targetId),
  );

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

  // 设置结束节点名称
  endNodeName.value = targetNode ? targetNode.name : "";

  // 不立即退出连线模式，等待用户保存或取消关系后再退出
  // isConnecting.value = false;

  // 重置关系相关属性
  relationshipName.value = "";
  relationshipType.value = "定向";
  entityDescription.value = "";
  // entityProperties.value = [
  //   { name: "名字", type: "string", value: "" },
  //   { name: "日期", type: "date", value: "" },
  //   { name: "ID", type: "number", value: "" },
  // ];
  entityProperties.value = [];
  addToComponentLibrary.value = true;

  // 设置当前操作类型为关系
  currentOperation.value = "relationship";
  currentNodeTemplateId.value = 0;
  currentRelationTemplateId.value = 0;

  // 打开属性面板
  showPropertyPanel.value = true;
  console.log("打开关系属性面板");
};

const handleSavePropertyPanel = (data) => {
  // 保存实体或关系的属性
  hasData.value = true;
  savedEntitiesCount.value += 1;

  // 根据当前操作类型处理
  if (data.currentOperation === "entity") {
    // 将当前填写的实体名称添加到实体类型数组中（如果不存在）
    if (data.entityName && !entityTypes.value.includes(data.entityName)) {
      entityTypes.value.push(data.entityName);
    }

    // 更新entityProperties变量，这样当用户再次点击同一个实体类型或组件时，属性面板会显示修改后的值
    entityProperties.value = [...data.entityProperties];

    // 注意：这里不再手动添加节点，因为保存成功后会通过 update-nodes 事件从接口获取最新数据并更新
    console.log("节点保存成功，等待接口数据更新");
  } else if (data.currentOperation === "relationship") {
    // 将当前填写的关系名称添加到关系类型数组中（如果不存在）
    if (
      data.relationshipName &&
      !relationshipTypes.value.includes(data.relationshipName)
    ) {
      relationshipTypes.value.push(data.relationshipName);
    }

    // 注意：不再手动添加关系边，因为保存成功后会通过 update-nodes 事件从接口获取最新数据并更新
    console.log("关系保存成功，等待接口数据更新");

    // 清空源节点和目标节点ID，准备下一次连线
    sourceNodeId.value = null;
    targetNodeId.value = null;
    originalSourceNodeId.value = null;
    originalTargetNodeId.value = null;
    // 退出连线模式
    isConnecting.value = false;
  }

  // 更新当前子领域的数量
  const currentSubDomainObj = subDomains.value.find(
    (subDomain) => subDomain.name === currentSubDomain.value,
  );
  if (currentSubDomainObj) {
    currentSubDomainObj.count += 1;
  }

  showPropertyPanel.value = false;

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
  if (sidebarRef.value && sidebarRef.value.handleClearSelections) {
    sidebarRef.value.handleClearSelections();
    console.log("保存属性后，清除模型列表选中状态");
  }

  // 保存关系后，清除虚线
  if (data.currentOperation === "relationship" && contentRef.value) {
    contentRef.value.resetConnectionState();
    console.log("保存关系后，调用resetConnectionState方法清除虚线");
  }
};

const handleAddProperty = () => {
  entityProperties.value.push({ name: "", type: "string", value: "" });
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
    name: typeof item === "string" ? item : item.nodeTemplateName,
    x: x,
    y: y,
    // 添加属性信息
    properties: type === "entity" ? [...entityProperties.value] : [],
    // 添加节点模板ID
    nodeTemplateId:
      typeof item === "object" && item.nodeTemplateId ? item.nodeTemplateId : 0,
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

// 处理取消新增领域
const handleCancelAddDomain = () => {
  showAddDialog.value = false;
};

// 打开新增专题对话框
const openAddTopicDialog = () => {
  showAddTopicDialog.value = true;
};

// 取消新增专题
const handleCancelAddTopic = () => {
  showAddTopicDialog.value = false;
  newTopicName.value = "";
};

// 处理新增专题
const handleAddTopic = async (name) => {
  if (name) {
    try {
      const currentDomainObj = domains.value.find(
        (domain) => domain.name === currentDomain.value,
      );
      if (!currentDomainObj) return;

      const response = await projectService.addTopicProject({
        topicName: name,
        fieldId: currentDomainObj.id,
      });
      if (response && response.data) {
        // 新增成功后，重新获取专题列表
        await fetchTopics(currentDomainObj.id);
        newTopicName.value = "";
        showAddTopicDialog.value = false;
        ElMessage.success("新增成功");
      }
    } catch (error) {
      console.error("新增专题失败:", error);
    }
  }
};

// 图谱创建相关状态
const isConfirmButtonDisabled = ref(false);

// 处理创建图谱
const handleCreateGraph = async (graphData) => {
  if (!graphData.graphName) {
    Message.warning("请输入图谱名称");
    return;
  }

  if (!graphData.createMethod) {
    Message.warning("请选择创建方式");
    return;
  }

  isConfirmButtonDisabled.value = true;

  try {
    // 构造图谱数据
    const graphDataToSend = {
      name: graphData.graphName,
      createMethod: graphData.createMethod,
      file: graphData.createMethod === "text" ? graphData.uploadedFile : null,
      databaseName:
        graphData.createMethod === "database" ? graphData.databaseName : "",
      anyContent: graphData.createMethod === "any" ? graphData.anyContent : "",
    };

    // 这里可以处理图谱创建的逻辑，例如保存图谱数据到后端
    console.log("创建图谱:", graphDataToSend);

    // 模拟创建成功
    // const response = await createGraph(graphDataToSend);
    // if (response.code === 200) {
    // 创建成功后的处理
    Message.success("图谱创建成功");
    // 添加到图谱列表
    const newGraph = {
      id: Date.now(),
      name: graphData.graphName,
      createMethod: graphData.createMethod,
      createdAt: new Date().toISOString(),
    };
    graphs.value.push(newGraph);
    // 设置 hasData 为 true，显示关系图
    hasData.value = true;
    // } else {
    //   Message.error(response.message || "图谱创建失败");
    // }
  } catch (error) {
    Message.error("图谱创建失败，请稍后重试");
  } finally {
    isConfirmButtonDisabled.value = false;
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
const handleGraphClick = (graph) => {
  console.log("点击图谱:", graph);
  // 点击图谱时隐藏属性面板
  showPropertyPanel.value = false;
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
  // 切换模式时隐藏属性面板
  showPropertyPanel.value = false;
};

// 处理实体类型点击
const handleEntityTypeClick = (entityType) => {
  console.log("点击实体类型:", entityType);
  console.log("Before setting showPropertyPanel:", showPropertyPanel.value);

  // 设置 Sidebar 组件中的选中状态
  if (sidebarRef.value && sidebarRef.value.setSelectedEntityType) {
    sidebarRef.value.setSelectedEntityType(entityType);
    console.log("设置实体类型选中状态:", entityType);
  }

  // 打开属性面板，设置当前操作类型为实体
  currentOperation.value = "entity";
  entityName.value = entityType;

  // 从graphNodes中查找对应的实体模板信息
  const entityTemplate = graphNodes.value.find(
    (node) => node.name === entityType,
  );
  if (entityTemplate) {
    // 设置实体描述（如果有）
    entityDescription.value = entityTemplate.description || "";
    // 设置实体属性
    entityProperties.value = entityTemplate.properties || [];
    // 设置背景颜色
    backgroundColor.value = entityTemplate.backgroundColor || "#43D7B5";
    // 设置是否加入组件库
    addToComponentLibrary.value = entityTemplate.isLibraryFlag === "1";
    // 设置当前节点的模板ID
    currentNodeTemplateId.value = entityTemplate.nodeTemplateId || 0;
    currentRelationTemplateId.value = 0;
  } else {
    // 如果找不到模板信息，重置默认值
    entityDescription.value = "";
    entityProperties.value = [];
    backgroundColor.value = "#43D7B5";
    addToComponentLibrary.value = true;
    currentNodeTemplateId.value = 0;
    currentRelationTemplateId.value = 0;
  }

  showPropertyPanel.value = true;
  console.log("After setting showPropertyPanel:", showPropertyPanel.value);
};

// 处理关系类型点击
const handleRelationshipTypeClick = (relationshipTypeName) => {
  console.log("点击关系类型:", relationshipTypeName);
  console.log("Before setting showPropertyPanel:", showPropertyPanel.value);

  // 设置 Sidebar 组件中的选中状态
  if (sidebarRef.value && sidebarRef.value.setSelectedRelationshipType) {
    sidebarRef.value.setSelectedRelationshipType(relationshipTypeName);
    console.log("设置关系类型选中状态:", relationshipTypeName);
  }

  // 打开属性面板，设置当前操作类型为关系
  currentOperation.value = "relationship";
  relationshipName.value = relationshipTypeName;

  // 从relationTemplates中查找对应的关系模板信息
  const relationshipTemplate = relationTemplates.value.find(
    (template) => template.relationTemplateName === relationshipTypeName,
  );
  if (relationshipTemplate) {
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
    currentRelationTemplateId.value =
      relationshipTemplate.relationTemplateId || 0;
    currentNodeTemplateId.value = 0;

    // 设置开始和结束节点名称
    const startNode = graphNodes.value.find(
      (node) =>
        String(node.id) === String(relationshipTemplate.startNodeTemplateId),
    );
    const endNode = graphNodes.value.find(
      (node) =>
        String(node.id) === String(relationshipTemplate.endNodeTemplateId),
    );
    startNodeName.value = startNode ? startNode.name : "";
    endNodeName.value = endNode ? endNode.name : "";
  } else {
    // 如果找不到模板信息，重置默认值
    relationshipType.value = "定向";
    entityProperties.value = [];
    addToComponentLibrary.value = true;
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

  // 设置 Sidebar 组件中的选中状态
  if (sidebarRef.value && sidebarRef.value.setSelectedComponent) {
    sidebarRef.value.setSelectedComponent(componentName);
    console.log("设置组件选中状态:", componentName);
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
    addToComponentLibrary.value = true;
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
    ElMessage.error("添加失败，请重试");
    console.error("添加组件到模型失败:", error);
  }
};

// 存储当前选中的节点或连线的模板ID
const currentNodeTemplateId = ref(0);
const currentRelationTemplateId = ref(0);

// 组件库列表
const components = ref([]);

// 处理节点点击
const handleNodeClick = (node) => {
  console.log("Home组件接收节点点击:", node);
  // 打开属性面板，设置当前操作类型为实体
  currentOperation.value = "entity";
  entityName.value = node.name;
  entityDescription.value = node.description || "";
  entityProperties.value = node.properties || [];
  backgroundColor.value = node.backgroundColor || "#43D7B5";
  addToComponentLibrary.value = node.isLibraryFlag === "1";
  // 设置当前节点的模板ID
  currentNodeTemplateId.value = node.nodeTemplateId || 0;
  currentRelationTemplateId.value = 0;
  showPropertyPanel.value = true;
  console.log("设置showPropertyPanel为true");
};

// 处理边点击
const handleEdgeClick = (edge) => {
  console.log("Home组件接收边点击:", edge);
  try {
    // 打开属性面板，设置当前操作类型为关系
    currentOperation.value = "relationship";
    relationshipName.value = edge.data?.name || "";
    relationshipType.value = edge.data?.type || "定向";
    entityProperties.value = edge.data?.properties || [];
    // 设置是否加入组件库
    addToComponentLibrary.value = edge.isLibraryFlag === "1";
    // 设置当前连线的模板ID
    currentRelationTemplateId.value = edge.relationTemplateId || 0;
    currentNodeTemplateId.value = 0;

    // 获取开始和结束节点
    const startNode = graphNodes.value.find(
      (node) => String(node.id) === String(edge.source),
    );
    const endNode = graphNodes.value.find(
      (node) => String(node.id) === String(edge.target),
    );

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
  if (templateData && templateData.nodeTemplates) {
    // 清空现有节点数据
    graphNodes.value = [];
    // 清空实体类型数组，准备重新构建
    entityTypes.value = [];

    // 为节点模板分配位置（均匀分散分布）
    const nodeCount = templateData.nodeTemplates.length;
    const nodePositions = [];

    // 计算画布大小，使用容器大小
    const { width: canvasWidth, height: canvasHeight } = getCanvasSize();
    const padding = 20; // 减小边距，让节点更靠近画布边缘

    templateData.nodeTemplates.forEach((template, index) => {
      // 添加节点模板名称到实体类型数组
      if (template.nodeTemplateName) {
        entityTypes.value.push(template.nodeTemplateName);
      }

      // 计算节点位置：如果只有一个节点，放在中心；否则使用圆形布局均匀分布
      let x, y;
      if (nodeCount === 1) {
        // 只有一个节点时放在画布中心
        x = canvasWidth / 2;
        y = canvasHeight / 2;
      } else {
        // 多个节点时使用混合布局，结合椭圆分布和随机分布，避免中间空白
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        // 计算椭圆的长轴和短轴，考虑边距
        const semiMajorAxis = (canvasWidth - 2 * padding * 4) / 2; // 长轴半径
        const semiMinorAxis = (canvasHeight - 2 * padding) / 2; // 短轴半径
        // 计算每个节点的角度
        const angle = (2 * Math.PI * index) / nodeCount;

        // 为了避免中间空白，使用随机半径，让节点分布在不同距离的位置
        const randomRadiusFactor = 0.5 + Math.random() * 0.5; // 0.5 到 1 之间的随机因子
        // 计算节点位置（椭圆公式，使用随机半径）
        x = centerX + semiMajorAxis * randomRadiusFactor * Math.cos(angle);
        y = centerY + semiMinorAxis * randomRadiusFactor * Math.sin(angle);

        // 添加一些随机偏移，增加分散度
        const randomOffset = 60; // 偏移量
        x += (Math.random() - 0.5) * randomOffset;
        y += (Math.random() - 0.5) * randomOffset;
      }

      // 保存位置
      nodePositions.push({ x, y });

      // 将节点模板转换为画布节点
      const nodeProperties = template.properties
        ? template.properties.map((prop) => ({
            name: prop.propertyKey,
            type: prop.propertyType.toLowerCase(),
            value: "",
          }))
        : [];

      const newNode = {
        id: template.nodeTemplateId,
        type: "entity",
        name: template.nodeTemplateName,
        description: template.nodeTemplateDescription || "",
        x: x,
        y: y,
        properties: nodeProperties,
        backgroundColor: template.nodeTemplateColor || "#43D7B5",
        nodeTemplateId: template.nodeTemplateId,
        isLibraryFlag: template.isLibraryFlag || "0",
      };

      graphNodes.value.push(newNode);
    });

    // 更新关系模板
    if (templateData.relationTemplates) {
      // 保存关系模板数据
      relationTemplates.value = templateData.relationTemplates;
      // 清空现有关系数据
      graphEdges.value = [];
      // 清空关系类型数组，准备重新构建
      relationshipTypes.value = [];

      // 创建节点 ID 集合，用于快速检查节点是否存在
      const nodeIds = new Set(graphNodes.value.map((node) => node.id));

      templateData.relationTemplates.forEach((template) => {
        // 添加关系模板名称到关系类型数组
        if (template.relationTemplateName) {
          relationshipTypes.value.push(template.relationTemplateName);
        }

        // 检查 startNodeTemplateId 和 endNodeTemplateId 是否存在于节点模板中
        if (
          !nodeIds.has(template.startNodeTemplateId) ||
          !nodeIds.has(template.endNodeTemplateId)
        ) {
          console.warn(
            `跳过关系模板 ${template.relationTemplateId}，因为节点 ${template.startNodeTemplateId} 或 ${template.endNodeTemplateId} 不存在`,
          );
          return;
        }

        // 将关系模板转换为画布连线
        const edgeProperties = template.properties
          ? template.properties.map((prop) => ({
              name: prop.propertyKey,
              type: prop.propertyType.toLowerCase(),
              value: "",
            }))
          : [];

        // 获取关系类型对应的显示文本
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

        const newEdge = {
          id: template.relationTemplateId.toString(),
          source: template.startNodeTemplateId.toString(),
          target: template.endNodeTemplateId.toString(),
          data: {
            name: template.relationTemplateName,
            type: relationTypeText,
            properties: edgeProperties,
          },
          relationTemplateId: template.relationTemplateId,
          isLibraryFlag: template.isLibraryFlag || "0",
        };

        graphEdges.value.push(newEdge);
      });
    }

    console.log("节点数据更新完成:", graphNodes.value, graphEdges.value);
  }
};

// 处理清除选中状态
const handleClearSelections = () => {
  // 这里不需要做任何操作，因为 Sidebar 组件会处理清除选中状态的逻辑
  console.log("清除模型列表选中状态");
};
</script>

<template>
  <div class="home-container">
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧侧边栏 -->
      <Sidebar
        ref="sidebarRef"
        :all-option="allOption"
        :current-domain="currentDomain"
        :current-sub-domain="currentSubDomain"
        :current-mode="currentMode"
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
        :is-loading-templates="isLoadingTemplates"
        :is-loading-components="isLoadingComponents"
        :has-data="hasData"
        :entity-types="entityTypes"
        :relationship-types="relationshipTypes"
        :relation-templates="relationTemplates"
        :components="components"
        @delete-domain="handleDeleteDomain"
        @open-add-dialog="openAddDialog"
        @open-add-topic-dialog="openAddTopicDialog"
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
        @topic-click="handleTopicClick"
        @search-icon-click="handleSearchIconClick"
        @topic-search-icon-click="handleTopicSearchIconClick"
        @clear-domain-history="clearDomainSearchHistory"
        @clear-topic-history="clearTopicSearchHistory"
        @clear-graph-history="clearGraphSearchHistory"
        @graph-search="handleGraphSearch"
        @graph-search-icon-click="handleGraphSearchIconClick"
        @add-entity-type="handleAddEntityType"
        @entity-type-click="handleEntityTypeClick"
        @relationship-type-click="handleRelationshipTypeClick"
        @component-click="handleComponentClick"
        @component-library-search="handleComponentLibrarySearch"
        @add-component-to-model="handleAddComponentToModel"
        @copy-domain="handleCopyDomain"
        @copy-topic="handleCopyTopic"
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
      />
    </div>

    <!-- 右侧属性面板 -->
    <PropertyPanel
      :show-property-panel="showPropertyPanel"
      :current-operation="currentOperation"
      :entity-name="entityName"
      :entity-description="entityDescription"
      :entity-properties="entityProperties"
      :relationship-name="relationshipName"
      :relationship-type="relationshipType"
      :start-node-name="startNodeName"
      :end-node-name="endNodeName"
      :add-to-component-library="addToComponentLibrary"
      :background-color="backgroundColor"
      :topic-id="currentTopicId"
      :start-node-template-id="sourceNodeId"
      :end-node-template-id="targetNodeId"
      :node-template-id="currentNodeTemplateId"
      :relation-template-id="currentRelationTemplateId"
      @close="handleClosePropertyPanel"
      @save="handleSavePropertyPanel"
      @add-property="handleAddProperty"
      @update-nodes="handleUpdateNodes"
    />

    <!-- 新增领域对话框 -->
    <AddDomainDialog
      v-model:visible="showAddDialog"
      :new-domain-name="newDomainName"
      @add-domain="handleAddDomain"
      @cancel="handleCancelAddDomain"
    />

    <!-- 新增专题对话框 -->
    <AddDomainDialog
      v-model:visible="showAddTopicDialog"
      :new-domain-name="newTopicName"
      @add-domain="handleAddTopic"
      @cancel="handleCancelAddTopic"
      title="新增专题"
      label-name="专题名称"
      placeholder-text="请输入专题名称"
    />

    <!-- 新建图谱对话框 -->
    <AddGraphDialog
      v-model:visible="showGraphDialog"
      :is-confirm-button-disabled="isConfirmButtonDisabled"
      @create-graph="handleCreateGraph"
      @cancel="handleCancelCreateGraph"
    />
  </div>
</template>

<style scoped>
.home-container {
  width: 100%;
  height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
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

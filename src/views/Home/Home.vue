<script setup>
import { ref, onMounted, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import Header from "@/components/common/Header.vue";
import Sidebar from "@/components/common/Sidebar.vue";
import Content from "@/components/common/Content.vue";
import PropertyPanel from "@/components/common/PropertyPanel.vue";
import AddDomainDialog from "@/components/common/AddDomainDialog.vue";
import projectService from "@/services/project";

// 从localStorage读取状态，或使用默认值
const loadState = () => {
  const savedState = localStorage.getItem("homePageState");
  if (savedState) {
    return JSON.parse(savedState);
  }
  return {
    currentDomain: "",
    currentSubDomain: "",
    domains: [],
    subDomains: [],
    subSubDomains: [],
    hasData: false,
    graphs: [],
    graphNodes: [],
  };
};

const allOption = ref("全部");
const currentDomain = ref("");
const currentSubDomain = ref("");
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
const entityName = ref("人物");
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
// 图谱节点
const graphNodes = ref([]);
// 图谱列表
const graphs = ref([]);
// 显示图谱创建对话框
const showGraphDialog = ref(false);
// 保存右键点击的位置
const rightClickPosition = ref({ x: 0, y: 0 });
// 专题列表加载状态
const isLoadingTopics = ref(false);

// ============ 历史搜索记录相关 ============
// 存储在不同上下文中的历史记录
const domainSearchHistory = ref([]); // 领域搜索历史
const topicSearchHistory = ref([]); // 专题搜索历史

// 从localStorage加载历史搜索记录
const loadSearchHistory = () => {
  const savedDomainHistory = localStorage.getItem("domainSearchHistory");
  const savedTopicHistory = localStorage.getItem("topicSearchHistory");

  if (savedDomainHistory) {
    domainSearchHistory.value = JSON.parse(savedDomainHistory);
  }
  if (savedTopicHistory) {
    topicSearchHistory.value = JSON.parse(savedTopicHistory);
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
// ============ 历史搜索记录相关结束 ============

// 保存状态到localStorage
const saveState = () => {
  const state = {
    currentDomain: currentDomain.value,
    currentSubDomain: currentSubDomain.value,
    domains: domains.value,
    subDomains: subDomains.value,
    subSubDomains: subSubDomains.value,
    hasData: hasData.value,
    graphs: graphs.value,
    graphNodes: graphNodes.value,
  };
  localStorage.setItem("homePageState", JSON.stringify(state));
};

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
  currentSubDomain.value = savedState.currentSubDomain;
  subDomains.value = savedState.subDomains;
  subSubDomains.value = savedState.subSubDomains;
  hasData.value = savedState.hasData;
  graphs.value = savedState.graphs;
  graphNodes.value = savedState.graphNodes || [];

  // 加载历史搜索记录
  loadSearchHistory();

  // 初始化搜索下拉框选项
  updateDomainSearchOptions();
  updateTopicSearchOptions();

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
    const response = await projectService.getProjectList("");
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
    const response = await projectService.getProjectList(condition);
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
    await projectService.deleteProject(id);
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
      const response = await projectService.addProject({ fieldName: name });
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
  currentSubDomain.value = "";

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

const handleAddEntity = (position) => {
  currentOperation.value = "entity";
  if (position) {
    rightClickPosition.value = position;
  }
  showPropertyPanel.value = true;
};

const handleCreateRelationship = () => {
  currentOperation.value = "relationship";
  showPropertyPanel.value = true;
};

const handleClosePropertyPanel = () => {
  showPropertyPanel.value = false;
};

const handleCancelPropertyPanel = () => {
  showPropertyPanel.value = false;
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

    // 创建新的实体节点并添加到图谱节点中
    const newNode = {
      id: Date.now(),
      type: "entity",
      name: data.entityName,
      // 正确处理x或y为0的情况
      x:
        rightClickPosition.value.x !== undefined
          ? rightClickPosition.value.x
          : 100 + Math.random() * 400, // 使用右键点击位置，或随机位置作为备选
      y:
        rightClickPosition.value.y !== undefined
          ? rightClickPosition.value.y
          : 100 + Math.random() * 300,
      properties: data.entityProperties,
    };
    graphNodes.value.push(newNode);
    console.log("新创建的节点:", newNode);
    console.log("当前graphNodes数组:", graphNodes.value);
  } else if (data.currentOperation === "relationship") {
    // 将当前填写的关系名称添加到关系类型数组中（如果不存在）
    if (
      data.relationshipName &&
      !relationshipTypes.value.includes(data.relationshipName)
    ) {
      relationshipTypes.value.push(data.relationshipName);
    }
  }

  // 更新当前子领域的数量
  const currentSubDomainObj = subDomains.value.find(
    (subDomain) => subDomain.name === currentSubDomain.value,
  );
  if (currentSubDomainObj) {
    currentSubDomainObj.count += 1;
  }

  showPropertyPanel.value = false;
};

const handleAddProperty = () => {
  entityProperties.value.push({ name: "", type: "text", value: "" });
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
      }
    } catch (error) {
      console.error("新增专题失败:", error);
    }
  }
};

// 处理创建图谱
const handleCreateGraph = (graphData) => {
  // 这里可以处理图谱创建的逻辑，例如保存图谱数据到后端
  console.log("创建图谱:", graphData);
  // 添加到图谱列表
  const newGraph = {
    id: Date.now(),
    name: graphData.name,
    createMethod: graphData.createMethod,
    createdAt: new Date().toISOString(),
  };
  graphs.value.push(newGraph);
  // 设置 hasData 为 true，显示关系图
  hasData.value = true;
};

// 处理创建图谱点击
const handleCreateGraphClick = () => {
  showGraphDialog.value = true;
};

// 处理图谱点击
const handleGraphClick = (graph) => {
  console.log("点击图谱:", graph);
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

// 处理关闭图谱对话框
const handleCloseGraphDialog = () => {
  showGraphDialog.value = false;
};
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <Header />

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧侧边栏 -->
      <Sidebar
        :all-option="allOption"
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
        @search-icon-click="handleSearchIconClick"
        @topic-search-icon-click="handleTopicSearchIconClick"
        @clear-domain-history="clearDomainSearchHistory"
        @clear-topic-history="clearTopicSearchHistory"
      />

      <!-- 中间内容 -->
      <Content
        :current-sub-domain="currentSubDomain"
        :has-data="hasData"
        :graph-nodes="graphNodes"
        :entity-properties="entityProperties"
        :show-graph-dialog="showGraphDialog"
        @add-entity="handleAddEntity"
        @create-relationship="handleCreateRelationship"
        @drop="handleDrop"
        @node-mouse-down="handleNodeMouseDown"
        @mouse-move="handleMouseMove"
        @mouse-up="handleMouseUp"
        @create-graph="handleCreateGraph"
        @close-graph-dialog="handleCloseGraphDialog"
      />

      <!-- 右侧属性面板 -->
      <PropertyPanel
        :show-property-panel="showPropertyPanel"
        :current-operation="currentOperation"
        :entity-name="entityName"
        :entity-description="entityDescription"
        :entity-properties="entityProperties"
        :relationship-name="relationshipName"
        :add-to-component-library="addToComponentLibrary"
        @close="handleClosePropertyPanel"
        @cancel="handleCancelPropertyPanel"
        @save="handleSavePropertyPanel"
        @add-property="handleAddProperty"
      />
    </div>

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
  </div>
</template>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
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

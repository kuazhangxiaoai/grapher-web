<template>
  <aside class="sidebar">
    <!-- 面包屑导航 -->
    <div class="breadcrumb" v-if="currentSubDomain">
      <span
        @click="handleBackToDomains"
        class="breadcrumb-item cursor-pointer"
        >{{ allOption }}</span
      >
      <img
        class="breadcrumb-separator"
        src="../../assets/images/下一个.png"
        alt=""
      />
      <span
        @click="handleBackToSubDomains"
        class="breadcrumb-item cursor-pointer"
        >{{ currentDomain }}</span
      >
      <img
        class="breadcrumb-separator"
        src="../../assets/images/下一个.png"
        alt=""
      />
      <span class="breadcrumb-item">{{ currentSubDomain }}</span>
    </div>
    <div class="breadcrumb" v-else-if="currentDomain">
      <span
        @click="handleBackToDomains"
        class="breadcrumb-item cursor-pointer"
        >{{ allOption }}</span
      >
      <img
        class="breadcrumb-separator"
        src="../../assets/images/下一个.png"
        alt=""
      />
      <span class="breadcrumb-item">{{ currentDomain }}</span>
    </div>
    <div class="all-option" v-else>
      <img class="all-option-icon" src="../../assets/images/全部.png" alt="" />
      <span>{{ allOption }}</span>
    </div>

    <!-- 搜索框区域 - 领域页面 -->
    <div class="search-box" v-if="!currentDomain">
      <div class="search-container">
        <el-input
          v-model="localSearchQuery"
          placeholder="搜索"
          class="search-input"
          clearable
          @input="handleSearch"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @clear="handleSearchClear"
        >
          <template #suffix>
            <el-icon
              @click.stop="handleSearchClick"
              @mousedown.prevent
              class="search-icon"
            >
              <Search />
            </el-icon>
          </template>
        </el-input>
        <!-- 历史搜索下拉框 -->
        <div
          v-if="searchOptions.length > 0 && isSearchFocused"
          class="search-dropdown"
        >
          <div class="dropdown-header">
            <span class="dropdown-title">历史搜索</span>
            <span
              v-if="searchOptions.length > 0 && !searchOptions[0].disabled"
              class="clear-history"
              @click.stop="handleClearDomainHistory"
            >
              清空
            </span>
          </div>
          <div
            v-for="item in searchOptions"
            :key="item.value"
            class="search-item"
            :class="{ disabled: item.disabled }"
            @click="!item.disabled && selectSearchItem(item.value)"
          >
            <!-- <span class="history-icon">⏱️</span> -->
            <template v-if="localSearchQuery && !item.disabled">
              <span
                v-for="(part, index) in item.value.split(
                  new RegExp(`(${localSearchQuery})`, 'gi'),
                )"
                :key="index"
                :class="{
                  highlight:
                    part.toLowerCase() === localSearchQuery.toLowerCase(),
                }"
                >{{ part }}</span
              >
            </template>
            <template v-else>
              {{ item.value }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 领域列表 -->
    <div class="domain-list" v-if="!currentDomain">
      <div v-if="domains.length === 0" class="empty-state">
        <span>暂无数据</span>
      </div>
      <div
        v-else
        v-for="domain in domains"
        :key="domain.id"
        class="domain-item"
        @click="handleDomainClick(domain)"
      >
        <div class="domain-info">
          <span>{{ domain.name }}</span>
        </div>
        <div class="domain-icons">
          <img class="arrow-icon" src="@/assets/images/复制.png" alt="arrow" />
          <div class="domain-actions">
            <button
              class="delete-btn"
              @click.stop="handleDeleteDomain(domain.id)"
              title="删除"
            >
              <img src="@/assets/images/矩形.png" alt="delete" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 子领域/专题页面 -->
    <div v-else-if="!currentSubDomain" class="sub-domain-container">
      <!-- 专题搜索框 -->
      <div class="search-box">
        <div class="search-container">
          <el-input
            v-model="localSearchQuery"
            placeholder="搜索专题"
            class="search-input"
            clearable
            @input="handleTopicSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            @clear="handleTopicSearchClear"
          >
            <template #suffix>
              <el-icon
                @click.stop="handleTopicSearchClick"
                @mousedown.prevent
                class="search-icon"
              >
                <Search />
              </el-icon>
            </template>
          </el-input>
          <!-- 历史搜索下拉框 -->
          <div
            v-if="topicSearchOptions.length > 0 && isSearchFocused"
            class="search-dropdown"
          >
            <div class="dropdown-header">
              <span class="dropdown-title">历史搜索</span>
              <span
                v-if="
                  topicSearchOptions.length > 0 &&
                  !topicSearchOptions[0].disabled
                "
                class="clear-history"
                @click.stop="handleClearTopicHistory"
              >
                清空
              </span>
            </div>
            <div
              v-for="item in topicSearchOptions"
              :key="item.value"
              class="search-item"
              :class="{ disabled: item.disabled }"
              @click="!item.disabled && selectSearchItem(item.value)"
            >
              <!-- <span class="history-icon">⏱️</span> -->
              <template v-if="localSearchQuery && !item.disabled">
                <span
                  v-for="(part, index) in item.value.split(
                    new RegExp(`(${localSearchQuery})`, 'gi'),
                  )"
                  :key="index"
                  :class="{
                    highlight:
                      part.toLowerCase() === localSearchQuery.toLowerCase(),
                  }"
                  >{{ part }}</span
                >
              </template>
              <template v-else>
                {{ item.value }}
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 专题列表 -->
      <div class="domain-list">
        <div v-if="isLoadingTopics" class="loading-container">
          <div class="loading-icon"></div>
          <span>加载中...</span>
        </div>
        <div v-else-if="topics.length === 0" class="empty-state">
          <span>暂无数据</span>
        </div>
        <div
          v-else
          v-for="(topic, index) in topics"
          :key="topic.id"
          class="domain-item"
        >
          <div class="domain-info">
            <span>{{ topic.name }}</span>
          </div>
          <div class="domain-icons">
            <img
              class="arrow-icon"
              src="@/assets/images/复制.png"
              alt="arrow"
            />
            <div class="domain-actions">
              <button
                class="delete-btn"
                @click.stop="handleDeleteTopic(topic.id)"
                title="删除"
              >
                <img src="@/assets/images/矩形.png" alt="delete" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 子子领域详情页面 -->
    <div v-else>
      <!-- 图谱列表 -->
      <div class="graph-list" v-if="!hasData">
        <!-- 搜索框 -->
        <div class="search-container">
          <el-input
            v-model="localSearchQuery"
            placeholder="搜索"
            class="search-input"
            clearable
            @input="handleSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            @clear="handleSearchClear"
          >
            <template #suffix>
              <el-icon
                @click.stop="handleSearchClick"
                @mousedown.prevent
                class="search-icon"
              >
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>

        <!-- 图谱项目 -->
        <div v-if="graphs && graphs.length > 0" class="graph-items">
          <div
            v-for="graph in graphs"
            :key="graph.id"
            class="graph-item"
            @click="handleGraphClick(graph)"
          >
            <div class="graph-info">
              <span>{{ graph.name }}</span>
            </div>
            <div class="graph-actions">
              <button
                class="edit-btn"
                @click.stop="handleEditGraph(graph)"
                title="编辑"
              >
                ✏️
              </button>
              <button
                class="delete-btn"
                @click.stop="handleDeleteGraph(graph.id)"
                title="删除"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-list">
          <div class="list-placeholder">
            <span>暂无图谱</span>
          </div>
        </div>

        <!-- 新建图谱按钮 -->
        <div class="add-btn">
          <el-button
            type="success"
            size="small"
            @click="handleCreateGraphClick"
          >
            <el-icon class="plusIcon"><Plus /></el-icon>
            新建图谱
          </el-button>
        </div>
      </div>

      <!-- 数据列表 -->
      <div v-else>
        <!-- 实体类型 -->
        <div class="data-section">
          <h3>实体类型</h3>
          <div class="entity-types">
            <div
              v-for="(type, index) in entityTypes"
              :key="index"
              class="entity-type-item"
              draggable="true"
              @dragstart="handleDragStart($event, 'entity', type)"
              @dragend="handleDragEnd"
            >
              {{ type }}
            </div>
          </div>
        </div>

        <!-- 关系类型 -->
        <div class="data-section">
          <h3>关系类型</h3>
          <div class="relationship-types">
            <div
              v-for="(type, index) in relationshipTypes"
              :key="index"
              class="relationship-type-item"
              draggable="true"
              @dragstart="handleDragStart($event, 'relationship', type)"
              @dragend="handleDragEnd"
            >
              {{ type }}
            </div>
          </div>
        </div>
      </div>

      <!-- 组件库 -->
      <div class="component-library" v-if="hasData">
        <h3>组件库</h3>
        <el-input
          v-model="localSearchQuery"
          placeholder="搜索"
          class="search-input"
          clearable
          @input="handleSearch"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          :suffix-icon="Search"
        />
        <div class="component-item">
          <div class="component-name">工作要点</div>
          <button class="add-component-btn">+</button>
        </div>
        <div class="component-item">
          <div class="component-name">规划要求</div>
          <button class="add-component-btn">+</button>
        </div>
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="add-btn" v-if="!currentSubDomain">
      <el-button
        type="success"
        size="small"
        @click="currentDomain ? openAddTopicDialog() : openAddDialog()"
      >
        <el-icon class="plusIcon"><Plus /></el-icon>
        {{ currentDomain ? "新增专题" : "新增领域" }}
      </el-button>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch } from "vue";
import { Search } from "@element-plus/icons-vue";

const props = defineProps({
  allOption: {
    type: String,
    default: "全部",
  },
  currentDomain: {
    type: String,
    default: "",
  },
  currentSubDomain: {
    type: String,
    default: "",
  },
  domains: {
    type: Array,
    default: () => [],
  },
  subDomains: {
    type: Array,
    default: () => [],
  },
  subSubDomains: {
    type: Array,
    default: () => [],
  },
  topics: {
    type: Array,
    default: () => [],
  },
  graphs: {
    type: Array,
    default: () => [],
  },
  searchOptions: {
    type: Array,
    default: () => [],
  },
  topicSearchOptions: {
    type: Array,
    default: () => [],
  },
  isLoadingTopics: {
    type: Boolean,
    default: false,
  },
  hasData: {
    type: Boolean,
    default: false,
  },
  entityTypes: {
    type: Array,
    default: () => [],
  },
  relationshipTypes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "delete-domain",
  "add-domain",
  "domain-click",
  "sub-domain-click",
  "back-to-domains",
  "back-to-sub-domains",
  "open-add-dialog",
  "open-add-topic-dialog",
  "search",
  "search-icon-click",
  "topic-search-icon-click",
  "select-search-item",
  "drag-start",
  "drag-end",
  "create-graph-click",
  "graph-click",
  "edit-graph",
  "delete-graph",
  "add-topic",
  "delete-topic",
  "topic-search",
  "clear-domain-history",
  "clear-topic-history",
]);

const localSearchQuery = ref("");
const isSearchFocused = ref(false);

// 监听页面切换，清空搜索框内容
watch(
  () => [props.currentDomain, props.currentSubDomain],
  () => {
    localSearchQuery.value = "";
  },
);

// 监听搜索结果变化，确保下拉框显示更新后的数据
watch([() => props.searchOptions, () => props.topicSearchOptions], () => {
  // 如果搜索框是聚焦状态，保持下拉框显示
  if (isSearchFocused.value) {
    // 不需要做任何操作，因为下拉框的显示条件已经包含了 isSearchFocused
  }
});

const handleDeleteDomain = (id) => {
  emit("delete-domain", id);
};

const openAddDialog = () => {
  emit("open-add-dialog");
};

const openAddTopicDialog = () => {
  emit("open-add-topic-dialog");
};

const handleDeleteTopic = (id) => {
  emit("delete-topic", id);
};

const handleTopicSearch = (query) => {
  emit("topic-search", query);
};

const handleSearch = (query) => {
  emit("search", query);
};

// 搜索图标点击事件
const handleSearchClick = () => {
  // 点击搜索图标时，确保下拉框消失
  isSearchFocused.value = false;
  emit("search-icon-click", localSearchQuery.value);
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};

// 专题搜索图标点击事件
const handleTopicSearchClick = () => {
  // 点击搜索图标时，确保下拉框消失
  isSearchFocused.value = false;
  emit("topic-search-icon-click", localSearchQuery.value);
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};

// 清空领域搜索历史
const handleClearDomainHistory = () => {
  emit("clear-domain-history");
  // 清空后保持下拉框显示
  setTimeout(() => {
    isSearchFocused.value = true;
  }, 0);
};

// 清空专题搜索历史
const handleClearTopicHistory = () => {
  emit("clear-topic-history");
  // 清空后保持下拉框显示
  setTimeout(() => {
    isSearchFocused.value = true;
  }, 0);
};

const selectSearchItem = (value) => {
  localSearchQuery.value = value;
  // 确保下拉框消失
  isSearchFocused.value = false;
  emit("select-search-item", value);
};

const handleSearchFocus = () => {
  isSearchFocused.value = true;
  // 根据当前是否在专题页面决定调用哪个搜索函数
  if (props.currentDomain) {
    handleTopicSearch(localSearchQuery.value);
  } else {
    handleSearch(localSearchQuery.value);
  }
};

const handleSearchBlur = () => {
  // 延迟隐藏下拉框，以便点击下拉项时能够触发选择事件
  setTimeout(() => {
    isSearchFocused.value = false;
  }, 200);
};

const handleDomainClick = (domain) => {
  emit("domain-click", domain);
};

const handleBackToDomains = () => {
  emit("back-to-domains");
};

const handleBackToSubDomains = () => {
  emit("back-to-sub-domains");
};

const handleSubDomainClick = (subDomain) => {
  emit("sub-domain-click", subDomain);
};

const handleDragStart = (event, type, item) => {
  emit("drag-start", event, type, item);
};

const handleDragEnd = (event) => {
  emit("drag-end", event);
};

// 处理创建图谱点击
const handleCreateGraphClick = () => {
  emit("create-graph-click");
};

// 处理图谱点击
const handleGraphClick = (graph) => {
  emit("graph-click", graph);
};

// 处理编辑图谱
const handleEditGraph = (graph) => {
  emit("edit-graph", graph);
};

// 处理删除图谱
const handleDeleteGraph = (id) => {
  emit("delete-graph", id);
};

// 搜索框清空事件处理
const handleSearchClear = () => {
  // 点击删除图标时，确保下拉框消失
  isSearchFocused.value = false;
  // 清空搜索框内容
  localSearchQuery.value = "";
  // 调用搜索图标点击事件，获取所有领域列表
  handleSearchClick();
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};

// 专题搜索框清空事件处理
const handleTopicSearchClear = () => {
  // 点击删除图标时，确保下拉框消失
  isSearchFocused.value = false;
  // 清空搜索框内容
  localSearchQuery.value = "";
  // 调用专题搜索图标点击事件，获取所有专题
  handleTopicSearchClick();
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};
</script>

<style scoped lang="scss">
.sidebar {
  width: 280px;
  background-color: white;
  padding: 24px 24px 35px 24px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  box-shadow: 1px 0px 0px 0px rgba(229, 230, 235, 1);
  border-right: 1px solid #eee;

  .all-option-icon {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    vertical-align: top;
  }
}

.sub-domain-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.plusIcon {
  margin-right: 10px;
  color: #999;
}

.el-button:hover .plusIcon {
  color: #fff;
}

.all-option {
  margin-bottom: 15px;
  font-weight: 400;
  font-size: 14px;
  color: #303234;
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
}

.breadcrumb-item {
  font-size: 14px;
  color: #555353;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 5px;
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
}

.cursor-pointer {
  cursor: pointer;
  color: #999999;
  font-size: 14px;
  font-weight: 400;
}

.cursor-pointer:hover {
  text-decoration: underline;
}

/* 搜索框 */
.search-box {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed rgba(238, 238, 238, 1);

  ::v-deep .el-input__inner {
    font-size: 14px;
    color: #333;
  }
}

.search-container {
  position: relative;
  width: 100%;
}

.search-container:has(.search-dropdown) ::v-deep .el-input__wrapper {
  border-top-color: rgba(61, 210, 176, 1);
  border-left-color: rgba(61, 210, 176, 1);
  border-right-color: rgba(61, 210, 176, 1);
  background: #fff;
  border-radius: 4px 4px 0px 0px;
}

.search-input {
  width: 100%;
  height: 40px;
}

::v-deep .el-input__wrapper {
  background: #f8fcff;
  border: 1px solid rgba(236, 241, 244, 1);
  border-radius: 4px;
  box-shadow: none;
}

::v-deep .el-input .el-input__icon {
  font-size: 19px;
}

.search-icon {
  font-size: 19px;
  cursor: pointer;
  color: #909399;
  transition: color 0.3s;
}

.search-icon:hover {
  color: rgba(61, 210, 176, 1);
}

/* 历史搜索下拉框 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 0.5px solid rgba(61, 210, 176, 1);
  border-top: none;
  box-shadow: 0px 8px 10px 0px rgba(78, 89, 105, 0.18);
  border-radius: 0px 0px 4px 4px;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  box-sizing: border-box;
  padding-top: 8px;
  padding-bottom: 10px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px 8px 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 4px;
}

.dropdown-title {
  font-size: 12px;
  color: #999;
}

.clear-history {
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
}

.clear-history:hover {
  text-decoration: underline;
}

.search-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #333;
}

.search-item:hover {
  background-color: rgba(61, 210, 176, 0.1);
}

.search-item.disabled {
  color: #999;
  cursor: default;
  text-align: center;
  justify-content: center;
}

.search-item.disabled:hover {
  background-color: transparent;
}

.history-icon {
  margin-right: 8px;
  font-size: 12px;
  color: #999;
}

/* 高亮样式 */
.highlight {
  color: #3dd2b0 !important;
}

/* 领域列表 */
.domain-list {
  flex: 1;
  border-radius: 4px;
  padding: 2px 0;
  margin-bottom: 15px;
  overflow-y: auto;
}

.domain-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 3px 9px 12px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 2px solid rgba(224, 226, 235, 0.7);
  border-radius: 4px;
  transition: all 0.3s;
}

.domain-info i {
  display: none;
  color: transparent;
  margin-right: 0;
}

.domain-item:hover {
  border: 2px solid rgba(61, 210, 176, 0.6);
  cursor: pointer;
}

.domain-item .domain-info span {
  font-size: 16px;
  color: #333333;
  font-weight: 400;
}

.domain-item:hover .domain-info span {
  font-size: 16px;
  color: #555353;
  font-weight: 600;
}

.domain-item:hover .arrow-icon {
  color: rgba(61, 210, 176, 1);
}

.domain-info {
  display: flex;
  align-items: center;
}

.domain-info i {
  margin-right: 8px;
  font-size: 14px;
  color: rgba(61, 210, 176, 1);
}

.domain-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.domain-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s;
  width: 0;
  overflow: hidden;
}

.domain-item:hover .domain-actions {
  opacity: 1;
  width: 24px;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  padding: 0;
}

.delete-btn img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.add-btn {
  margin-top: auto;
}

.add-btn .el-button {
  width: 100%;
  transition: all 0.3s;
  border: 1px dashed rgba(213, 215, 222, 1);
  background: #fff;
  border-radius: 5px;
  font-size: 14px;
  color: #999999;
  height: 40px;
  line-height: 40px;
}

.add-btn .el-button:hover {
  background: #43d7b5;
  box-shadow: 0px 15px 30px -10px rgba(67, 215, 181, 0.55);
  border-color: #43d7b5;
  color: #fff;
}

/* 数据列表 */
.data-section {
  margin-bottom: 20px;
}

.data-section h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.entity-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.entity-type-item {
  padding: 6px 10px;
  background-color: #f0f9eb;
  border: 1px solid rgba(61, 210, 176, 1);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(61, 210, 176, 1);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.entity-type-item:hover {
  background-color: rgba(61, 210, 176, 1);
  color: white;
}

.relationship-types {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relationship-type-item {
  padding: 6px 10px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.relationship-type-item::before {
  content: "";
  width: 16px;
  height: 16px;
  background-image: url("@/assets/images/复制.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.relationship-type-item:hover {
  background-color: #e6f7df;
  border-color: rgba(61, 210, 176, 1);
  color: rgba(61, 210, 176, 1);
}

/* 组件库 */
.component-library {
  margin-bottom: 20px;
}

.component-library h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.component-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.component-item:hover {
  border-color: rgba(61, 210, 176, 1);
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.add-component-btn {
  width: 20px;
  height: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.add-component-btn:hover {
  background-color: rgba(61, 210, 176, 1);
  color: white;
  border-color: rgba(61, 210, 176, 1);
}

/* 图谱列表 */
.graph-list {
  flex: 1;
  padding: 10px;
  margin-bottom: 15px;
  overflow-y: auto;
}

/* 搜索框 */
.search-container {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  border-radius: 4px;
}

.graph-items {
  margin-bottom: 15px;
}

.graph-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s;
}

.graph-item:hover {
  border-color: rgba(61, 210, 176, 1);
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.graph-info {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.graph-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.edit-btn:hover {
  color: #409eff;
}

.create-graph-btn-container {
  margin-top: 20px;
}

.create-graph-btn-container .el-button {
  width: 100%;
  border-radius: 4px;
  padding: 8px 12px;
}

/* 空的列表 */
.empty-list {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  margin-bottom: 15px;
}

.list-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #909399;
}

.list-placeholder i {
  font-size: 24px;
  margin-bottom: 8px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.loading-icon {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #43d7b5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
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
  .sidebar {
    width: 280px;
    padding: 10px;
  }
}
</style>

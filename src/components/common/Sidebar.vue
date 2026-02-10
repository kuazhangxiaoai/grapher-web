<template>
  <aside class="sidebar">
    <!-- 面包屑导航 -->
    <div class="breadcrumb" v-if="currentSubDomain">
      <el-icon><Menu /></el-icon>
      <span
        @click="handleBackToDomains"
        class="breadcrumb-item cursor-pointer"
        >{{ allOption }}</span
      >
      <span class="breadcrumb-separator">></span>
      <span
        @click="handleBackToSubDomains"
        class="breadcrumb-item cursor-pointer"
        >{{ currentDomain }}</span
      >
      <span class="breadcrumb-separator">></span>
      <span class="breadcrumb-item">{{ currentSubDomain }}</span>
    </div>
    <div class="breadcrumb" v-else-if="currentDomain">
      <span
        @click="handleBackToDomains"
        class="breadcrumb-item cursor-pointer"
        >{{ allOption }}</span
      >
      <span class="breadcrumb-separator">></span>
      <span class="breadcrumb-item">{{ currentDomain }}</span>
    </div>
    <div class="all-option" v-else>
      <span>{{ allOption }}</span>
    </div>
    <div class="search-box" v-if="!currentSubDomain || currentSubDomain">
      <div class="search-container">
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
        <!-- 搜索结果下拉框 -->
        <div
          v-if="
            searchOptions.length > 0 && (localSearchQuery || isSearchFocused)
          "
          class="search-dropdown"
        >
          <div
            v-for="item in searchOptions"
            :key="item.value"
            class="search-item"
            @click="selectSearchItem(item.value)"
          >
            <template v-if="localSearchQuery">
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
      <div
        v-for="domain in domains"
        :key="domain.id"
        class="domain-item"
        @click="handleDomainClick(domain)"
      >
        <div class="domain-info">
          <i :class="domain.icon"></i>
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
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- 子领域列表 -->
    <div class="domain-list" v-else-if="!currentSubDomain">
      <div
        v-for="(subDomain, index) in subDomains"
        :key="index"
        class="domain-item"
        @click="handleSubDomainClick(subDomain)"
      >
        <div class="domain-info">
          <span>{{ subDomain.name }}</span>
          <span v-if="subDomain.count > 0" class="entity-count">{{
            subDomain.count
          }}</span>
        </div>
        <div class="domain-icons">
          <img class="arrow-icon" src="@/assets/images/复制.png" alt="arrow" />
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
            :suffix-icon="Search"
          />
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
        <div class="create-graph-btn-container">
          <el-button
            type="primary"
            size="small"
            plain
            @click="handleCreateGraphClick"
          >
            <i class="el-icon-plus"></i> 新建图谱
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
    <div class="add-btn" v-if="!currentSubDomain">
      <el-button type="success" size="small" @click="openAddDialog">
        <i class="el-icon-plus"></i>
        {{ currentDomain ? "新增专题" : "新增领域" }}
      </el-button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from "vue";
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
  graphs: {
    type: Array,
    default: () => [],
  },
  searchOptions: {
    type: Array,
    default: () => [],
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
  "search",
  "select-search-item",
  "drag-start",
  "drag-end",
  "create-graph-click",
  "graph-click",
  "edit-graph",
  "delete-graph",
]);

const localSearchQuery = ref("");
const isSearchFocused = ref(false);

const handleDeleteDomain = (id) => {
  emit("delete-domain", id);
};

const openAddDialog = () => {
  emit("open-add-dialog");
};

const handleSearch = (query) => {
  emit("search", query);
};

const selectSearchItem = (value) => {
  localSearchQuery.value = value;
  isSearchFocused.value = false;
  emit("select-search-item", value);
};

const handleSearchFocus = () => {
  isSearchFocused.value = true;
  handleSearch(localSearchQuery.value);
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
</script>

<style scoped lang="scss">
.sidebar {
  width: 280px;
  background-color: white;
  padding: 20px 15px;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  .el-icon {
    margin-right: 10px;
    color: var(--color);
    display: inline-flex;
    fill: currentColor;
    font-size: 18px;
    // height: 1em;
    // justify-content: center;
    // line-height: 1em;
    // position: relative;
    // width: 1em;
  }
}

.all-option {
  margin-bottom: 15px;
  font-weight: 500;
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
}

.breadcrumb-item {
  margin-right: 5px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 5px;
  color: #909399;
}

.cursor-pointer {
  cursor: pointer;
  color: #999999;
  font-size: 14px;
}

.cursor-pointer:hover {
  text-decoration: underline;
}

/* 搜索框 */
.search-box {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed rgba(238, 238, 238, 1);
}

.search-container {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;

  height: 40px;
}
::v-deep .el-input__wrapper {
  background: #f8fcff;
  border: 1px solid rgba(236, 241, 244, 0.5);
  border-radius: 4px;
}
::v-deep .el-input .el-input__icon {
  font-size: 18px;
}
/* 搜索结果下拉框 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.search-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.search-item:hover {
  background-color: #f0f9eb;
}

/* 高亮样式 */
.highlight {
  color: rgba(61, 210, 176, 1) !important;
  font-weight: bold;
}

/* 领域列表 */
.domain-list {
  flex: 1;
  // border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  overflow-y: auto;
}

.domain-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 1px solid rgba(198, 202, 220, 0.6);
  border-radius: 4px;
  transition: all 0.3s;
}
.domain-info i {
  display: none;
  color: transparent;
  margin-right: 0;
}
.domain-item:hover {
  border: 1px solid rgba(61, 210, 176, 1);
  // box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
  cursor: pointer;
}

.domain-item:hover .domain-info span {
  font-size: 16px;
  color: #333333;
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
  gap: 8px;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.domain-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s;
}

.domain-item:hover .domain-actions {
  opacity: 1;
}

.delete-btn {
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

.delete-btn:hover {
  background-color: #f56c6c;
  color: white;
  border-color: #f56c6c;
}

.add-btn {
  margin-top: auto;
}

.add-btn .el-button {
  width: 100%;
  transition: all 0.3s;
}

.add-btn .el-button:hover {
  background-color: #85ce61;
  border-color: #85ce61;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
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

/* 实体数量 */
.entity-count {
  margin-left: 8px;
  font-size: 12px;
  color: rgba(61, 210, 176, 1);
  background-color: #f0f9eb;
  padding: 2px 6px;
  border-radius: 10px;
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

.delete-btn {
  width: 20px;
  height: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  color: #909399;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.delete-btn:hover {
  background-color: #f56c6c;
  color: white;
  border-color: #f56c6c;
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

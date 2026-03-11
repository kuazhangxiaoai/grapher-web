<template>
  <aside class="sidebar" @clear-selections="handleClearSelections">
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
          <!-- <div class="dropdown-header">
            <span class="dropdown-title">历史搜索</span>
            <span
              v-if="searchOptions.length > 0 && !searchOptions[0].disabled"
              class="clear-history"
              @click.stop="handleClearDomainHistory"
            >
              清空
            </span>
          </div> -->
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
      <div v-if="isLoadingDomains" class="loading-container">
        <div class="loading-icon"></div>
        <span class="loadings">加载中...</span>
      </div>
      <div v-else-if="domains.length === 0" class="empty-state">
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
          <img
            class="arrow-icon"
            src="@/assets/images/复制.png"
            alt="arrow"
            @click.stop="handleCopyDomain(domain.id)"
            title="复制"
          />
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
            <!-- <div class="dropdown-header">
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
            </div> -->
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
          <span class="loadings">加载中...</span>
        </div>
        <div v-else-if="topics.length === 0" class="empty-state">
          <span>暂无数据</span>
        </div>
        <div
          v-else
          v-for="(topic, index) in topics"
          :key="topic.id"
          class="domain-item"
          @click="handleTopicClick(topic)"
        >
          <div class="domain-info">
            <span>{{ topic.name }}</span>
          </div>
          <div class="domain-icons">
            <img
              class="arrow-icon"
              src="@/assets/images/复制.png"
              alt="arrow"
              @click.stop="handleCopyTopic(topic.id)"
              title="复制"
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
    <div v-else style="flex: 1; overflow: hidden">
      <!-- 图谱构建模式 -->
      <div v-if="currentMode === 'graph'" class="graph-container">
        <!-- 搜索框 -->
        <div class="search-container" v-if="!props.activeGraphItem">
          <el-input
            v-model="localSearchQuery"
            placeholder="搜索图谱"
            class="search-input"
            clearable
            @input="handleGraphSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            @clear="handleGraphSearchClear"
          >
            <template #suffix>
              <el-icon
                @click.stop="handleGraphSearchClick"
                @mousedown.prevent
                class="search-icon"
              >
                <Search />
              </el-icon>
            </template>
          </el-input>
          <!-- 历史搜索下拉框 -->
          <div
            v-if="graphSearchOptions.length > 0 && isSearchFocused"
            class="search-dropdown"
          >
            <!-- <div class="dropdown-header">
              <span class="dropdown-title">历史搜索</span>
              <span
                v-if="graphSearchOptions.length > 0 && !graphSearchOptions[0].disabled"
                class="clear-history"
                @click.stop="handleClearGraphHistory"
              >
                清空
              </span>
            </div> -->
            <div
              v-for="item in graphSearchOptions"
              :key="item.value"
              class="search-item"
              :class="{ disabled: item.disabled }"
              @click="!item.disabled && selectSearchItem(item.value)"
            >
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

        <!-- 图谱项目 -->
        <div v-if="!props.activeGraphItem" class="graph-items">
          <div v-if="isLoadingGraphs" class="loading-container">
            <div class="loading-icon"></div>
            <span class="loadings">加载中...</span>
          </div>
          <div v-else-if="graphs && graphs.length > 0">
            <div
              v-for="graph in graphs"
              :key="graph.id"
              class="graph-item"
              :class="{
                'graph-item-active':
                  String(props.activeGraphItem) === String(graph.id),
              }"
              @click="handleGraphClick(graph)"
            >
              <div class="graph-info">
                <span>{{ graph.name }}</span>
              </div>
              <div class="graph-actions">
                <img
                  src="@/assets/images/编辑.png"
                  alt="arrow"
                  class="arrow-icon"
                  @click.stop="handleEditGraph(graph)"
                  title="编辑"
                />
                <button
                  class="delete-btn"
                  @click.stop="handleDeleteGraph(graph.id)"
                  title="删除"
                >
                  <img src="@/assets/images/矩形.png" alt="delete" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-list">
            <div class="list-placeholder">
              <img
                src="@/assets/images/Frame.png"
                alt="empty"
                class="empty-icon"
              />
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
              <el-icon class="plusIcon"><Plus /></el-icon>新建图谱</el-button
            >
          </div>
        </div>
        <!-- 图谱详情页面 -->
        <div v-else class="sub-sub-domain-container">
          <!-- 图谱名称 -->
          <div class="graph-name-container">
            <div class="graph-name-left">
              <img src="@/assets/images/内容.png" alt="" />
              <h2 class="graph-name">
                {{
                  graphs.find(
                    (g) => String(g.id) === String(props.activeGraphItem),
                  )?.name
                }}
              </h2>
            </div>
            <button class="back-btn" @click="handleBackToGraphList">
              <img src="@/assets/images/返回.png" alt="返回" />
            </button>
          </div>
          <!-- 数据列表 -->
          <div class="data-list-container">
            <!-- 实体类型 -->
            <div class="data-section">
              <h3>实体类型</h3>
              <div
                class="entity-types"
                :class="{ 'empty-data': entityTypes.length === 0 }"
              >
                <span class="empty-data-msg" v-if="entityTypes.length === 0"
                  >暂无实体类型</span
                >
                <div
                  v-for="(type, index) in entityTypes"
                  :key="index"
                  class="entity-type-item"
                  :class="{
                    'entity-type-item-selected': selectedEntityType === type,
                  }"
                  draggable="true"
                  @dragstart="
                    handleDragStart($event, 'entity', {
                      name: type,
                      nodeTemplateId: 0,
                    })
                  "
                  @dragend="handleDragEnd"
                  @click="handleEntityTypeClick(type)"
                >
                  {{ type }}
                </div>
              </div>
            </div>

            <!-- 关系类型 -->
            <div class="data-section">
              <h3>关系类型</h3>
              <div class="relationship-types">
                <span
                  class="empty-data-msg"
                  v-if="relationTemplates.length === 0"
                  >暂无关系类型</span
                >
                <div
                  v-for="template in relationTemplates"
                  :key="template.relationTemplateId"
                  class="relationship-type-item"
                  :class="{
                    'relationship-type-item-selected':
                      selectedRelationshipType ===
                      template.relationTemplateName,
                  }"
                  draggable="true"
                  @dragstart="
                    handleDragStart(
                      $event,
                      'relationship',
                      template.relationTemplateName,
                    )
                  "
                  @dragend="handleDragEnd"
                  @click="
                    handleRelationshipTypeClick(template.relationTemplateName)
                  "
                >
                  <div
                    class="relationship-icon"
                    :class="{
                      'relationship-icon-directed':
                        template.relationTemplateType === '1',
                      'relationship-icon-bidirectional':
                        template.relationTemplateType === '2',
                      'relationship-icon-loop':
                        template.relationTemplateType === '3',
                    }"
                  ></div>
                  {{ template.relationTemplateName }}
                </div>
              </div>
            </div>
            <!-- <div class="graphMessage">
              <div>提示：</div>
              <div>可通过拖拽形式创建节点</div>
            </div> -->
          </div>
        </div>
      </div>

      <!-- 本体设计模式 -->
      <div v-else class="sub-sub-domain-container">
        <!-- 加载状态 -->
        <div class="graph-list" v-if="isLoadingTemplates">
          <!-- 加载中状态 -->
          <div class="loading-container">
            <div class="loading-icon"></div>
            <span class="loadings">加载中...</span>
          </div>
        </div>
        <!-- 空状态 -->
        <div
          class="graph-list"
          v-else-if="entityTypes.length === 0 && relationshipTypes.length === 0"
        >
          <!-- 空状态 -->
          <div class="empty-list">
            <div class="list-placeholder">
              <img
                src="@/assets/images/Frame.png"
                alt="empty"
                class="empty-icon"
              />
              <span>白板中暂无容器</span>
            </div>
          </div>
        </div>

        <!-- 数据列表 当用于本体设计时，这个当作是工具面板。当用于图谱构建模块时，这个当作项目（文章）的三级列表-->
        <div v-else class="data-list-container">
          <!-- 实体类型 -->
          <div class="data-section">
            <h3>实体模板</h3>
            <div
              class="entity-types"
              :class="{ 'empty-data': entityTypes.length === 0 }"
            >
              <span class="empty-data-msg" v-if="entityTypes.length === 0"
                >暂无实体模板</span
              >
              <div
                v-for="(type, index) in entityTypes"
                :key="index"
                class="entity-type-item"
                :class="{
                  'entity-type-item-selected': selectedEntityType === type,
                }"
                draggable="true"
                @dragstart="
                  handleDragStart($event, 'entity', {
                    name: type,
                    nodeTemplateId: 0,
                  })
                "
                @dragend="handleDragEnd"
                @click="handleEntityTypeClick(type)"
              >
                {{ type }}
              </div>
            </div>
          </div>

          <!-- 关系类型 -->
          <div class="data-section">
            <h3>关系模板</h3>
            <div class="relationship-types">
              <span class="empty-data-msg" v-if="relationTemplates.length === 0"
                >暂无关系模板</span
              >
              <div
                v-for="template in relationTemplates"
                :key="template.relationTemplateId"
                class="relationship-type-item"
                :class="{
                  'relationship-type-item-selected':
                    selectedRelationshipType === template.relationTemplateName,
                }"
                draggable="true"
                @dragstart="
                  handleDragStart(
                    $event,
                    'relationship',
                    template.relationTemplateName,
                  )
                "
                @dragend="handleDragEnd"
                @click="
                  handleRelationshipTypeClick(template.relationTemplateName)
                "
              >
                <div
                  class="relationship-icon"
                  :class="{
                    'relationship-icon-directed':
                      template.relationTemplateType === '1',
                    'relationship-icon-bidirectional':
                      template.relationTemplateType === '2',
                    'relationship-icon-loop':
                      template.relationTemplateType === '3',
                  }"
                ></div>
                {{ template.relationTemplateName }}
              </div>
            </div>
          </div>
        </div>

        <!-- 组件库 -->
        <div class="component-library">
          <div class="component-library-header">
            <img
              src="@/assets/images/filter_list.png"
              alt="组件库"
              class="component-library-icon"
            />
            <h3>组件库</h3>
          </div>
          <el-input
            v-model="localSearchQuery"
            placeholder="搜索"
            class="search-input"
            clearable
            @input="handleSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            @clear="handleComponentSearchClear"
          >
            <template #suffix>
              <el-icon
                @click.stop="handleComponentSearchClick"
                @mousedown.prevent
                class="search-icon"
              >
                <Search />
              </el-icon>
            </template>
          </el-input>
          <div class="component-list">
            <div v-if="isLoadingComponents" class="loading-container">
              <div class="loading-icon"></div>
              <span class="loadings">加载中...</span>
            </div>
            <div v-else-if="props.components.length === 0" class="empty-state">
              <span class="loadings">暂无组件</span>
            </div>
            <div
              v-else
              v-for="component in props.components"
              :key="component.nodeTemplateId || component.relationTemplateId"
              class="component-item"
              :class="{
                'component-item-highlight':
                  localSearchQuery &&
                  (
                    component.nodeTemplateName || component.relationTemplateName
                  ).includes(localSearchQuery),
                'component-item-selected':
                  selectedComponent ===
                  (component.nodeTemplateName ||
                    component.relationTemplateName),
                'component-item-relationship': !component.nodeTemplateId,
              }"
              draggable="true"
              @dragstart="
                handleDragStart(
                  $event,
                  component.nodeTemplateId ? 'entity' : 'relationship',
                  component,
                )
              "
              @dragend="handleDragEnd"
              @click="
                handleComponentClick(
                  component.nodeTemplateName || component.relationTemplateName,
                )
              "
            >
              <div class="component-name">
                <div
                  v-if="!component.nodeTemplateId"
                  class="component-relationship-icon"
                  :class="{
                    'component-icon-directed':
                      component.relationTemplateType === '1',
                    'component-icon-bidirectional':
                      component.relationTemplateType === '2',
                    'component-icon-loop':
                      component.relationTemplateType === '3',
                  }"
                ></div>
                {{
                  component.nodeTemplateName || component.relationTemplateName
                }}
              </div>
              <button
                class="add-component-btn"
                @click.stop="handleAddComponentToEntityType(component)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="add-btn" v-if="!currentSubDomain && currentMode === 'ontology'">
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

  <!-- 复制重命名弹窗 -->
  <el-dialog v-model="copyDialogVisible" :title="copyDialogTitle" width="500px">
    <el-form :model="copyForm" label-width="100px" style="padding: 30px 0">
      <el-form-item :label="copyType === 'domain' ? '领域名称' : '专题名称'">
        <el-input
          v-model="copyForm.name"
          :placeholder="
            copyType === 'domain' ? '请输入领域名称' : '请输入专题名称'
          "
          style="width: 100%; height: 45px"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="copyDialogVisible = false"
          >取消</el-button
        >
        <el-button class="confirm-btn" @click="handleCopyConfirm"
          >确定</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { Search, Plus } from "@element-plus/icons-vue";
import { string } from "three/tsl";

// 复制重命名弹窗相关
const copyDialogVisible = ref(false);
const copyDialogTitle = ref("");
const copyForm = ref({ name: "" });
const copyId = ref("");
const copyType = ref(""); // 'domain' or 'topic'

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
  currentMode: {
    type: String,
    default: "ontology", // 'ontology' or 'graph'
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
  graphSearchOptions: {
    type: Array,
    default: () => [],
  },
  isLoadingDomains: {
    type: Boolean,
    default: false,
  },
  isLoadingTopics: {
    type: Boolean,
    default: false,
  },
  isLoadingGraphs: {
    type: Boolean,
    default: false,
  },
  isLoadingTemplates: {
    type: Boolean,
    default: false,
  },
  isLoadingComponents: {
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
  relationTemplates: {
    type: Array,
    default: () => [],
  },
  components: {
    type: Array,
    default: () => [],
  },
  activeGraphItem: {
    type: String,
    default: "",
  },
});

// Use components from props directly

const emit = defineEmits([
  "delete-domain",
  "add-domain",
  "domain-click",
  "sub-domain-click",
  "topic-click",
  "back-to-domains",
  "back-to-sub-domains",
  "open-add-dialog",
  "open-add-topic-dialog",
  "open-add-graph-dialog",
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
  "graph-search",
  "graph-search-icon-click",
  "clear-graph-history",
  "add-entity-type",
  "entity-type-click",
  "relationship-type-click",
  "component-click",
  "component-library-search",
  "add-component-to-model",
  "copy-domain",
  "copy-topic",
  "clear-selections",
]);

const localSearchQuery = ref("");
const isSearchFocused = ref(false);

// 选中状态
const selectedEntityType = ref("");
const selectedRelationshipType = ref("");
const selectedComponent = ref(null);

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

const handleCopyDomain = (id) => {
  copyId.value = id;
  copyType.value = "domain";
  copyDialogTitle.value = "复制领域";
  copyForm.value.name = "";
  copyDialogVisible.value = true;
};

const openAddDialog = () => {
  emit("open-add-dialog");
};

const handleCopyTopic = (id) => {
  copyId.value = id;
  copyType.value = "topic";
  copyDialogTitle.value = "复制专题";
  copyForm.value.name = "";
  copyDialogVisible.value = true;
};

const handleCopyConfirm = () => {
  if (copyForm.value.name.trim()) {
    if (copyType.value === "domain") {
      emit("copy-domain", copyId.value, copyForm.value.name);
    } else if (copyType.value === "topic") {
      emit("copy-topic", copyId.value, copyForm.value.name);
    }
    copyDialogVisible.value = false;
  }
};

const openAddTopicDialog = () => {
  emit("open-add-topic-dialog");
};

const openAddGraphDialog = () => {
  emit("open-add-graph-dialog");
};

const handleDeleteTopic = (id) => {
  emit("delete-topic", id);
};

const handleTopicSearch = (query) => {
  emit("topic-search", query);
};

const handleSearch = (query) => {
  // Check if we're in the component library context
  if (props.currentMode === "ontology" && props.currentSubDomain) {
    emit("component-library-search", query);
  } else {
    emit("search", query);
  }
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

// 图谱搜索处理
const handleGraphSearch = (query) => {
  emit("graph-search", query);
};

// 图谱搜索图标点击事件
const handleGraphSearchClick = () => {
  // 点击搜索图标时，确保下拉框消失
  isSearchFocused.value = false;
  emit("graph-search-icon-click", localSearchQuery.value);
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};

// 清空图谱搜索历史
const handleClearGraphHistory = () => {
  emit("clear-graph-history");
  // 清空后保持下拉框显示
  setTimeout(() => {
    isSearchFocused.value = true;
  }, 0);
};

// 图谱搜索框清空事件处理
const handleGraphSearchClear = () => {
  // 点击删除图标时，确保下拉框消失
  isSearchFocused.value = false;
  // 清空搜索框内容
  localSearchQuery.value = "";
  // 调用图谱搜索图标点击事件，获取所有图谱列表
  handleGraphSearchClick();
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
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
  // 根据当前模式决定调用哪个搜索函数
  if (props.currentMode === "graph") {
    handleGraphSearch(localSearchQuery.value);
  } else if (props.currentDomain) {
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

const handleTopicClick = (topic) => {
  emit("topic-click", topic);
};

const handleAddComponentToEntityType = (component) => {
  emit("add-component-to-model", component);
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

const handleBackToGraphList = () => {
  emit("back-to-sub-GraphList");
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

// 处理实体类型点击
const handleEntityTypeClick = (entityType) => {
  selectedEntityType.value = entityType;
  selectedRelationshipType.value = "";
  selectedComponent.value = null;
  emit("entity-type-click", entityType);
};

// 处理关系类型点击
const handleRelationshipTypeClick = (relationshipType) => {
  selectedRelationshipType.value = relationshipType;
  selectedEntityType.value = "";
  selectedComponent.value = null;
  emit("relationship-type-click", relationshipType);
};

// 处理组件点击
const handleComponentClick = (componentName) => {
  selectedComponent.value = componentName;
  selectedEntityType.value = "";
  selectedRelationshipType.value = "";
  emit("component-click", componentName);
};

// 组件库搜索图标点击事件
const handleComponentSearchClick = () => {
  // 点击搜索图标时，确保下拉框消失
  isSearchFocused.value = false;
  emit("component-library-search", localSearchQuery.value);
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};

// 组件库搜索框清空事件处理
const handleComponentSearchClear = () => {
  // 点击删除图标时，确保下拉框消失
  isSearchFocused.value = false;
  // 清空搜索框内容
  localSearchQuery.value = "";
  // 调用组件库搜索图标点击事件，获取所有组件
  handleComponentSearchClick();
  // 确保输入框失去焦点
  setTimeout(() => {
    const inputElements = document.querySelectorAll(".search-input input");
    inputElements.forEach((input) => {
      input.blur();
    });
  }, 0);
};

// 监听清除选中状态事件
const handleClearSelections = () => {
  selectedEntityType.value = "";
  selectedRelationshipType.value = "";
  selectedComponent.value = null;
  console.log("清除所有选中状态");
};

defineExpose({
  handleClearSelections,
  setSelectedEntityType: (entityType) => {
    selectedEntityType.value = entityType;
    selectedRelationshipType.value = "";
    selectedComponent.value = null;
    console.log("设置实体类型选中状态:", entityType);
  },
  setSelectedRelationshipType: (relationshipType) => {
    selectedRelationshipType.value = relationshipType;
    selectedEntityType.value = "";
    selectedComponent.value = null;
    console.log("设置关系类型选中状态:", relationshipType);
  },
  setSelectedComponent: (componentName) => {
    selectedComponent.value = componentName;
    selectedEntityType.value = "";
    selectedRelationshipType.value = "";
    console.log("设置组件选中状态:", componentName);
  },
});
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
  overflow: hidden;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
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
  padding: 2px 6px 2px 0px;
  margin-bottom: 15px;
  overflow-y: auto;
  box-sizing: border-box;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.domain-item:hover .domain-info span {
  font-size: 16px;
  color: #555353;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
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
.graph-addBtn {
  // height: 80px;
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
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.entity-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  overflow-y: auto;
  max-height: 200px;
  padding-right: 8px;
}
.empty-data {
  grid-template-columns: none;
}
.entity-type-item {
  padding: 8px 9px 8px 12px;
  background: #f6fcff;
  border: 0.8px solid rgba(224, 226, 235, 1);
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-type-item:hover,
.entity-type-item-selected {
  // background-color: rgba(61, 210, 176, 1);
  // color: white;
  border-color: rgba(61, 210, 176, 1);
  color: rgba(61, 210, 176, 1);
}

.relationship-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 200px;
  padding-right: 8px;
}

.relationship-type-item {
  padding: 8px 10px;
  background: #ffffff;
  border: 0.8px solid rgba(224, 226, 235, 1);
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.relationship-icon {
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.relationship-icon-directed {
  background-image: url("@/assets/images/单向.png");
}

.relationship-icon-bidirectional {
  width: 18px;
  height: 20px;
  background-image: url("@/assets/images/双向.png");
}

.relationship-icon-loop {
  background-image: url("@/assets/images/循环.png");
}

.relationship-type-item:hover .relationship-icon-directed,
.relationship-type-item-selected .relationship-icon-directed {
  background-image: url("@/assets/images/单向选中.png");
}

.relationship-type-item:hover .relationship-icon-bidirectional,
.relationship-type-item-selected .relationship-icon-bidirectional {
  width: 18px;
  height: 20px;
  background-image: url("@/assets/images/双向选中.png");
}

.relationship-type-item:hover .relationship-icon-loop,
.relationship-type-item-selected .relationship-icon-loop {
  background-image: url("@/assets/images/循环选中.png");
}

.relationship-type-item:hover,
.relationship-type-item-selected {
  border-color: rgba(61, 210, 176, 1);
  color: rgba(61, 210, 176, 1);
}

/* 组件库 */
.component-library {
  padding-top: 20px;
  // margin-bottom: 20px;
  border-top: 1px solid rgba(238, 238, 238, 1);
}
.component-library-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 18px;
}
.component-library-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.component-library h3 {
  font-size: 14px;
  font-weight: 400;
  color: #303234;
}
.component-list {
  overflow-y: auto;
  max-height: 110px;
  padding-right: 8px;
}
.component-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-top: 12px;
  border-radius: 4px;
  background: #fafafa;
  border: 1px dashed rgba(213, 215, 222, 1);
  transition: all 0.3s;
  font-size: 14px;
  color: rgba(153, 153, 153, 0.6);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.component-item .component-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.component-relationship-icon {
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
}

.component-icon-directed {
  background-image: url("@/assets/images/单向.png");
}

.component-icon-bidirectional {
  background-image: url("@/assets/images/双向.png");
}

.component-icon-loop {
  background-image: url("@/assets/images/循环.png");
}

.component-item:hover .component-icon-directed,
.component-item-selected .component-icon-directed {
  background-image: url("@/assets/images/单向选中.png");
}

.component-item:hover .component-icon-bidirectional,
.component-item-selected .component-icon-bidirectional {
  background-image: url("@/assets/images/双向选中.png");
}

.component-item:hover .component-icon-loop,
.component-item-selected .component-icon-loop {
  background-image: url("@/assets/images/循环选中.png");
}

.component-item:hover,
.component-item-highlight,
.component-item-selected {
  border: 1px solid rgba(61, 210, 176, 1);
  color: rgba(61, 210, 176, 1);
}
.component-item:hover .add-component-btn,
.component-item-highlight .add-component-btn,
.component-item-selected .add-component-btn {
  color: #3dd2b0;
}

.add-component-btn {
  width: 20px;
  height: 20px;
  color: #c9cdd3;
  font-size: 20px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: none;
  background: none;
}

.add-component-btn:hover {
  color: #3dd2b0;
}
.graph-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  .empty-list {
    padding-top: 0;
  }
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
  // margin-bottom: 25px;
  flex: 1;
  // height: 73vh;
  overflow-y: auto;
  padding-right: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.graph-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 16px;
  border: 0.8px solid rgba(224, 226, 235, 1);
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s;
  cursor: pointer;
}

.graph-item-active,
.graph-item:hover {
  border-color: rgba(61, 210, 176, 1);
}
.graph-item:hover .graph-info {
  color: #000;
  font-weight: 500;
}
.graph-info {
  flex: 1;
  font-size: 16px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.graph-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transform: translateX(10px);
  transition: all 0.3s ease;
  .arrow-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    margin-right: 6px;
  }
  .delete-btn {
    width: 15px;
    height: 15px;
  }
}

.graph-item:hover .graph-actions {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
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
.sub-sub-domain-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-name-container {
  // margin-bottom: 20px;
  padding-bottom: 15px;
  // border-bottom: 1px dashed rgba(238, 238, 238, 1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 8px;
  img {
    width: 20px;
    height: 20px;
  }
  .graph-name-left {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    width: 85%;
  }
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;

  &:hover {
    // transform: translateX(-2px);
  }

  img {
    width: 16px;
    height: 16px;
  }
}
.graphMessage {
  background: #f6fdfd;
  border: 0.8px solid rgba(193, 230, 221, 1);
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  color: #3dd2b0;
  margin-top: 60px;
  line-height: 26px;
}
.graph-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  // max-width: 70px;
}
.data-list-container {
  flex: 1;
  .empty-data-msg {
    font-size: 12px;
    color: #999999;
    text-align: center;
    margin-top: 15px;
  }
}
/* 空的列表 */
.empty-list {
  flex: 1;
  // min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  box-sizing: border-box;
  padding-top: 80px;
}

.list-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #999999;
  img {
    width: 77px;
    height: 90px;
    margin-bottom: 15px;
  }
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
.loadings {
  font-size: 12px;
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

/* 复制重命名弹窗样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-btn {
  background-color: rgba(61, 210, 176, 1) !important;
  border-color: rgba(61, 210, 176, 1) !important;
  color: white !important;
}

.confirm-btn:hover {
  background-color: rgba(61, 210, 176, 0.9) !important;
  border-color: rgba(61, 210, 176, 0.9) !important;
}

.cancel-btn {
  background-color: white !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}

.cancel-btn:hover {
  background-color: #f5f7fa !important;
  border-color: #c0c4cc !important;
  color: #606266 !important;
}

/* 弹框关闭按钮样式 */
.el-dialog__headerbtn:hover .el-dialog__close {
  color: rgba(61, 210, 176, 1) !important;
}

/* 确保样式能够正确应用 */
:global(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: rgba(61, 210, 176, 1) !important;
}
</style>

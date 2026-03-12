<template>
  <aside class="sidebar" @clear-selections="handleClearSelections">
    <div style="flex: 1; overflow: hidden">
      <div class="sub-sub-domain-container">
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
              <el-tooltip
                v-for="(type, index) in entityTypes"
                :key="index"
                :content="type"
                placement="right"
                effect="dark"
              >
                <div
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
              </el-tooltip>
            </div>
          </div>

          <!-- 关系类型 -->
          <div class="data-section">
            <h3>关系模板</h3>
            <div class="relationship-types">
              <span class="empty-data-msg" v-if="relationTemplates.length === 0"
                >暂无关系模板</span
              >
              <el-tooltip
                v-for="template in relationTemplates"
                :key="template.relationTemplateId"
                :content="`${template.relationTemplateName} ${getStartNodeName(template)} → ${getEndNodeName(template)}`"
                placement="right"
                effect="dark"
              >
                <div
                  class="relationship-type-item"
                  :class="{
                    'relationship-type-item-selected':
                      selectedRelationshipType === template.relationTemplateName,
                  }"
                  @click="
                    handleRelationshipTypeClick(template.relationTemplateName)
                  "
                >
                  <div class="relationship-info">
                    <div class="relationship-row">
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
                      <div class="relationship-content">
                        <span class="relationship-name">{{ template.relationTemplateName }}</span>
                        <span class="relationship-endpoints">
                          <span class="endpoint">{{ getStartNodeName(template) }}</span>
                        <span class="arrow">→</span>
                        <span class="endpoint">{{ getEndNodeName(template) }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tooltip>
            </div>
          </div>
          <div class="graphMessage">
              <div>提示：</div>
              <div>可通过拖拽形式创建节点</div>
            </div>
        </div>
        
      </div>
      
    </div>
  </aside>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElTooltip } from "element-plus";

const props = defineProps({
  isLoadingTemplates: {
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
  nodeTemplates: {
    type: Array,
    default: () => [],
  },
});

// Use components from props directly

const emit = defineEmits([
  "drag-start",
  "drag-end",
  "entity-type-click",
  "relationship-type-click",
  "clear-selections",
]);

// 选中状态
const selectedEntityType = ref("");
const selectedRelationshipType = ref("");
const selectedComponent = ref(null);

// 计算关系模板的开始和结束节点名称
const getStartNodeName = (template) => {
  if (!template.startNodeTemplateId) return "";
  const nodeTemplate = props.nodeTemplates.find(
    node => node.nodeTemplateId === template.startNodeTemplateId
  );
  return nodeTemplate ? nodeTemplate.nodeTemplateName : "";
};

const getEndNodeName = (template) => {
  if (!template.endNodeTemplateId) return "";
  const nodeTemplate = props.nodeTemplates.find(
    node => node.nodeTemplateId === template.endNodeTemplateId
  );
  return nodeTemplate ? nodeTemplate.nodeTemplateName : "";
};

const handleDragStart = (event, type, item) => {
  emit("drag-start", event, type, item);
};

const handleDragEnd = (event) => {
  emit("drag-end", event);
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
  width: 260px;
  background-color: white;
  padding: 20px 20px 25px 20px;
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
  max-height: 260px;
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
  max-height: 260px;
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
}

.relationship-info {
  width: 100%;
}

.relationship-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.relationship-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.relationship-name {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.relationship-endpoints {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.endpoint {
  background-color: #f6fcff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 0.8px solid rgba(224, 226, 235, 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.arrow {
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
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
  backgrstylestyleound-image: url("@/assets/images/单向选中.png");
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
  justify-content: flex-start;
  align-items: center;
  margin-top: 10px;
  gap: 8px;
  img {
    width: 20px;
    height: 20px;
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
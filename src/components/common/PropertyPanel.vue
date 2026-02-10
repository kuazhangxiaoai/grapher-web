<template>
  <aside class="right-panel" v-if="showPropertyPanel">
    <div class="property-panel">
      <div class="property-panel-header">
        <div class="header-left">
          <el-icon><Menu /></el-icon>
          <h3>属性面板</h3>
        </div>
      </div>
      <div class="property-panel-body">
        <!-- 实体属性 -->
        <div v-if="currentOperation === 'entity'">
          <div class="property-item">
            <label>实体名称</label>
            <el-input v-model="localEntityName" placeholder="请输入"></el-input>
          </div>
          <div class="property-item">
            <label>定义描述</label>
            <el-input
              v-model="localEntityDescription"
              placeholder="请输入~"
            ></el-input>
          </div>
          <div class="property-item">
            <div class="property-label">
              <label>属性</label>
              <span class="property-count"
                >{{ localEntityProperties.length }}个</span
              >
            </div>
            <div class="properties-list">
              <div
                v-for="(property, index) in localEntityProperties"
                :key="index"
                class="property-row"
              >
                <div class="property-name">{{ property.name }}</div>
                <el-select v-model="property.type" style="width: 100%">
                  <el-option label="文本" value="text"></el-option>
                  <el-option label="日期" value="date"></el-option>
                  <el-option label="数字" value="number"></el-option>
                  <el-option label="布尔" value="boolean"></el-option>
                  <el-option label="对象" value="object"></el-option>
                  <el-option label="数组" value="array"></el-option>
                </el-select>
              </div>
            </div>
            <el-button
              type="primary"
              size="small"
              class="add-property-btn"
              @click="handleAddProperty"
              >+ 新增属性</el-button
            >
          </div>
          <div class="property-item">
            <label>加入组件库</label>
            <el-switch
              v-model="localAddToComponentLibrary"
              active-text=""
            ></el-switch>
          </div>
        </div>

        <!-- 关系属性 -->
        <div v-else-if="currentOperation === 'relationship'">
          <div class="property-item">
            <label>关系名称</label>
            <el-input
              v-model="localRelationshipName"
              placeholder="请输入"
            ></el-input>
          </div>
          <div class="property-item">
            <label>定义描述</label>
            <el-input
              v-model="localEntityDescription"
              placeholder="请输入~"
            ></el-input>
          </div>
          <div class="property-item">
            <label>关系类型</label>
            <el-select v-model="localRelationshipType" style="width: 100%">
              <el-option label="定向" value="directed"></el-option>
              <el-option label="双向" value="bidirectional"></el-option>
              <el-option label="循环" value="circular"></el-option>
            </el-select>
          </div>
          <div class="property-item">
            <div class="property-label">
              <label>属性</label>
              <span class="property-count"
                >{{ localEntityProperties.length }}个</span
              >
            </div>
            <div class="properties-list">
              <div
                v-for="(property, index) in localEntityProperties"
                :key="index"
                class="property-row"
              >
                <div class="property-name">{{ property.name }}</div>
                <el-select v-model="property.type" style="width: 100%">
                  <el-option label="文本" value="text"></el-option>
                  <el-option label="日期" value="date"></el-option>
                  <el-option label="数字" value="number"></el-option>
                  <el-option label="布尔" value="boolean"></el-option>
                  <el-option label="对象" value="object"></el-option>
                  <el-option label="数组" value="array"></el-option>
                </el-select>
              </div>
            </div>
            <el-button
              type="primary"
              size="small"
              class="add-property-btn"
              @click="handleAddProperty"
              >+ 新增属性</el-button
            >
          </div>
          <div class="property-item">
            <label>加入组件库</label>
            <el-switch
              v-model="localAddToComponentLibrary"
              active-text=""
            ></el-switch>
          </div>
        </div>
      </div>
      <div class="property-panel-footer">
        <el-button
          size="small"
          class="close-btn"
          @click="handleClosePropertyPanel"
          >关闭</el-button
        >
        <el-button type="danger" size="small" class="delete-btn"
          >删除</el-button
        >
        <el-button
          type="success"
          size="small"
          class="save-btn"
          @click="handleSavePropertyPanel"
          >保存</el-button
        >
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch } from "vue";
import { Menu } from "@element-plus/icons-vue";

const props = defineProps({
  showPropertyPanel: {
    type: Boolean,
    default: false,
  },
  currentOperation: {
    type: String,
    default: "",
  },
  entityName: {
    type: String,
    default: "",
  },
  entityDescription: {
    type: String,
    default: "",
  },
  entityProperties: {
    type: Array,
    default: () => [],
  },
  relationshipName: {
    type: String,
    default: "",
  },
  relationshipType: {
    type: String,
    default: "directed",
  },
  addToComponentLibrary: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["close", "cancel", "save", "add-property"]);

const localEntityName = ref(props.entityName);
const localEntityDescription = ref(props.entityDescription);
const localEntityProperties = ref([...props.entityProperties]);
const localRelationshipName = ref(props.relationshipName);
const localRelationshipType = ref(props.relationshipType);
const localAddToComponentLibrary = ref(props.addToComponentLibrary);

// 监听属性变化，同步更新本地状态
watch(
  () => props.entityName,
  (newValue) => {
    localEntityName.value = newValue;
  },
);

watch(
  () => props.entityDescription,
  (newValue) => {
    localEntityDescription.value = newValue;
  },
);

watch(
  () => props.entityProperties,
  (newValue) => {
    localEntityProperties.value = [...newValue];
  },
  { deep: true },
);

watch(
  () => props.relationshipName,
  (newValue) => {
    localRelationshipName.value = newValue;
  },
);

watch(
  () => props.addToComponentLibrary,
  (newValue) => {
    localAddToComponentLibrary.value = newValue;
  },
);

watch(
  () => props.relationshipType,
  (newValue) => {
    localRelationshipType.value = newValue;
  },
);

const handleClosePropertyPanel = () => {
  emit("close");
};

const handleCancelPropertyPanel = () => {
  emit("cancel");
};

const handleSavePropertyPanel = () => {
  // 准备保存的数据
  const saveData = {
    currentOperation: props.currentOperation,
    entityName: localEntityName.value,
    entityDescription: localEntityDescription.value,
    entityProperties: localEntityProperties.value,
    relationshipName: localRelationshipName.value,
    relationshipType: localRelationshipType.value,
    addToComponentLibrary: localAddToComponentLibrary.value,
  };
  emit("save", saveData);
};

const handleAddProperty = () => {
  localEntityProperties.value.push({ name: "", type: "text", value: "" });
  emit("add-property");
};
</script>

<style scoped>
/* 右侧面板 */
.right-panel {
  width: 300px;
  background-color: white;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.property-panel {
  position: fixed;
  top: 60px;
  right: 0;
  width: 300px;
  height: calc(100vh - 60px);
  background-color: white;
  border-left: 1px solid #e4e7ed;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.property-panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  background-color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left el-icon {
  color: #67c23a;
  font-size: 16px;
}

.property-panel-header h3 {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: #333;
}

.property-panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.property-item {
  margin-bottom: 20px;
}

.property-item label {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.property-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.property-count {
  font-size: 12px;
  color: #67c23a;
  background-color: #f0f9eb;
  padding: 2px 6px;
  border-radius: 10px;
}

.properties-list {
  margin-bottom: 12px;
}

.property-row {
  margin-bottom: 12px;
}

.property-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.add-property-btn {
  width: 100%;
  margin-top: 8px;
}

.property-panel-footer {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
}

.close-btn {
  flex: 1;
  margin-right: 8px;
}

.delete-btn {
  flex: 1;
  margin-right: 8px;
}

.save-btn {
  flex: 2;
}

.el-select {
  width: 100%;
}

.el-switch {
  float: right;
}

.el-input {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .right-panel {
    width: 250px;
  }

  .property-panel {
    width: 250px;
  }
}
</style>

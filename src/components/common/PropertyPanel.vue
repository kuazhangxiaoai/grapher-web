<template>
  <aside class="right-panel" v-if="showPropertyPanel">
    <div class="property-panel">
      <div class="property-panel-header">
        <div class="header-left">
          <img src="@/assets/images/面板设置.png" alt="属性面板图标" />
          <h3>属性面板</h3>
        </div>
      </div>
      <div class="property-panel-body">
        <!-- 实体属性 -->
        <div v-if="currentOperation === 'entity'">
          <div class="property-item">
            <label>实体名称</label>
            <el-input
              v-model="localEntityName"
              placeholder="请输入~"
            ></el-input>
          </div>
          <div class="property-item">
            <label>定义描述</label>
            <el-input
              v-model="localEntityDescription"
              placeholder="请输入~"
              type="textarea"
              :maxlength="60"
              resize="none"
              :rows="3"
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
                v-if="localEntityProperties.length === 0"
                class="empty-properties"
              >
                暂无属性
              </div>
              <div
                v-for="(property, index) in localEntityProperties"
                :key="
                  'prop-' +
                  index +
                  '-' +
                  (property.name || index) +
                  '-' +
                  Date.now()
                "
                class="property-row"
              >
                <div class="property-name-container">
                  <div class="property-name">
                    {{ property.name || "未命名属性" }}
                  </div>
                  <el-button
                    type="text"
                    class="delete-property-btn"
                    @click="handleDeleteProperty(index)"
                  >
                    ×
                  </el-button>
                </div>
                <el-select
                  v-model="property.type"
                  style="width: 100%"
                  :popper-append-to-body="false"
                  :disabled="nodeTemplateId > 0 && !property.isNew"
                >
                  <el-option label="文本" value="string"></el-option>
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
            >
              <el-icon class="plusIcon"><Plus /></el-icon> 新增属性
            </el-button>
          </div>
          <div class="property-item">
            <label>背景颜色</label>
            <el-color-picker
              v-model="localBackgroundColor"
              show-alpha
              size="large"
            ></el-color-picker>
          </div>
          <div class="property-item lines">
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
              placeholder="请输入~"
            ></el-input>
          </div>
          <!-- <div class="property-item">
            <label>定义描述</label>
            <el-input
              v-model="localRelationshipDescription"
              placeholder="请输入~"
              type="textarea"
              :maxlength="60"
              resize="none"
              :rows="3"
            ></el-input>
          </div> -->
          <div class="property-item">
            <label>关系类型</label>
            <el-select
              v-model="localRelationshipType"
              style="width: 100%"
              :popper-append-to-body="false"
            >
              <el-option label="定向" value="定向"></el-option>
              <el-option label="双向" value="双向"></el-option>
              <el-option label="循环" value="循环"></el-option>
            </el-select>
          </div>
          <div class="property-item">
            <label>开始实体</label>
            <div class="entity-name-display">
              {{ localStartNodeName || "无" }}
            </div>
          </div>
          <div class="property-item">
            <label>结束实体</label>
            <div class="entity-name-display">
              {{ localEndNodeName || "无" }}
            </div>
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
                v-if="localEntityProperties.length === 0"
                class="empty-properties"
              >
                暂无属性
              </div>
              <div
                v-for="(property, index) in localEntityProperties"
                :key="
                  'prop-' +
                  index +
                  '-' +
                  (property.name || index) +
                  '-' +
                  Date.now()
                "
                class="property-row"
              >
                <div class="property-name-container">
                  <div class="property-name">
                    {{ property.name || "未命名属性" }}
                  </div>
                  <el-button
                    type="text"
                    class="delete-property-btn"
                    @click="handleDeleteProperty(index)"
                  >
                    ×
                  </el-button>
                </div>
                <el-select
                  v-model="property.type"
                  style="width: 100%"
                  :popper-append-to-body="false"
                  :disabled="relationTemplateId > 0 && !property.isNew"
                >
                  <el-option label="文本" value="string"></el-option>
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
            >
              <el-icon class="plusIcon"><Plus /></el-icon> 新增属性
            </el-button>
          </div>
          <div class="property-item lines">
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
          :disabled="isLoading"
          >关闭</el-button
        >
        <el-button
          type="danger"
          size="small"
          class="delete-btn"
          @click="handleDeletePropertyPanel"
          :loading="isLoading"
          :disabled="isLoading"
          v-if="
            (currentOperation === 'entity' && nodeTemplateId > 0) ||
            (currentOperation === 'relationship' && relationTemplateId > 0)
          "
          >删除</el-button
        >
        <el-button
          type="success"
          size="small"
          class="save-btn"
          @click="handleSavePropertyPanel"
          :loading="isLoading"
          :disabled="isLoading"
          >保存</el-button
        >
      </div>
    </div>
  </aside>

  <!-- 新增属性对话框 -->
  <el-dialog
    v-model="addPropertyDialogVisible"
    title="新增属性"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form :model="newProperty" label-width="80px">
      <el-form-item label="属性名称" required>
        <el-input
          v-model="newProperty.name"
          placeholder="请输入属性名称"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="属性类型">
        <el-select v-model="newProperty.type" style="width: 100%">
          <el-option label="文本" value="string"></el-option>
          <el-option label="日期" value="date"></el-option>
          <el-option label="数字" value="number"></el-option>
          <el-option label="布尔" value="boolean"></el-option>
          <el-option label="对象" value="object"></el-option>
          <el-option label="数组" value="array"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="addPropertyDialogVisible = false"
          >取消</el-button
        >
        <el-button
          class="confirm-btn"
          type="primary"
          @click="handleConfirmAddProperty"
          >确定</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import graph from "@/services/graph";

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
  relationshipDescription: {
    type: String,
    default: "",
  },
  relationshipType: {
    type: String,
    default: "定向",
  },
  startNodeName: {
    type: String,
    default: "",
  },
  endNodeName: {
    type: String,
    default: "",
  },
  addToComponentLibrary: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: "#43D7B5",
  },
  topicId: {
    type: String,
    default: "",
  },
  startNodeTemplateId: {
    type: Number,
    default: 0,
  },
  endNodeTemplateId: {
    type: Number,
    default: 0,
  },
  nodeTemplateId: {
    type: Number,
    default: 0,
  },
  relationTemplateId: {
    type: Number,
    default: 0,
  },
  isFromComponentLibrary: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "cancel", "save", "add-property"]);

// 本地状态
const localEntityName = ref(props.entityName);
const localEntityDescription = ref(props.entityDescription);
const localEntityProperties = ref([]);
const localRelationshipName = ref(props.relationshipName);
const localRelationshipDescription = ref(props.relationshipDescription);
const localRelationshipType = ref(props.relationshipType);
const localStartNodeName = ref(props.startNodeName);
const localEndNodeName = ref(props.endNodeName);
const localAddToComponentLibrary = ref(props.addToComponentLibrary);
const localBackgroundColor = ref("#43D7B5");

// 加载状态
const isLoading = ref(false);

// 新增属性对话框相关
const addPropertyDialogVisible = ref(false);
const newProperty = ref({ name: "", type: "string" });

// 标记是否正在添加属性，避免被props更新覆盖
const isAddingProperty = ref(false);

// 初始化属性列表
localEntityProperties.value = props.entityProperties.map((prop) => ({
  ...prop,
  isNew: false, // 标记为现有属性
}));

// 监听属性变化，同步更新本地状态（但跳过添加属性时的更新）
watch(
  () => props.entityProperties,
  (newValue) => {
    // 如果正在添加属性，跳过这次更新
    if (isAddingProperty.value) {
      console.log("Skipping props update during property addition");
      return;
    }
    // 深拷贝新值，并标记为现有属性
    localEntityProperties.value = newValue.map((prop) => ({
      ...prop,
      isNew: false,
    }));
    console.log("Properties updated from props:", localEntityProperties.value);
  },
  { deep: true },
);

// 监听showPropertyPanel变化，当它变为true时，重新从props中获取最新的值
watch(
  () => props.showPropertyPanel,
  (newValue) => {
    if (newValue) {
      isAddingProperty.value = false; // 重置添加状态
      localEntityName.value = props.entityName;
      localEntityDescription.value = props.entityDescription;
      localEntityProperties.value = props.entityProperties.map((prop) => ({
        ...prop,
        isNew: false, // 标记为现有属性
      }));
      localRelationshipName.value = props.relationshipName;
      localRelationshipDescription.value = props.relationshipDescription;
      localRelationshipType.value = props.relationshipType;
      localStartNodeName.value = props.startNodeName;
      localEndNodeName.value = props.endNodeName;
      localAddToComponentLibrary.value = props.addToComponentLibrary;
      localBackgroundColor.value = props.backgroundColor || "#43D7B5";
      console.log("Panel opened with properties:", localEntityProperties.value);
    }
  },
);

// 监听其他props的变化
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
  () => props.relationshipName,
  (newValue) => {
    localRelationshipName.value = newValue;
  },
);

watch(
  () => props.relationshipDescription,
  (newValue) => {
    localRelationshipDescription.value = newValue;
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

watch(
  () => props.startNodeName,
  (newValue) => {
    localStartNodeName.value = newValue;
  },
);

watch(
  () => props.endNodeName,
  (newValue) => {
    localEndNodeName.value = newValue;
  },
);

watch(
  () => props.backgroundColor,
  (newValue) => {
    localBackgroundColor.value = newValue || "#43D7B5";
  },
);

const handleClosePropertyPanel = () => {
  emit("close");
};

const handleCancelPropertyPanel = () => {
  emit("cancel");
};

const handleSavePropertyPanel = async () => {
  try {
    // 检查 topicId 是否为空
    if (!props.topicId) {
      ElMessage.warning("请先选择专题");
      return;
    }

    // 设置加载状态
    isLoading.value = true;

    if (props.currentOperation === "entity") {
      // 构建保存到接口的数据
      const templateData = {
        topicId: props.topicId,
        nodeTemplateName: localEntityName.value,
        nodeTemplateDescription: localEntityDescription.value,
        isLibraryFlag: localAddToComponentLibrary.value ? "1" : "0",
        nodeTemplateColor: localBackgroundColor.value,
        properties: localEntityProperties.value.map((prop) => ({
          propertyKey: prop.name,
          propertyType:
            prop.type === "string"
              ? "String"
              : prop.type === "date"
                ? "Date"
                : prop.type === "number"
                  ? "Number"
                  : prop.type === "boolean"
                    ? "Boolean"
                    : prop.type === "object"
                      ? "Object"
                      : prop.type === "array"
                        ? "Array"
                        : "String",
        })),
      };

      // 如果是修改操作，添加nodeTemplateId
      if (props.nodeTemplateId > 0) {
        templateData.nodeTemplateId = props.nodeTemplateId;
      }

      // 调用保存接口
      await graph.saveNodeTemplate(templateData);
    } else if (props.currentOperation === "relationship") {
      // 检查 startNodeTemplateId 和 endNodeTemplateId 是否为空
      if (!props.startNodeTemplateId || !props.endNodeTemplateId) {
        ElMessage.warning("请选择关系的起始节点和结束节点");
        isLoading.value = false;
        return;
      }

      // 构建关系模板保存数据
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
      const relationTemplateData = {
        topicId: props.topicId,
        relationTemplateName: localRelationshipName.value,
        relationTemplateType: getRelationTypeValue(localRelationshipType.value),
        startNodeTemplateId: props.startNodeTemplateId,
        endNodeTemplateId: props.endNodeTemplateId,
        isLibraryFlag: localAddToComponentLibrary.value ? "1" : "0",
        properties: localEntityProperties.value.map((prop) => ({
          propertyKey: prop.name,
          propertyType:
            prop.type === "string"
              ? "String"
              : prop.type === "date"
                ? "Date"
                : prop.type === "number"
                  ? "Number"
                  : prop.type === "boolean"
                    ? "Boolean"
                    : prop.type === "object"
                      ? "Object"
                      : prop.type === "array"
                        ? "Array"
                        : "String",
        })),
      };

      // 如果是修改操作，添加relationTemplateId
      if (props.relationTemplateId > 0) {
        relationTemplateData.relationTemplateId = props.relationTemplateId;
      }

      // 调用保存接口
      await graph.saveRelationTemplate(relationTemplateData);
    }

    // 保存成功提示
    ElMessage.success("保存成功");

    // 准备保存到父组件的数据
    const saveData = {
      currentOperation: props.currentOperation,
      entityName: localEntityName.value,
      entityDescription: localEntityDescription.value,
      entityProperties: localEntityProperties.value.map((prop) => ({
        ...prop,
      })),
      relationshipName: localRelationshipName.value,
      relationshipDescription: localRelationshipDescription.value,
      relationshipType: localRelationshipType.value,
      addToComponentLibrary: localAddToComponentLibrary.value,
      backgroundColor: localBackgroundColor.value,
      isFromComponentLibrary: props.isFromComponentLibrary,
    };

    // 异步更新数据，不阻塞面板关闭
    setTimeout(async () => {
      try {
        // 并行调用查询接口获取最新数据
        const [templateResponse, libraryResponse] = await Promise.all([
          graph.queryTemplate(props.topicId),
          graph.queryLibraryTemplate(""),
        ]);

        if (templateResponse && templateResponse.data) {
          // 触发更新事件，通知父组件更新节点数据
          emit("update-nodes", templateResponse.data);
        }

        if (libraryResponse && libraryResponse.data) {
          // 触发更新事件，通知父组件更新组件库数据
          emit("update-library", libraryResponse.data);
        }
      } catch (error) {
        console.error("更新数据失败:", error);
      }
    }, 0);

    // 延迟关闭面板，让用户看到加载状态和成功提示
    setTimeout(() => {
      isLoading.value = false;
      emit("save", saveData);
    }, 1000);
  } catch (error) {
    console.error("保存失败:", error);
    isLoading.value = false;
    // ElMessage.error("保存失败，请重试");
  }
};

const handleDeletePropertyPanel = async () => {
  try {
    // 弹出确认对话框
    await ElMessageBox.confirm("确定要删除吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 设置加载状态
    isLoading.value = true;

    if (props.currentOperation === "entity") {
      // 检查 nodeTemplateId 是否为空
      if (!props.nodeTemplateId) {
        ElMessage.warning("实体模板ID不能为空");
        isLoading.value = false;
        return;
      }
      // 调用删除接口
      await graph.deleteNodeTemplate({ nodeTemplateId: props.nodeTemplateId });
    } else if (props.currentOperation === "relationship") {
      // 检查 relationTemplateId 是否为空
      if (!props.relationTemplateId) {
        ElMessage.warning("关系模板ID不能为空");
        isLoading.value = false;
        return;
      }
      // 调用删除接口
      await graph.deleteRelationTemplate({
        relationTemplateId: props.relationTemplateId,
      });
    }

    // 删除成功提示
    ElMessage.success("删除成功");

    // 异步更新数据，不阻塞面板关闭
    setTimeout(async () => {
      try {
        // 并行调用查询接口获取最新数据
        const [templateResponse, libraryResponse] = await Promise.all([
          graph.queryTemplate(props.topicId),
          graph.queryLibraryTemplate(""),
        ]);

        if (templateResponse && templateResponse.data) {
          // 触发更新事件，通知父组件更新节点数据
          emit("update-nodes", templateResponse.data);
        }

        if (libraryResponse && libraryResponse.data) {
          // 触发更新事件，通知父组件更新组件库数据
          emit("update-library", libraryResponse.data);
        }
      } catch (error) {
        console.error("更新数据失败:", error);
      }
    }, 0);

    // 延迟关闭面板，让用户看到加载状态和成功提示
    setTimeout(() => {
      isLoading.value = false;
      emit("close");
    }, 1000);
  } catch (error) {
    // 如果是用户取消操作，不显示错误信息
    if (error !== "cancel") {
      console.error("删除失败:", error);
      // ElMessage.error("删除失败，请重试");
    }
    isLoading.value = false;
  }
};

const handleAddProperty = () => {
  // 重置新属性数据
  newProperty.value = { name: "", type: "string" };
  // 打开对话框
  addPropertyDialogVisible.value = true;
};

const handleConfirmAddProperty = async () => {
  // 验证属性名是否为空
  if (!newProperty.value.name || newProperty.value.name.trim() === "") {
    ElMessage.warning("请输入属性名称");
    return;
  }

  // 设置添加状态，防止被props更新覆盖
  isAddingProperty.value = true;

  // 创建新属性对象
  const newProp = {
    name: newProperty.value.name.trim(),
    type: newProperty.value.type,
    value: "",
    isNew: true, // 标记为新属性
  };

  console.log("Adding new property:", newProp);
  console.log(
    "Before addition:",
    JSON.parse(JSON.stringify(localEntityProperties.value)),
  );

  // 直接添加到本地数组
  localEntityProperties.value.push(newProp);

  console.log(
    "After addition:",
    JSON.parse(JSON.stringify(localEntityProperties.value)),
  );

  // 等待 DOM 更新
  await nextTick();

  // 关闭对话框
  addPropertyDialogVisible.value = false;

  // 重置新属性数据
  newProperty.value = { name: "", type: "string" };

  // 成功提示
  // ElMessage.success("属性添加成功");

  // 3秒后重置添加状态
  setTimeout(() => {
    isAddingProperty.value = false;
  }, 3000);

  console.log(
    "Final properties:",
    JSON.parse(JSON.stringify(localEntityProperties.value)),
  );
};

// 删除属性
const handleDeleteProperty = (index) => {
  // 从本地数组中删除属性
  localEntityProperties.value.splice(index, 1);
  console.log("Property deleted at index:", index);
  console.log("Updated properties:", localEntityProperties.value);
};

// 点击外部关闭属性面板
// const handleClickOutside = (event) => {
//   // 检查点击目标是否在属性面板内部
//   const propertyPanel = document.querySelector('.property-panel');
//   // 检查点击目标是否在新增属性弹框内部
//   const dialog = document.querySelector('.el-dialog');
//   // 检查点击目标是否在关系连线（虚线）内部
//   const connectionLine = document.querySelector('.connection-line');
//   // 检查点击目标是否在画布内部
//   const graphContainer = document.querySelector('.graph-container');
//   // 只有当点击目标不在属性面板、弹框、连线和画布内部时才关闭
//   if (propertyPanel &&
//       !propertyPanel.contains(event.target) &&
//       (!dialog || !dialog.contains(event.target)) &&
//       (!connectionLine || !connectionLine.contains(event.target)) &&
//       (!graphContainer || !graphContainer.contains(event.target))) {
//     emit('close');
//   }
// };

// onMounted(() => {
//   // 添加全局点击事件监听器
//   document.addEventListener('click', handleClickOutside);
// });

// onUnmounted(() => {
//   // 移除全局点击事件监听器
//   document.removeEventListener('click', handleClickOutside);
// });
</script>

<style scoped lang="scss">
/* 右侧面板 */
.right-panel {
  width: 280px;
  background-color: white;
  overflow: hidden;
}

.property-panel {
  position: fixed;
  top: 70px;
  right: 0;
  width: 280px;
  height: calc(100vh - 70px);
  background-color: white;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.property-panel-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  background-color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  img {
    width: 21px;
    height: 21px;
  }
}

.header-left el-icon {
  color: #67c23a;
  font-size: 16px;
}

.property-panel-header h3 {
  font-size: 18px;
  color: #333333;
  font-weight: 600;
  margin: 0;
}

.property-panel-body {
  flex: 1;
  padding: 0 24px 24px 24px;
  overflow-y: auto;
}

.property-item {
  margin-bottom: 20px;

  :deep(.el-input__wrapper) {
    background: #f6fcff;
    border: 0.8px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    height: 40px;
    box-sizing: border-box;
    box-shadow: none;
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #333333;
  }

  :deep(.el-textarea__inner) {
    font-size: 14px;
    color: #000000;
    background: #ffffff;
    border: 0.8px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    box-shadow: none;
    resize: none;
  }

  :deep(.el-input__inner::placeholder) {
    font-size: 14px;
    color: #999;
  }
  :deep(.el-textarea__inner::placeholder) {
    font-size: 13px;
    color: #999;
  }
}

.entity-name-display {
  // background: #f6fcff;
  // border: 0.8px solid rgba(224, 226, 235, 1);
  background: #f5f5f5;
  border: 0.8px solid #f5f5f5;
  border-radius: 4px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.property-item label {
  display: block;
  font-size: 14px;
  color: #000000;
  margin-bottom: 8px;
  font-weight: 500;
}

.property-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.property-count {
  font-size: 14px;
  color: #3dd2b0;
  background: rgba(61, 210, 176, 0.1);
  border-radius: 10px;
  padding: 1px 10px;
}

.properties-list {
  margin-bottom: 12px;
  min-height: 40px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.empty-properties {
  color: #999;
  font-size: 14px;
  padding: 20px 0;
  text-align: center;
  width: 100%;
}

.property-row {
  margin-bottom: 12px;
  background: #f4f8fc;
  border-radius: 4px;
  padding: 6px 12px 10px 12px;
  width: 100%;

  :deep(.el-select__wrapper) {
    background: #ffffff;
    border: 0.5px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    height: 32px;
    box-sizing: border-box;
    box-shadow: none;
    font-size: 12px;
    color: #999999;
  }

  :deep(.el-select__caret) {
    font-size: 12px;
  }
}

.property-name-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.delete-property-btn {
  font-size: 16px;
  color: #999;
  padding: 0;
  margin-left: 8px;
  line-height: 1;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-property-btn:hover {
  color: #e54949;
  background: none;
}

.lines {
  padding-top: 15px;
  border-top: 1px solid rgba(238, 238, 238, 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #3dd2b0;
  border-color: #3dd2b0;
}

.property-name {
  font-size: 14px;
  color: #333333;
  margin-bottom: 4px;
  font-weight: 500;
  word-break: break-all;
}

.add-property-btn {
  width: 100%;

  .plusIcon {
    margin-right: 5px;
    color: #999;
    font-size: 12px;
  }
}

.el-button--small {
  border-radius: 4px;
  font-size: 14px;
  padding: 16px 11px;
}

.el-button--primary {
  background-color: #ffffff;
  font-size: 14px;
  color: #999999;
  border: 1px dashed rgba(213, 215, 222, 1);
  font-weight: 400;
}

.el-button--primary:hover {
  background-color: #3dd2b0;
  color: #ffffff;
}

.el-button--primary:hover .plusIcon {
  color: #ffffff;
}

.property-panel-footer {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-top: 1px solid #f0f0f0;
}

.close-btn {
  flex: 1;
  background: #f0f0f0;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  color: #666666;
  margin-right: 8px;
}

.delete-btn {
  flex: 1;
  background: #e54949;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  color: #fff;
  margin-right: 8px;
}

.save-btn {
  flex: 2;
  background: #3dd2b0;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  color: #fff;
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
    width: 280px;
  }

  .property-panel {
    width: 280px;
  }
}

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

<style lang="scss">
/* 全局样式 */
.el-select-dropdown__item {
  font-size: 13px;
  color: #333333;
}

.el-select-dropdown__item:hover {
  background-color: rgba(61, 210, 176, 0.1) !important;
}

.el-select-dropdown__item.selected,
.el-select-dropdown__item.is-selected {
  color: #3dd2b0 !important;
  background-color: rgba(61, 210, 176, 0.1) !important;
}

/* 对话框样式 */
.el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.el-dialog__body {
  padding: 20px 20px 10px;
}

.el-dialog__footer {
  padding: 10px 20px 20px;
  border-top: none;
}

.el-form-item__label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.el-form-item.is-required .el-form-item__label:before {
  color: #e54949;
}

/* 修复 rows 属性警告 */
.el-textarea__inner {
  resize: none;
}
</style>

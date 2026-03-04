<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="400px"
    class="add-node-property-dialog"
    @close="handleClose"
  >
    <el-form label-width="60px" class="property-form">
      <div
        v-for="(item, index) in form.properties"
        :key="index"
        class="property-row"
      >
        <el-form-item :label="item.key + ' :'" class="property-item">
          <el-input
              v-if="item.type === 'string'"
              v-model="item.value"
              placeholder="属性值"
              clearable
              style="width: 140px"
          />
          <el-date-picker
              v-if="item.type === 'date'"
              v-model="item.value"
              style="width: 140px"/>
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="handleCancel">取消</el-button>
        <el-button class="confirm-btn" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {type NodeProperty} from "@/configs/graph";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    /** 当前节点名称，用于提示 */
    nodeName?: string;
    /** 初始属性列表，打开弹窗时使用 */
    properties?: NodeProperty[];
  }>(),
  {
    title: "节点属性",
    nodeName: "",
    properties: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm", properties: NodeProperty[]): void;
  (e: "cancel"): void;
}>();

const dialogVisible = ref(props.visible);

const form = ref<{ properties: NodeProperty[] }>({
  properties: [],
});

function initForm() {
  const list = props.properties?.length
    ? props.properties.map((p) => ({
        key: p.key ?? p.name,
        type: p.type || "string",
        value: p.value ?? "",
      }))
    : [];
  form.value.properties = list;
}

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue;
    if (newValue) {
      initForm();
    }
  }
);

const handleCancel = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  const nameOrKey = (p) => (p.name ?? p.key ?? "").toString().trim();
  const properties = form.value.properties
    .filter((p) => nameOrKey(p))
    .map((p) => ({ name: nameOrKey(p), type: p.type || "string" }));
  if (properties.length === 0) {
    properties.push({ name: "名字", type: "string" });
  }
  emit("confirm", properties);
  dialogVisible.value = false;
  emit("update:visible", false);
};

const handleClose = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};
</script>

<style scoped lang="scss">
.dialog-tip {
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
}

.property-form {
  margin-bottom: 12px;
}

.property-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;

  .property-item {
    margin-bottom: 0;
  }

  .remove-btn {
    flex-shrink: 0;
    margin-top: 8px;
  }
}

.add-property-btn {
  margin-bottom: 16px;
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

:global(.add-node-property-dialog .el-dialog__body) {
  padding: 20px 10px 0 8px;
  border-top: 1px solid rgba(238, 238, 238, 1);
}

:global(.add-node-property-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: rgba(61, 210, 176, 1) !important;
}

:deep(.el-input__wrapper) {
  background: #ffffff;
  border: 0.5px solid rgba(224, 226, 235, 1);
  border-radius: 4px;
  height: 40px;
  box-sizing: border-box;
  box-shadow: none;
}

:deep(.el-input__inner) {
  font-size: 14px;
  color: #333333;
}

:deep(.el-select__wrapper) {
  background: #ffffff;
  border: 0.5px solid rgba(224, 226, 235, 1);
  border-radius: 4px;
  height: 40px;
  box-sizing: border-box;
  box-shadow: none;
}

:deep(.el-form-item__label) {
  color: #303133 !important;
  font-size: 14px;
  text-align: left !important;
  justify-content: flex-start !important;
}

:deep(.el-form-item--label-right .el-form-item__label) {
  text-align: left !important;
  justify-content: flex-start !important;
}
</style>

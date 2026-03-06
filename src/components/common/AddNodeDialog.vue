<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="400px"
    class="add-node-dialog"
    @close="handleClose"
  >
    <el-form :model="form" label-width="85px">
      <el-form-item label="节点名称" required>
        <el-input
          v-model="form.name"
          placeholder="请输入节点名称"
          style="width: 100%; height: 45px"
          clearable
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="节点类型">
        <el-select
          v-model="form.type"
          placeholder="请选择节点类型"
          style="width: 100%; height: 45px"
        >
          <el-option
            v-for="(item, index) in props.nodeTemplates"
            :key="item.name"
            :label="item.name"
            :value="item.name"
          >
            <span class="node-type-option">
              <span class="node-type-text">{{ item.name }}</span>
              <span
                class="node-type-color-dot"
                :style="{ backgroundColor: item.color }"
              />
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="handleCancel">取消</el-button>
        <el-button class="confirm-btn" @click="handleConfirm" :disabled="!form.name?.trim()">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type {NodeTemplate} from "@/configs/graph";


export interface AddNodePayload extends NodeTemplate {
  position?: { x: number; y: number };
}

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    /** 添加节点时的画布坐标，由父组件在打开弹窗时传入 */
    position?: { x: number; y: number };
    nodeTemplates: NodeTemplate[];
  }>(),
  {
    title: "添加节点",
    position: undefined,
    nodeTemplates: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "add-node", payload: AddNodePayload): void;
  (e: "cancel"): void;
  (e: "confirm"): void;
}>();

const dialogVisible = ref(props.visible);

/** 表单：name 为用户输入的节点名称，type 为选中的模板名称；选择类型后会同步该模板的 id、color */
const form = ref<{ id: string; name: string; type: string; color: string | null }>({
  id: "",
  name: "",
  type: "",
  color: null,
});

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue;
    if (newValue) {
      form.value = {
        id: "",
        name: "",
        type: "",
        color: null,
      };
    }
  }
);

// 根据选中的类型（模板 name）从 nodeTemplates 同步 id、color 到 form
watch(
  () => form.value.type,
  (typeName) => {
    if (!typeName || !props.nodeTemplates?.length) return;
    const template = props.nodeTemplates.find((t: NodeTemplate) => t.name === typeName);
    if (template) {
      form.value.id = template.id ?? "";
      form.value.color = template.color ?? null;
    }
  }
);

const handleCancel = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  const name = form.value.name?.trim();
  if (!name) return;
  emit("add-node", {
    id: form.value.id,
    name: form.value.name || null,
    color: form.value.color || null,
    type: form.value.type || null,
    position: props.position,
  });
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

.node-type-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.node-type-color-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  display: inline-block;
}

:global(.add-node-dialog .el-dialog__body) {
  padding: 20px 10px 0 8px;
  border-top: 1px solid rgba(238, 238, 238, 1);
}

:global(.add-node-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
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

:deep(.el-input__inner::placeholder) {
  font-size: 14px;
  color: #d1d0d0ff;
}

:deep(.el-select__wrapper) {
  background: #ffffff;
  border: 0.5px solid rgba(224, 226, 235, 1);
  border-radius: 4px;
  height: 40px;
  box-sizing: border-box;
  box-shadow: none;
}

:deep(.el-select__input) {
  font-size: 14px;
  color: #333;
}

:deep(.el-form-item--label-right .el-form-item__label) {
  text-align: left !important;
  justify-content: flex-start !important;
}
</style>

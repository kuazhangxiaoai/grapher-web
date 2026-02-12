<template>
  <el-dialog v-model="dialogVisible" :title="title" width="500px">
    <el-form :model="form" label-width="100px" style="padding: 30px 0">
      <el-form-item :label="labelName">
        <el-input
          v-model="form.newDomainName"
          :placeholder="placeholderText"
          style="width: 100%; height: 45px"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="handleCancel">取消</el-button>
        <el-button class="confirm-btn" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  newDomainName: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "新增领域",
  },
  labelName: {
    type: String,
    default: "领域名称",
  },
  placeholderText: {
    type: String,
    default: "请输入领域名称",
  },
});

const emit = defineEmits(["update:visible", "add-domain", "cancel"]);

const dialogVisible = ref(props.visible);
const form = ref({
  newDomainName: props.newDomainName,
});

// 监听 visible 属性变化，当弹框显示时清空输入框
watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue;
    if (newValue) {
      // 弹框显示时清空输入框
      form.value.newDomainName = "";
    }
  },
);

// 监听 newDomainName 属性变化
watch(
  () => props.newDomainName,
  (newValue) => {
    form.value.newDomainName = newValue;
  },
);

const handleCancel = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  if (form.value.newDomainName.trim()) {
    emit("add-domain", form.value.newDomainName.trim());
    dialogVisible.value = false;
    emit("update:visible", false);
  }
};
</script>

<style scoped>
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

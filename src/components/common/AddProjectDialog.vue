<template>
  <el-dialog v-model="dialogVisible" :title="title" width="500px">
    <el-form :model="form" label-width="100px" style="padding: 30px 0">
      <el-form-item :label="labelName">
        <el-input
            v-model="form.projectName"
            :placeholder="placeholderText"
            style="width: 100%; height: 45px"
        />
      </el-form-item>
      <el-form-item label="领域">
        <el-input v-model="form.domainName" readonly></el-input>
      </el-form-item>
      <el-form-item label="专题">
        <el-input v-model="form.topicName" readonly></el-input>
      </el-form-item>
      <el-form-item label="图数据库">
        <el-select
            v-for="item in gdbOptions"
            :key="item"
            :label="item"
            :value="item">
        </el-select>
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
import {onMounted, ref, watch} from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  projectName:{
    type: String,
    default: "",
  },
  domainName: {
    type: String,
    default: "",
  },
  topicName:{
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "新增项目",
  },
  labelName: {
    type: String,
    default: "项目名称",
  },
  placeholderText: {
    type: String,
    default: "请输入项目名称",
  },
  projectType:{
    type: number,
    default: "",
  },
});

const emit = defineEmits(["update:visible", "add-domain", "cancel"]);

const dialogVisible = ref(props.visible);
const form = ref({
  projectName: props.projectName,
  domainName: props.domainName,
  topicName: props.topicName,
});
const gdbOptions = ref([])

// 监听 visible 属性变化，当弹框显示时清空输入框
watch(
    () => props.visible,
    (newValue) => {
      dialogVisible.value = newValue;
      if (newValue) {
        // 弹框显示时清空输入框
        form.value.projectName = "";
      }
    },
);

// 监听 newDomainName 属性变化
watch(
    () => props.projectName,
    (newValue) => {
      form.value.projectName = newValue;
    },
);

const handleCancel = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  if (form.value.projectName.trim()) {
    emit("add-project", form.value.projectName.trim());
    dialogVisible.value = false;
    emit("update:visible", false);
  }
};

onMounted(()=>{

})

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

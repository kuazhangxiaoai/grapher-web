<template>
  <el-dialog v-model="dialogVisible" :title="title" width="400px" :class="dialogClassName" @close="handleClose">
    <el-form :model="form" label-width="85px">
      <el-form-item label="图谱名称">
        <el-input
          v-model="form.graphName"
          placeholder="请输入图谱名称"
          style="width: 100%; height: 45px"
        />
      </el-form-item>
      <el-form-item label="创建方式">
        <el-select
          v-model="form.createMethod"
          placeholder="请选择创建方式"
          style="width: 100%"
        >
          <el-option label="自文本创建" value="text" />
          <el-option label="自数据库创建" value="database" />
          <el-option label="任意创建" value="any" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.createMethod === 'text'" label="上传附件">
        <el-upload
          class="upload-demo"
          action="#"
          :on-change="handleFileChange"
          :auto-upload="false"
          :show-file-list="true"
        >
          <el-button type="primary">上传附件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持上传 docx、pdf 等格式文件
            </div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item v-if="form.createMethod == 'text'" label="发表时间">
        <el-date-picker v-model="form.publishDate" type="date" placeholder="请选择发表时间"></el-date-picker>
      </el-form-item>
      <el-form-item v-if="form.createMethod === 'database'" label="数据库选择">
        <el-select
          v-model="form.databaseName"
          placeholder="请选择数据库"
          style="width: 100%"
        >
          <el-option label="数据库1" value="db1" />
          <el-option label="数据库2" value="db2" />
          <el-option label="数据库3" value="db3" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.createMethod === 'any'" label="任意内容">
        <el-input
          type="textarea"
          v-model="form.anyContent"
          placeholder="请输入任意内容"
          style="width: 100%"
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="handleCancel">取消</el-button>
        <el-button class="confirm-btn" @click="handleConfirm" :disabled="isConfirmButtonDisabled">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const dialogClassName = 'add-graph-dialog';
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "新建图谱",
  },
  isConfirmButtonDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible", "create-graph", "cancel"]);

const dialogVisible = ref(props.visible);
const form = ref({
  graphName: "",
  createMethod: "",
  uploadedFile: null,
  databaseName: "",
  anyContent: "",
  publishDate: "",
});

// 监听 visible 属性变化，当弹框显示时重置表单
watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue;
    if (newValue) {
      // 弹框显示时重置表单
      form.value = {
        graphName: "",
        createMethod: "",
        uploadedFile: null,
        databaseName: "",
        anyContent: "",
      };
    }
  },
);

const handleFileChange = (file) => {
  form.value.uploadedFile = file.raw;
};

const handleCancel = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  if (form.value.graphName.trim() && form.value.createMethod) {
    emit("create-graph", form.value);
    dialogVisible.value = false;
    emit("update:visible", false);
  }
};

const handleClose = () => {
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};
</script>
<style scoped>
/* 弹框内容区域样式 */
:global(.el-dialog__body) {
  padding: 20px 10px 0 8px;
  border-top: 1px solid rgba(238,238,238,1);
}
/* .dialog-header {
  border-bottom: 1px solid #e4e7ed;
} */
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
:global(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: rgba(61, 210, 176, 1) !important;
}
:deep(.el-input__wrapper) {
   background: #FFFFFF;
   border: 0.5px solid rgba(224,226,235,1);
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
   background: #FFFFFF;
   border: 0.5px solid rgba(224,226,235,1);
   border-radius: 4px;
    height: 40px;
    box-sizing: border-box;
    box-shadow: none;
  }
  :deep(.el-select__input) {
    font-size: 14px;
    color: #333;
  }
  :deep(.el-select__input::placeholder) {
    font-size: 13px;
    color: #c6c5c5ff;
    font-weight: 500;
  }
  :deep(.el-select__wrapper.is-hovering:not(.is-focused)) {
    box-shadow:none;
  }
  :deep(.el-form-item--label-right .el-form-item__label){
    text-align: left !important;
    justify-content: flex-start !important;
  }
</style>
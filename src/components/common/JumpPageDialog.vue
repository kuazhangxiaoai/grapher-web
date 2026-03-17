<template>
  <Teleport to="body">
    <el-dialog
      title="跳页至"
      v-model="visible"
      width="400px"
      @close="handleClose"
    >
      <el-form :model="form" label-width="80px" style="padding: 20px 0">
        <el-form-item label="跳页至">
          <el-select
            v-model="form.selectedPage"
            placeholder="请选择目标页码"
            style="width: 100%"
          >
            <el-option
              v-for="page in pageOptions"
              :key="page"
              :label="`第 ${page} 页`"
              :value="page"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="cancel-btn" @click="handleCancel">取消</el-button>
          <el-button class="confirm-btn" type="primary" @click="handleConfirm">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTextStore } from "@/store/useTextStore";

const props = withDefaults(
  defineProps<{
    totalPages: number;
    currentPage?: number;
  }>(),
  { currentPage: 1 }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "jump-page", page: number): void;
}>();

const textStore = useTextStore();
const visible = ref(true);
const form = ref({
  selectedPage: props.currentPage,
});

const pageOptions = computed(() => {
  const total = props.totalPages > 0 ? props.totalPages : 1;
  return Array.from({ length: total }, (_, i) => i + 1);
});

const handleClose = () => {
  visible.value = false;
  emit("close");
};

const handleCancel = () => {
  visible.value = false;
  emit("close");
};

const handleConfirm = () => {
  const page = form.value.selectedPage;
  if(page == textStore.currentPage) {
    visible.value = false;
    emit("close")
    return;
  }
  if (page >= 1 && page <= props.totalPages) {
    textStore.jumpPage(page);
    emit("jump-page", page);
    visible.value = false;
    emit("close");
  }

};
</script>

<style scoped lang="scss">
:deep(.el-dialog__wrapper) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  overflow: visible;
}

:deep(.el-dialog) {
  z-index: 10000;
}
</style>

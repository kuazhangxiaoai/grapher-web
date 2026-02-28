<template>
  <el-dialog
    title="跳页至"
    v-model="dialogVisible"
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
const dialogVisible = ref(false);
const form = ref({
  selectedPage: props.currentPage,
});

const pageOptions = computed(() => {
  const total = props.totalPages > 0 ? props.totalPages : 1;
  return Array.from({ length: total }, (_, i) => i + 1);
});

onMounted(() => {
  form.value.selectedPage = props.currentPage;
  dialogVisible.value = true;
});

const handleClose = () => {
  emit("close");
};

const handleCancel = () => {
  dialogVisible.value = false;
  emit("close");
};

const handleConfirm = () => {
  const page = form.value.selectedPage;
  if(page == textStore.currentPage) {
    emit("close")
    return;
  }
  if (page >= 1 && page <= props.totalPages) {
    textStore.jumpPage(page);
    emit("jump-page", page);
    dialogVisible.value = false;
    emit("close");
  }

};
</script>

<style scoped lang="scss"></style>

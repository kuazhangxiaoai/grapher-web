
<template>
  <div class="graph-tool">
    <div class="previous-page" title="上一页" @click="handlePreviousPageClick"/>
    <div class="next-page" title="下一页" @click="handleNextPageClick"/>
    <div class="jump-page" title="跳页至" @click="openJumpPageDialog"/>
    <div class="refresh" title="刷新"/>
    <div class="edit" title="编辑图谱"/>
    <JumpPageDialog
      v-if="showJumpPageDialog"
      :total-pages="textStore.totalPages"
      :current-page="textStore.currentPage"
      @close="showJumpPageDialog = false"
      @jump-page="handleJumpPage"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, watch, onUnmounted} from "vue";
import {useTextStore} from "@/store/useTextStore";
import {storeToRefs} from "pinia";
import JumpPageDialog from "@/components/common/JumpPageDialog.vue";
import {ElMessageBox} from "element-plus";
import { ElMessage as Message } from "element-plus";

const emit = defineEmits(["next-page", "jump-page", "refresh", "previous-page", "editgraph"]);
const textStore = useTextStore();
const showJumpPageDialog = ref(false);

const handlePreviousPageClick = () => {
  if(textStore.currentPage < 1) return;
  textStore.previousPage();
  notifyPageChange(textStore.currentPage);
  emit("previous-page");
}

const notifyPageChange = (num: number) => {
  const displayPage = num;
  Message({
    message: `当前页码：${displayPage}`,
    type: "info",
    customClass: "page-notify-message",
  });
};

const handleNextPageClick = () => {
  if(textStore.currentPage >= textStore.totalPages) return;
  textStore.nextPage()
  notifyPageChange(textStore.currentPage);
  emit("next-page");
}

const openJumpPageDialog = () => {
  showJumpPageDialog.value = true;
};

const handleJumpPage = (page: number) => {
  showJumpPageDialog.value = false;
  textStore.setCurrentPage(page);
  notifyPageChange(textStore.currentPage);
  emit("jump-page", page);
};

</script>

<style scoped lang="scss">
.graph-tool {
  position: absolute;
  display: flex;
  width: 202px;
  height: 100%;
  border: 2px solid #3dd2b0;
  background-color: #f8f9fa;
  border-radius: 10px;
}
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}
.nav-btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}
.nav-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.page-info {
  font-size: 12px;
  color: #606266;
}
.previous-page{
  position: relative;
  display: flex;
  width: 20%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/上一页.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.previous-page:hover{
  cursor: pointer;
  background-image: url('@/assets/images/上一页-点击.png');
}
.next-page{
  position: relative;
  display: flex;
  width: 20%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/下一页.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.next-page:hover{
  cursor: pointer;
  background-image: url('@/assets/images/下一页-点击.png');
}
.jump-page{
  position: relative;
  display: flex;
  width: 20%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/跳页.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.jump-page:hover{
  cursor: pointer;
  background-image: url('@/assets/images/跳页-点击.png');
}
.refresh{
  position: relative;
  display: flex;
  width: 20%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/刷新.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.refresh:hover{
  cursor: pointer;
  background-image: url('@/assets/images/刷新-点击.png');
}
.edit{
  position: relative;
  display: flex;
  width: 20%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/编辑1.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.edit:hover{
  cursor: pointer;
  background-image: url('@/assets/images/编辑2.png');
}
</style>

<template>
  <div class="editor-tool">
    <div class="submit" title="提交" @click="handleSubmitClick"/>
    <div class="clear" title="清除" @click="handleClearClick"/>
    <div class="quit" title="退出" @click="handleQuitClick"/>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {useTextStore} from "@/store/useTextStore";

const emit = defineEmits(["submit", "clear", "quit"]);
const textStore = useTextStore();
const showJumpPageDialog = ref(false);

const handleSubmitClick = () => {
  emit("submit");
}
const handleClearClick = () => {
  emit("clear");
}
const handleQuitClick = () => {
  emit("quit");
}


</script>

<style scoped lang="scss">
.editor-tool {
  position: absolute;
  display: flex;
  left: 50%;
  transform: translateX(-50%);
  width: 122px;
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
.submit{
  position: relative;
  display: flex;
  width: 33%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/提交.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.submit:hover{
  cursor: pointer;
  background-image: url('@/assets/images/提交-点击.png');
}
.clear{
  position: relative;
  display: flex;
  width: 33%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/清除.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.clear:hover{
  cursor: pointer;
  background-image: url('@/assets/images/清除-点击.png');
}
.zoom-in{
  position: relative;
  display: flex;
  width: 33%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/跳页.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.zoom-in:hover{
  cursor: pointer;
  background-image: url('@/assets/images/跳页-点击.png');
}
.zoom-out{
  position: relative;
  display: flex;
  width: 33%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/刷新.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.zoom-out:hover{
  cursor: pointer;
  background-image: url('@/assets/images/刷新-点击.png');
}
.quit{
  position: relative;
  display: flex;
  width: 33%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url('@/assets/images/退出.png');
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.quit:hover{
  cursor: pointer;
  background-image: url('@/assets/images/退出-点击.png');
}
</style>
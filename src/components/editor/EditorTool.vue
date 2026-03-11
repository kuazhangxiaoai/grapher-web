<template>
  <div class="editor-tool">
    <div class="submit" title="提交" @click="handleSubmitClick" />
    <div class="clear" title="清除" @click="handleClearClick" />
    <div class="quit" title="退出" @click="handleQuitClick" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTextStore } from "@/store/useTextStore";

const emit = defineEmits(["submit", "clear", "quit", "save-graph"]);
const textStore = useTextStore();
const showJumpPageDialog = ref(false);

const handleSubmitClick = () => {
  emit("save-graph");
};
const handleClearClick = () => {
  emit("clear");
};
const handleQuitClick = () => {
  emit("quit");
};
const handleSaveGraphClick = () => {
  emit("save-graph");
};
</script>

<style scoped lang="scss">
.editor-tool {
  position: absolute;
  display: flex;
  justify-content: space-between;
  align-items: center;
  // gap: 10px;
  left: 50%;
  transform: translateX(-50%);
  height: 60px;
  width: 200px;
  background: #ffffff;
  border: 0.5px solid rgba(226, 226, 226, 1);
  box-shadow: 0px 8px 10px 0px rgba(78, 89, 105, 0.18);
  border-radius: 40px;
  padding: 10px 15px;
  box-sizing: border-box;
}
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: #fff;
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
.submit {
  position: relative;
  display: flex;
  width: 30%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url("@/assets/images/提交.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.submit:hover {
  cursor: pointer;
  background-image: url("@/assets/images/提交-点击.png");
}
.clear {
  position: relative;
  display: flex;
  width: 30%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url("@/assets/images/清除.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.clear:hover {
  cursor: pointer;
  background-image: url("@/assets/images/清除-点击.png");
}
.zoom-in {
  position: relative;
  display: flex;
  width: 30%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url("@/assets/images/跳页.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.zoom-in:hover {
  cursor: pointer;
  background-image: url("@/assets/images/跳页-点击.png");
}
.zoom-out {
  position: relative;
  display: flex;
  width: 30%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url("@/assets/images/刷新.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.zoom-out:hover {
  cursor: pointer;
  background-image: url("@/assets/images/刷新-点击.png");
}
.quit {
  position: relative;
  display: flex;
  width: 30%;
  height: 100%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url("@/assets/images/退出.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.quit:hover {
  cursor: pointer;
  background-image: url("@/assets/images/退出-点击.png");
}
</style>

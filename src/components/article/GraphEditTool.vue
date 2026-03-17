<template>
  <div class="graph-tool">
    <div class="edit" title="编辑图谱" @click="openGraphEditor" />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits([
  "edit-graph",
]);

const openGraphEditor = () => {
  emit("edit-graph");
};
</script>

<style scoped lang="scss">
.graph-tool {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  height: auto;
  width: auto;
  background: #ffffff;
  border: 0.5px solid rgba(226, 226, 226, 1);
  box-shadow: 0px 8px 10px 0px rgba(78, 89, 105, 0.18);
  border-radius: 50px;
  padding: 15px 20px;
  box-sizing: border-box;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
.edit {
  position: relative;
  display: flex;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  place-content: center;
  align-items: center;
  padding: 2px 2px;
  background-image: url("@/assets/images/编辑1.png");
  background-size: contain;
  border-bottom: 1px solid #e4e7ed;
}
.edit:hover {
  cursor: pointer;
  background-image: url("@/assets/images/编辑2.png");
}
</style>
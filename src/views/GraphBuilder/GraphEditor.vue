<template>
  <div class="graph-editor">
    <div ref="graphRef" class="graph-canvas"></div>
    <div class="zoom-controls">
      <button class="zoom-btn" @click="zoomIn">
        <img src="@/assets/images/放大.png" alt="放大" class="zoom-icon" />
      </button>
      <div class="zoom-level">{{ zoomLevel }}%</div>
      <button class="zoom-btn" @click="zoomOut">
        <img src="@/assets/images/缩小.png" alt="缩小" class="zoom-icon" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">

</script>



<style scoped lang="scss">
.graph-editor {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 12%;
  left: 12%;
  width: 75%;
  height: 75%;
  overflow: hidden;
  background-color: #f5f8fb;
  background-image: radial-gradient(#e2dfdf 1px, transparent 1px);
  background-size: 20px 20px;
  border: #4caf50 3px solid;
  border-radius: 15px;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.zoom-controls {
  position: absolute;
  bottom: 25px;
  right: 28px;
  display: flex;
  align-items: center;
  border-radius: 40px;
  padding: 1px;
  background: #ffffff;
  border: 0.5px solid rgba(226, 226, 226, 1);
  box-shadow: 0px 2px 8px rgba(78, 89, 105, 0.18);
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
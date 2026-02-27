
<template>
  <div class="graph-tool">
    <button
        class="nav-btn"
        :disabled="!docId || currentPage <= 1"
        @click="goPrev"
    >
      上一页
    </button>
    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
    <button
        class="nav-btn"
        :disabled="!docId || currentPage >= totalPages"
        @click="goNext"
    >
      下一页
    </button>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
.graph-tool {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 5%;
  background: #3dd2b0;
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
</style>
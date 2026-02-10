<template>
  <div
    class="graph-context-menu"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
    }"
    @click.stop
  >
    <div v-if="!isNodeClick" class="menu-item" @click="handleAddEntity">
      <el-icon><Plus /></el-icon>
      <span>新增实体</span>
    </div>
    <div v-if="isNodeClick" class="menu-item" @click="handleCreateRelationship">
      <el-icon><Link /></el-icon>
      <span>创建关系</span>
    </div>
  </div>
</template>

<script setup>
import { Plus, Link } from "@element-plus/icons-vue";

const props = defineProps({
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  isNodeClick: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["add-entity", "create-relationship", "close"]);

const handleAddEntity = () => {
  emit("add-entity", props.position);
  emit("close");
};

const handleCreateRelationship = () => {
  emit("create-relationship");
  emit("close");
};
</script>

<style scoped>
.graph-context-menu {
  position: fixed;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.menu-item el-icon {
  font-size: 14px;
}
</style>

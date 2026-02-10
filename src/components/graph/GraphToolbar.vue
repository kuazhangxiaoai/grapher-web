<template>
  <div class="graph-toolbar">
    <div class="toolbar-item" @click="handleAddEntity">
      <el-icon><Plus /></el-icon>
      <span>新增实体</span>
    </div>
    <div class="toolbar-item" @click="handleCreateRelationship">
      <el-icon><Link /></el-icon>
      <span>创建关系</span>
    </div>
  </div>
</template>

<script setup>
import { Plus, Link } from '@element-plus/icons-vue'

const emit = defineEmits(['add-entity', 'create-relationship'])

const handleAddEntity = () => {
  emit('add-entity')
}

const handleCreateRelationship = () => {
  emit('create-relationship')
}
</script>

<style scoped>
.graph-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  background-color: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}

.toolbar-item:hover {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.toolbar-item el-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .graph-toolbar {
    top: 10px;
    left: 10px;
    padding: 6px;
  }

  .toolbar-item {
    padding: 6px 10px;
    font-size: 12px;
  }

  .toolbar-item span {
    display: none;
  }
}
</style>
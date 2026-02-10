<template>
  <el-dialog v-model="dialogVisible" title="新增领域" width="300px">
    <el-form :model="form" label-width="80px">
      <el-form-item label="领域名称">
        <el-input v-model="form.newDomainName" placeholder="请输入领域名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  newDomainName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:visible',
  'add-domain',
  'cancel'
])

const dialogVisible = ref(props.visible)
const form = ref({
  newDomainName: props.newDomainName
})

// 监听 visible 属性变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
})

// 监听 newDomainName 属性变化
watch(() => props.newDomainName, (newValue) => {
  form.value.newDomainName = newValue
})

const handleCancel = () => {
  dialogVisible.value = false
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = () => {
  if (form.value.newDomainName.trim()) {
    emit('add-domain', form.value.newDomainName.trim())
    dialogVisible.value = false
    emit('update:visible', false)
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
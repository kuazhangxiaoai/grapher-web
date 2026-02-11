<template>
  <main class="content">
    <div class="content-area">
      <!-- 子子级页面内容 -->
      <div v-if="currentSubDomain" class="sub-sub-domain-content">
        <!-- 新建图谱对话框 -->
        <div v-if="showGraphDialog" class="create-graph-dialog">
          <div class="dialog-content">
            <h3>新建图谱</h3>
            <div class="form-item">
              <label>图谱名称</label>
              <div class="form-content">
                <el-input v-model="graphName" placeholder="请输入" />
              </div>
            </div>
            <div class="form-item">
              <label>创建方式</label>
              <div class="form-content">
                <el-select v-model="createMethod" placeholder="请选择">
                  <el-option label="自文本创建" value="text" />
                  <el-option label="自数据库创建" value="database" />
                  <el-option label="任意创建" value="any" />
                </el-select>
              </div>
            </div>
            <div class="form-item" v-if="createMethod === 'text'">
              <label>上传附件</label>
              <div class="form-content">
                <el-upload
                  class="upload-demo"
                  action="#"
                  :on-change="handleFileChange"
                  :auto-upload="false"
                  :show-file-list="true"
                >
                  <el-button type="primary">上传附件</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持上传 docx、pdf 等格式文件
                    </div>
                  </template>
                </el-upload>
              </div>
            </div>
            <div class="form-item" v-if="createMethod === 'database'">
              <label>数据库选择</label>
              <div class="form-content">
                <el-select v-model="databaseName" placeholder="请选择数据库">
                  <el-option label="数据库1" value="db1" />
                  <el-option label="数据库2" value="db2" />
                  <el-option label="数据库3" value="db3" />
                </el-select>
              </div>
            </div>
            <div class="form-item" v-if="createMethod === 'any'">
              <label>任意创建</label>
              <div class="form-content">
                <el-input
                  type="textarea"
                  v-model="anyContent"
                  placeholder="请输入任意内容"
                />
              </div>
            </div>
            <div class="dialog-buttons">
              <el-button @click="handleCancelCreateGraph">取消</el-button>
              <el-button type="primary" @click="handleConfirmCreateGraph"
                >确定</el-button
              >
            </div>
          </div>
        </div>
        <!-- G6关系图 -->
        <div v-else class="relationship-graph">
          <div v-if="false">
            {{ console.log("Content组件接收到的graphNodes:", graphNodes) }}
          </div>
          <GraphContainer
            :nodes="graphNodes"
            :edges="graphEdges"
            @add-entity="handleAddEntity"
            @create-relationship="handleCreateRelationship"
            @node-click="handleNodeClick"
            @edge-click="handleEdgeClick"
            @graph-click="handleGraphClick"
          />
        </div>
      </div>
      <!-- 默认内容 -->
      <div class="content-buttons">
        <el-button size="small">类</el-button>
        <el-button size="small">关系</el-button>
        <el-button size="small">实例</el-button>
        <el-button size="small">规则</el-button>
        <el-button size="small">函数</el-button>
        <el-button size="small">事件</el-button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, watch } from "vue";
import { Plus } from "@element-plus/icons-vue";
import GraphContainer from "@/components/graph/GraphContainer.vue";

const props = defineProps({
  currentSubDomain: {
    type: String,
    default: "",
  },
  hasData: {
    type: Boolean,
    default: false,
  },
  graphNodes: {
    type: Array,
    default: () => [],
  },
  entityProperties: {
    type: Array,
    default: () => [],
  },
  showGraphDialog: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "add-entity",
  "create-relationship",
  "create-graph",
  "close-graph-dialog",
]);

// 图谱边数据
const graphEdges = ref([]);

// 新建图谱相关状态
const graphName = ref("");
const createMethod = ref("");
const uploadedFile = ref(null);
const databaseName = ref("");
const anyContent = ref("");

// 处理添加实体
const handleAddEntity = (position) => {
  emit("add-entity", position);
};

// 处理创建关系
const handleCreateRelationship = () => {
  emit("create-relationship");
};

// 处理节点点击
const handleNodeClick = (node) => {
  console.log("节点点击:", node);
};

// 处理边点击
const handleEdgeClick = (edge) => {
  console.log("边点击:", edge);
};

// 处理图谱点击
const handleGraphClick = (event) => {
  console.log("图谱点击:", event);
};

// 监听graphNodes的变化
watch(
  () => props.graphNodes,
  (newValue) => {
    console.log("Content组件的graphNodes变化:", newValue);
  },
  { deep: true },
);

// 处理文件上传
const handleFileChange = (file) => {
  uploadedFile.value = file.raw;
};

// 处理取消创建图谱
const handleCancelCreateGraph = () => {
  // 重置表单
  graphName.value = "";
  createMethod.value = "";
  uploadedFile.value = null;
  databaseName.value = "";
  anyContent.value = "";
  // 关闭对话框
  emit("close-graph-dialog");
};

// 处理确认创建图谱
const handleConfirmCreateGraph = () => {
  if (graphName.value && createMethod.value) {
    // 准备图谱数据
    const graphData = {
      name: graphName.value,
      createMethod: createMethod.value,
      file: createMethod.value === "text" ? uploadedFile.value : null,
      databaseName: createMethod.value === "database" ? databaseName.value : "",
      anyContent: createMethod.value === "any" ? anyContent.value : "",
    };
    // 触发创建图谱事件
    emit("create-graph", graphData);
    // 重置表单
    graphName.value = "";
    createMethod.value = "";
    uploadedFile.value = null;
    databaseName.value = "";
    anyContent.value = "";
    // 关闭对话框
    emit("close-graph-dialog");
  }
};
</script>

<style scoped>
.content {
  flex: 1;
  /* padding: 20px; */
  overflow: auto;
  background-color: #f5f7fa;
}

.content-area {
  width: 100%;
  height: 100%;
  background-color: #f5f8fb;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-image: radial-gradient(#e9e9e9 1px, transparent 1px);
  background-size: 20px 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 关系图 */
.relationship-graph {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  position: relative;
  width: 100%;
  height: calc(100% - 40px);
}

/* 子子级页面内容 */
.sub-sub-domain-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 新建图谱对话框 */
.create-graph-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dialog-content h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
  color: #333;
}

.form-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.form-item label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
  margin-top: 4px;
}

.form-item .form-content {
  flex: 1;
}

.dialog-buttons {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.upload-demo {
  margin-top: 8px;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.content-buttons {
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  justify-content: center;
  width: 100%;
}

.content-buttons .el-button {
  border-radius: 4px;
  padding: 6px 12px;
}

.el-button + .el-button {
  margin-left: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content {
    padding: 10px;
  }

  .content-area {
    padding: 10px;
  }
}
</style>

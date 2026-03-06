<template>
  <aside class="right-property-panel">
    <!-- 根据选中类型只显示其一：未选择 / 节点属性 / 关系属性 -->
    <div class="panel-content">
      <!-- 未选择：提示先选节点或关系 -->
      <div
        v-if="!selectedNode && !selectedEdge"
        class="section"
      >
      </div>

      <!-- 节点属性：仅编辑节点时显示 -->
      <div v-else-if="selectedNode" class="section">
        <div class="header">
          <div class="title">节点属性</div>
        </div>
        <div class="body">
          <el-form
            ref="nodeFormRef"
            :model="nodeForm"
            label-position="top"
            size="small"
            class="property-form"
          >
            <el-form-item label="名称" prop="name">
              <el-input
                v-model="nodeForm.name"
                placeholder="节点名称"
                clearable
              />
            </el-form-item>
            <template v-if="propertyList.length > 0">
              <el-form-item
                v-for="(item, index) in propertyList"
                :key="item.key ?? index"
                :label="(item.key || '属性') + ' :'"
                :prop="'props.' + String(item.key || `field_${index}`)"
              >
                <el-input
                  v-if="item.type === 'String' || !item.type"
                  v-model="nodeForm.props[item.key ?? `field_${index}`]"
                  placeholder="属性值"
                  clearable
                />
                <el-input-number
                  v-else-if="item.type === 'Number'"
                  v-model="nodeForm.props[item.key ?? `field_${index}`]"
                  controls-position="right"
                  class="full-width"
                />
                <el-date-picker
                  v-else-if="item.type === 'Date'"
                  v-model="nodeForm.props[item.key ?? `field_${index}`]"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  class="full-width"
                />
                <el-select
                  v-else-if="item.type === 'Boolean'"
                  v-model="nodeForm.props[item.key ?? `field_${index}`]"
                  placeholder="请选择"
                  class="full-width"
                >
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
                <el-input
                  v-else
                  v-model="nodeForm.props[item.key ?? `field_${index}`]"
                  placeholder="属性值"
                  clearable
                />
              </el-form-item>
            </template>
            <div v-else class="empty-hint small">该节点类型暂无属性定义</div>
          </el-form>
        </div>
      </div>

      <!-- 关系属性：仅编辑关系时显示 -->
      <div v-else-if="selectedEdge" class="section">
        <div class="header">
          <div class="title">关系属性</div>
        </div>
        <div class="body">
          <el-form
            ref="edgeFormRef"
            :model="edgeForm"
            label-position="top"
            size="small"
            class="property-form"
          >
            <el-form-item label="关系名称" prop="name">
              <el-input
                v-model="edgeForm.name"
                placeholder="关系名称"
                clearable
              />
            </el-form-item>
            <el-form-item
              v-if="selectedEdge.source !== undefined || selectedEdge.target !== undefined"
              label="端点"
            >
              <div class="endpoints">
                {{ sourceLabel }} → {{ targetLabel }}
              </div>
            </el-form-item>
            <template v-if="edgePropertyList.length > 0">
              <el-form-item
                v-for="(item, index) in edgePropertyList"
                :key="(item.key || index) + '-edge'"
                :label="(item.key || '属性') + ' :'"
                :prop="'props.' + String(item.key || `field_${index}`)"
              >
                <el-input
                  v-if="item.type === 'String' || !item.type"
                  v-model="edgeForm.props[item.key ?? `field_${index}`]"
                  placeholder="属性值"
                  clearable
                />
                <el-input-number
                  v-else-if="item.type === 'Number'"
                  v-model="edgeForm.props[item.key ?? `field_${index}`]"
                  controls-position="right"
                  class="full-width"
                />
                <el-date-picker
                  v-else-if="item.type === 'Date'"
                  v-model="edgeForm.props[item.key ?? `field_${index}`]"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  class="full-width"
                />
                <el-input
                  v-else
                  v-model="edgeForm.props[item.key ?? `field_${index}`]"
                  placeholder="属性值"
                  clearable
                />
              </el-form-item>
            </template>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="footer">
      <el-button class="cancel-btn" size="small" @click="handleCancel">
        取消
      </el-button>
      <el-button class="save-btn" type="primary" size="small" @click="handleSave">
        保存
      </el-button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { NodeProperty, EdgeProperty } from "@/configs/graph";

export type EditorNode = {
  id: string | number;
  name?: string;
  type?: string;
  x?: number;
  y?: number;
  color?: string;
  backgroundColor?: string;
  properties?: NodeProperty[];
  nodeTemplateId?: string | number;
};

export type EditorEdge = {
  id?: string | number;
  source: string | number;
  target: string | number;
  data?: { name?: string; type?: string; [k: string]: unknown };
  properties?: EdgeProperty[];
};

const props = withDefaults(
  defineProps<{
    selectedNode: EditorNode | null;
    selectedEdge: EditorEdge | null;
    /** 当前选中节点对应的模板属性（key/type），用于展示表单项 */
    nodeTemplateProperties?: NodeProperty[];
    /** 节点列表，用于解析边的 source/target 显示名称 */
    nodes?: EditorNode[];
  }>(),
  {
    nodeTemplateProperties: () => [],
    nodes: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:node", node: EditorNode): void;
  (e: "update:edge", edge: EditorEdge): void;
  (e: "save"): void;
  (e: "cancel"): void;
}>();

/** 节点表单数据：name + 动态属性 props */
const nodeForm = ref<{ name: string; props: Record<string, unknown> }>({
  name: "",
  props: {},
});

/** 关系表单数据：name + 动态属性 props */
const edgeForm = ref<{ name: string; props: Record<string, unknown> }>({
  name: "",
  props: {},
});

const nodeFormRef = ref();
const edgeFormRef = ref();

/** 合并模板属性与节点已有属性，得到可编辑列表（只读，用于同步到 localPropertyList） */
function buildPropertyList(): NodeProperty[] {
  const node = props.selectedNode;
  const template = props.nodeTemplateProperties ?? [];
  const existing = (node?.properties ?? []) as NodeProperty[];
  const byKey = new Map<string, NodeProperty>();
  template.forEach((p) => {
    const key = (p.key ?? "").toString();
    if (!key) return;
    const exist = existing.find((e) => (e.key ?? "").toString() === key);
    byKey.set(key, {
      key,
      type: p.type ?? "String",
      value: exist?.value ?? p.value ?? "",
    });
  });
  if (byKey.size === 0 && existing.length > 0) {
    existing.forEach((p) => {
      const key = (p.key ?? "").toString() || "未命名";
      byKey.set(key, { key, type: p.type ?? "String", value: p.value ?? "" });
    });
  }
  return Array.from(byKey.values());
}

/** 节点属性列表（key + type），用于渲染表单项，值在 nodeForm.props 中 */
const propertyList = computed(() => buildPropertyList());

watch(
  () => [props.selectedNode, props.nodeTemplateProperties] as const,
  () => {
    if (props.selectedNode) {
      const list = buildPropertyList();
      nodeForm.value = {
        name: props.selectedNode.name ?? "",
        props: Object.fromEntries(list.map((p) => [p.key ?? "", p.value ?? ""])),
      };
    } else {
      nodeForm.value = { name: "", props: {} };
    }
  },
  { immediate: true, deep: true }
);

function buildEdgePropertyList(): EdgeProperty[] {
  const edge = props.selectedEdge;
  const list = (edge?.properties ?? []) as EdgeProperty[];
  if (list.length > 0) return list.map((p) => ({ ...p }));
  const data = edge?.data;
  if (data && typeof data === "object") {
    return Object.entries(data)
      .filter(([k]) => k !== "name" && k !== "type")
      .map(([key, value]) => ({ key, type: "String" as string, value }));
  }
  return [];
}

/** 关系属性列表（key + type），用于渲染表单项，值在 edgeForm.props 中 */
const edgePropertyList = computed(() => buildEdgePropertyList());

watch(
  () => props.selectedEdge,
  (edge) => {
    if (edge) {
      const list = buildEdgePropertyList();
      const name = edge.data?.name ?? (edge as unknown as { name?: string }).name ?? "";
      edgeForm.value = {
        name,
        props: Object.fromEntries(list.map((p) => [p.key ?? "", p.value ?? ""])),
      };
    } else {
      edgeForm.value = { name: "", props: {} };
    }
  },
  { immediate: true, deep: true }
);

const sourceLabel = computed(() => {
  const edge = props.selectedEdge;
  const nodes = props.nodes ?? [];
  if (!edge) return "";
  const id = edge.source;
  const n = nodes.find((x) => String(x.id) === String(id));
  return n?.name ?? String(id);
});

const targetLabel = computed(() => {
  const edge = props.selectedEdge;
  const nodes = props.nodes ?? [];
  if (!edge) return "";
  const id = edge.target;
  const n = nodes.find((x) => String(x.id) === String(id));
  return n?.name ?? String(id);
});

function emitNodeUpdate() {
  const node = props.selectedNode;
  if (!node) return;
  const form = nodeForm.value;
  const next: EditorNode = {
    ...node,
    name: (form.name as string)?.trim() || node.name,
    properties: propertyList.value.map((p) => ({
      key: p.key,
      type: p.type,
      value: form.props[p.key ?? ""],
    })),
  };
  emit("update:node", next);
}

function emitEdgeUpdate() {
  const edge = props.selectedEdge;
  if (!edge) return;
  const form = edgeForm.value;
  const nextData = { ...(edge.data ?? {}), name: (form.name as string)?.trim() };
  const next: EditorEdge = {
    ...edge,
    data: nextData,
    properties: edgePropertyList.value.map((p) => ({
      key: p.key,
      type: p.type,
      value: form.props[p.key ?? ""],
    })),
  };
  emit("update:edge", next);
}

function handleSave() {
  if (props.selectedNode) {
    emitNodeUpdate();
  } else if (props.selectedEdge) {
    emitEdgeUpdate();
  }
  emit("save");
}

function handleCancel() {
  if (props.selectedNode) {
    const list = buildPropertyList();
    nodeForm.value = {
      name: props.selectedNode.name ?? "",
      props: Object.fromEntries(list.map((p) => [p.key ?? "", p.value ?? ""])),
    };
  } else if (props.selectedEdge) {
    const edge = props.selectedEdge;
    const list = buildEdgePropertyList();
    const name = edge.data?.name ?? (edge as unknown as { name?: string }).name ?? "";
    edgeForm.value = {
      name,
      props: Object.fromEntries(list.map((p) => [p.key ?? "", p.value ?? ""])),
    };
  }
  emit("cancel");
}
</script>

<style scoped lang="scss">
.right-property-panel {
  width: 260px;
  min-width: 220px;
  height: 100%;
  background: #ffffff;
  border-left: 1px solid rgba(226, 226, 226, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 6px 0 8px;
}

.panel-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.footer {
  flex: 0 0 auto;
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid rgba(238, 238, 238, 1);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: #fff;
  position: relative;
  z-index: 1;
}

.save-btn {
  background-color: rgba(61, 210, 176, 1) !important;
  border-color: rgba(61, 210, 176, 1) !important;
  color: white !important;
}

.save-btn:hover {
  background-color: rgba(61, 210, 176, 0.9) !important;
  border-color: rgba(61, 210, 176, 0.9) !important;
}

.cancel-btn {
  background-color: white !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}

.cancel-btn:hover {
  background-color: #f5f7fa !important;
  border-color: #c0c4cc !important;
}

.section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 2px 0 6px;
  border-bottom: 1px solid rgba(238, 238, 238, 1);
  overflow: hidden;
}

.header {
  padding: 6px 12px 4px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.body {
  flex: 1;
  min-height: 0;
  padding: 8px 12px 12px;
  overflow: auto;
}

.property-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
  :deep(.el-form-item__label) {
    font-size: 12px;
    color: #666;
    height: auto;
    line-height: 1.5;
    padding-bottom: 4px;
  }
}

.full-width {
  width: 100%;
}

.endpoints {
  font-size: 12px;
  color: #666;
  padding: 6px 8px;
  background: rgba(245, 248, 251, 1);
  border-radius: 6px;
}

.empty-hint {
  padding: 16px 12px;
  font-size: 13px;
  color: rgba(153, 153, 153, 1);
  line-height: 1.5;

  &.small {
    padding: 8px 0;
    font-size: 12px;
  }
}

:deep(.el-input),
:deep(.el-input-number),
:deep(.el-date-picker),
:deep(.el-select) {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-input-number__wrapper) {
  border-radius: 6px;
  border: 1px solid rgba(226, 226, 226, 1);
  box-shadow: none;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input-number__wrapper:hover) {
  border-color: rgba(61, 210, 176, 0.6);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-input-number__wrapper.is-focus) {
  border-color: rgba(61, 210, 176, 1);
  box-shadow: 0 0 0 1px rgba(61, 210, 176, 0.2);
}
</style>

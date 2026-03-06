<template>
  <aside class="left-template-panel">
    <!-- 实体类型 -->
    <div class="section">
      <div class="header">
        <div class="title">{{ props.title }}</div>
      </div>

      <div class="list">
        <div
            v-for="t in props.nodeTemplates"
            :key="t.name"
            class="item"
            draggable="true"
            @dragstart="(e) => onDragStart(e, t)"
            :title="t.name"
        >
          <span class="dot" :style="{ backgroundColor: t.color || '#43D7B5' }" />
          <span class="name">{{ t.name }}</span>
        </div>

        <div v-if="!props.nodeTemplates?.length" class="empty">
          暂无实体类型
        </div>
      </div>
    </div>

    <!-- 关系类型 -->
    <div class="section relation-section">
      <div class="header">
        <div class="title">关系类型</div>
      </div>

      <div class="list">
        <div
            v-for="t in props.edgeTemplates"
            :key="`rel-${t.id || t.name}`"
            class="item relation-item"
            :class="{ 'item--selected': isEdgeSelected(t) }"
            @click="(e) => onEdgeClick(e, t)"
            :title="t.name"
        >
          <span class="dot" :style="{ backgroundColor: t.color || '#43D7B5' }" />
          <span class="name">{{ t.name }}</span>
        </div>

        <div v-if="!props.edgeTemplates?.length" class="empty">
          暂无关系类型
        </div>
      </div>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { ref } from "vue";
import type { NodeTemplate, EdgeTemplate } from "@/configs/graph";

const props = withDefaults(
  defineProps<{
    nodeTemplates: NodeTemplate[];
    edgeTemplates: EdgeTemplate[];
    title?: string;
  }>(),
  {
    nodeTemplates: () => [],
    edgeTemplates: () => [],
    title: "实体类型",
  },
);

/** 当前选中的关系类型 id；再次点击同一项时置空，高亮取消 */
const selectedEdgeId = ref<string | null>(null);
const DRAG_MIME = "application/x-grapher-node-template";

const onDragStart = (e: DragEvent, template: NodeTemplate) => {
  if (!e.dataTransfer) return;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(template));
  e.dataTransfer.setData("text/plain", template.name ?? "");
};

const onEdgeClick = (_e: MouseEvent, template: EdgeTemplate) => {
  const id = String(template.id ?? template.name ?? "");
  if (selectedEdgeId.value === id) {
    selectedEdgeId.value = null;
  } else {
    selectedEdgeId.value = id;
  }
};

const isEdgeSelected = (t: EdgeTemplate) => {
  const id = String(t.id ?? t.name ?? "");
  return id !== "" && selectedEdgeId.value === id;
};
</script>

<style scoped lang="scss">
.left-template-panel {
  width: 220px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid rgba(226, 226, 226, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 6px 0 8px;
}

.section {
  flex: 0 0 auto;
  padding: 2px 0 6px;
  border-bottom: 1px solid rgba(238, 238, 238, 1);
}

.relation-section {
  margin-top: 4px;
}

.header {
  padding: 6px 12px 4px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(102, 102, 102, 1);
}

.list {
  padding: 6px 8px 2px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item {
  user-select: none;
  cursor: grab;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px;
  border-radius: 8px;
  border: 1px solid rgba(226, 226, 226, 1);
  background: rgba(245, 248, 251, 1);
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
  box-sizing: border-box;
  flex: 0 0 calc(50% - 6px);
}

.item:active {
  cursor: grabbing;
  transform: scale(0.99);
}

.item:hover {
  border-color: rgba(61, 210, 176, 1);
  background: rgba(67, 215, 181, 0.12);
}

.relation-item {
  cursor: pointer;
}

.relation-item:active {
  cursor: pointer;
  transform: none;
}

.item--selected {
  border-color: rgba(61, 210, 176, 1);
  background: rgba(67, 215, 181, 0.2);
  box-shadow: 0 0 0 2px rgba(61, 210, 176, 0.35);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 10px;
}

.name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  padding: 10px 6px;
  font-size: 12px;
  color: rgba(153, 153, 153, 1);
}
</style>
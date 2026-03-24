<template>
  <aside class="right-panel" v-if="showPropertyPanel">
    <div class="property-panel">
      <div class="property-panel-header">
        <div class="header-left">
          <img src="@/assets/images/面板设置.png" alt="属性面板图标" />
          <h3>属性面板</h3>
        </div>
      </div>
      <div class="property-panel-body">
        <!-- 实体属性 -->
        <div v-if="currentOperation === 'entity'">
          <div class="property-item">
            <label>实体模板名称</label>
            <el-input
              v-model="localEntityName"
              placeholder="请输入~"
              disabled
            ></el-input>
          </div>
          <div class="property-item" v-if="operationSource === 'canvas'">
            <label>节点名称</label>
            <el-autocomplete
              v-model="localNodeName"
              placeholder="请输入~"
              :fetch-suggestions="fetchNodeNames"
              @select="handleNodeNameSelect"
              style="width: 100%"
            >
              <!-- <template #prefix>
                <el-icon class="el-input__icon">
                  <Search />
                </el-icon>
              </template> -->
            </el-autocomplete>
          </div>
          <div class="property-item">
            <label>定义描述</label>
            <el-input
              v-model="localEntityDescription"
              placeholder="请输入~"
              type="textarea"
              :maxlength="60"
              resize="none"
              :rows="3"
              :disabled="operationSource !== 'canvas'"
            ></el-input>
          </div>
          <div class="property-item">
            <div class="property-label">
              <label>属性</label>
              <span class="property-count"
                >{{ localEntityProperties.length }}个</span
              >
            </div>
            <div class="properties-list">
              <div
                v-if="localEntityProperties.length === 0"
                class="empty-properties"
              >
                暂无属性
              </div>
              <div
                v-for="(property, index) in localEntityProperties"
                :key="'prop-' + index + '-' + (property.name || index)"
                class="property-row"
              >
                <div class="property-name-container">
                  <div class="property-name">
                    {{ property.name || "未命名属性" }}
                  </div>
                  <!-- <el-button
                    v-if="nodeTemplateId==0"
                    type="text"
                    class="delete-property-btn"
                    @click="handleDeleteProperty(index)"
                  >
                    ×
                  </el-button> -->
                </div>
                <template v-if="operationSource === 'library'">
                  <el-select
                    v-model="property.type"
                    style="width: 100%"
                    :popper-append-to-body="false"
                    :disabled="nodeTemplateId > 0 && !property.isNew"
                  >
                    <el-option label="文本" value="string"></el-option>
                    <el-option label="日期" value="date"></el-option>
                    <el-option label="数字" value="number"></el-option>
                    <el-option label="布尔" value="boolean"></el-option>
                    <el-option label="对象" value="object"></el-option>
                    <el-option label="数组" value="array"></el-option>
                  </el-select>
                </template>
                <template v-else>
                  <el-input
                    v-model="property.value"
                    style="width: 100%"
                    placeholder="请输入值"
                    @blur="handleInputBlur(property, index)"
                  ></el-input>
                </template>
              </div>
            </div>
            <!-- <el-button
              type="primary"
              size="small"
              class="add-property-btn"
              @click="handleAddProperty"
            >
              <el-icon class="plusIcon"><Plus /></el-icon> 新增属性
            </el-button> -->
          </div>
          <div class="property-item">
            <label>背景颜色</label>
            <el-color-picker
              v-model="localBackgroundColor"
              show-alpha
              size="large"
              disabled
            ></el-color-picker>
          </div>
          <!-- <div class="property-item lines">
            <label>加入组件库</label>
            <el-switch
              v-model="localAddToComponentLibrary"
              active-text=""
            ></el-switch>
          </div> -->
        </div>

        <!-- 关系属性 -->
        <div v-else-if="currentOperation === 'relationship'">
          <div class="property-item">
            <label>关系模板名称</label>
            <el-input
              v-model="localRelationshipName"
              placeholder="请输入~"
              disabled
            ></el-input>
          </div>
          <div class="property-item" v-if="operationSource === 'canvas'">
            <label>关系名称</label>
            <el-autocomplete
              v-model="localRelationName"
              placeholder="请输入~"
              :fetch-suggestions="fetchRelationNames"
              @select="handleRelationNameSelect"
              style="width: 100%"
            >
              <!-- <template #prefix>
                <el-icon class="el-input__icon">
                  <Search />
                </el-icon>
              </template> -->
            </el-autocomplete>
          </div>
          <!-- <div class="property-item">
            <label>定义描述</label>
            <el-input
              v-model="localRelationshipDescription"
              placeholder="请输入~"
              type="textarea"
              :maxlength="60"
              resize="none"
              :rows="3"
            ></el-input>
          </div> -->
          <div class="property-item">
            <label>关系类型</label>
            <el-select
              v-model="localRelationshipType"
              style="width: 100%"
              :popper-append-to-body="false"
              disabled
            >
              <el-option label="定向" value="定向"></el-option>
              <el-option label="双向" value="双向"></el-option>
              <el-option label="循环" value="循环"></el-option>
            </el-select>
          </div>
          <div class="property-item">
            <label>开始实体</label>
            <!-- <div class="entity-name-display">
              {{ localStartNodeName || "无" }}
            </div> -->
            <el-input
              v-model="localStartNodeName"
              placeholder="暂无"
              disabled
            ></el-input>
          </div>
          <div class="property-item">
            <label>结束实体</label>
            <!-- <div class="entity-name-display">
              {{ localEndNodeName || "无" }}
            </div> -->
             <el-input
              v-model="localEndNodeName"
              placeholder="暂无"
              disabled
            ></el-input>
          </div>
          <div class="property-item"  v-if="operationSource === 'canvas' && showReferenceText">
            <label>触发词</label>
            <el-select
              v-model="selectedTriggerWord"
              style="width: 100%"
              :popper-append-to-body="false"
              filterable
              clearable
              placeholder="请选择触发词"
              @visible-change="handleTriggerWordVisible"
            >
              <el-option
                v-for="(item, index) in triggerWordList"
                :key="index"
                :label="item.word"
                :value="item.offset"
              ></el-option>
            </el-select>
          </div>
          <div class="property-item">
            <div class="property-label">
              <label>属性</label>
              <span class="property-count"
                >{{ localEntityProperties.length }}个</span
              >
            </div>
            <div class="properties-list">
              <div
                v-if="localEntityProperties.length === 0"
                class="empty-properties"
              >
                暂无属性
              </div>
              <div
                v-for="(property, index) in localEntityProperties"
                :key="'prop-' + index + '-' + (property.name || index)"
                class="property-row"
              >
                <div class="property-name-container">
                  <div class="property-name">
                    {{ property.name || "未命名属性" }}
                  </div>
                  <!-- <el-button
                    v-if="relationTemplateId==0"
                    type="text"
                    class="delete-property-btn"
                    @click="handleDeleteProperty(index)"
                  >
                    ×
                  </el-button> -->
                </div>
                <template v-if="operationSource != 'canvas'">
                  <el-select
                    v-model="property.type"
                    style="width: 100%"
                    :popper-append-to-body="false"
                    :disabled="relationTemplateId > 0 && !property.isNew"
                  >
                    <el-option label="文本" value="string"></el-option>
                    <el-option label="日期" value="date"></el-option>
                    <el-option label="数字" value="number"></el-option>
                    <el-option label="布尔" value="boolean"></el-option>
                    <el-option label="对象" value="object"></el-option>
                    <el-option label="数组" value="array"></el-option>
                  </el-select>
                </template>
                <template v-else>
                  <el-input
                    v-model="property.value"
                    style="width: 100%"
                    placeholder="请输入值"
                    @blur="handleInputBlur(property, index)"
                  ></el-input>
                </template>
              </div>
            </div>
            <!-- <el-button
             v-if="relationTemplateId==0&&isCreatingRelationship"
              type="primary"
              size="small"
              class="add-property-btn"
              @click="handleAddProperty"
            >
              <el-icon class="plusIcon"><Plus /></el-icon> 新增属性
            </el-button> -->
          </div>
          <!-- <div class="property-item lines">
            <label>加入组件库</label>
            <el-switch
              v-model="localAddToComponentLibrary"
              active-text=""
            ></el-switch>
          </div> -->
        </div>
      </div>
      <div class="property-panel-footer">
        <el-button
          size="small"
          class="close-btn"
          @click="handleClosePropertyPanel"
          :disabled="isLoading"
          >关闭</el-button
        >
        <el-button
          type="danger"
          size="small"
          class="delete-btn"
          @click="handleDeletePropertyPanel"
       
          v-if="operationSource === 'canvas'"
          >删除</el-button
        >
        <el-button
          type="success"
          size="small"
          class="save-btn"
          @click="handleSavePropertyPanel"
          :loading="isLoading"
          :disabled="isLoading"
          v-if="operationSource === 'canvas'"
          >保存</el-button
        >
        <!-- <el-button
          type="success"
          size="small"
          class="save-btn"
          @click="handleSavePropertyPanel"
          :loading="isLoading"
          :disabled="isLoading"
          v-if="currentOperation === 'relationship'&&(isCreatingRelationship||relationTemplateId ==0)"
          >保存</el-button
        > -->
      </div>
    </div>
  </aside>

  <!-- 新增属性对话框 -->
  <el-dialog
    v-model="addPropertyDialogVisible"
    title="新增属性"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form :model="newProperty" label-width="100px">
      <el-form-item label="属性名称" required>
        <el-input
          v-model="newProperty.name"
          placeholder="请输入属性名称"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="属性类型">
        <el-select v-model="newProperty.type" style="width: 100%">
          <el-option label="文本" value="string"></el-option>
          <el-option label="日期" value="date"></el-option>
          <el-option label="数字" value="number"></el-option>
          <el-option label="布尔" value="boolean"></el-option>
          <el-option label="对象" value="object"></el-option>
          <el-option label="数组" value="array"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="cancel-btn" @click="addPropertyDialogVisible = false"
          >取消</el-button
        >
        <el-button
          class="confirm-btn"
          type="primary"
          @click="handleConfirmAddProperty"
          >确定</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted,computed } from "vue";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import graph from "@/services/graph";

const props = defineProps({
  showPropertyPanel: {
    type: Boolean,
    default: false,
  },
  currentOperation: {
    type: String,
    default: "",
  },
  entityName: {
    type: String,
    default: "",
  },
  nodeName: {
    type: String,
    default: "",
  },
  entityDescription: {
    type: String,
    default: "",
  },
  entityProperties: {
    type: Array,
    default: () => [],
  },
  relationshipName: {
    type: String,
    default: "",
  },
  relationName: {
    type: String,
    default: "",
  },
  relationshipDescription: {
    type: String,
    default: "",
  },
  relationshipType: {
    type: String,
    default: "定向",
  },
  startNodeName: {
    type: String,
    default: "",
  },
  endNodeName: {
    type: String,
    default: "",
  },
  addToComponentLibrary: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: "#43D7B5",
  },
  topicId: {
    type: String,
    default: "",
  },
  startNodeTemplateId: {
    type: Number,
    default: 0,
  },
  endNodeTemplateId: {
    type: Number,
    default: 0,
  },
  nodeTemplateId: {
    type: Number,
    default: 0,
  },
  relationTemplateId: {
    type: Number,
    default: 0,
  },
  isFromComponentLibrary: {
    type: Boolean,
    default: false,
  },
  isFromCanvas: {
    type: Boolean,
    default: false,
  },
  isCreatingRelationship: {
    type: Boolean,
    default: false,
  },
  referenceContent: {
    type: String,
    default: "",
  },
  showReferenceText: {
    type: Boolean,
    default: true,
  },
  operationSource: {
    type: String,
    default: "",
  },
  relationTrigger: {
    type: String,
    default: "",
  },
  articleId: {
    type: String,
    default: "",
  },
  domainId: {
    type: String,
    default: "",
  },
  sequenceId: {
    type: String,
    default: "",
  },
  currentLevel: {
    type: Number,
    default: null,
  },
  currentGraphCreateMethod: {
    type: String,
    default: "",
  },
  nodeId: {
    type: String,
    default: "",
  },
  nodeHash: {
    type: String,
    default: "",
  },
  relationId: {
    type: String,
    default: "",
  },
  relationHash: {
    type: String,
    default: "",
  },
  startNodeId: {
    type: String,
    default: "",
  },
  endNodeId: {
    type: String,
    default: "",
  },
  startNodeHash: {
    type: String,
    default: "",
  },
  endNodeHash: {
    type: String,
    default: "",
  },
  selectedSequence: {
    type: Object,
    default: () => null,
  },
  marks: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "cancel", "save", "add-property", "delete-item", "update-nodes"]);

// 本地状态
const localEntityName = ref(props.entityName);
// 当操作来源是画布且nodeName未定义时，设置为空字符串
const localNodeName = ref(props.operationSource === 'canvas' && props.nodeName === undefined ? '' : (props.nodeName !== undefined ? props.nodeName : props.entityName));
const localEntityDescription = ref(props.entityDescription);
const localEntityProperties = ref([]);
const localRelationshipName = ref(props.relationshipName);
// 当正在创建关系时，关系名称置空
const localRelationName = ref(props.isCreatingRelationship ? '' : (props.relationName || props.relationshipName));
const localRelationshipDescription = ref(props.relationshipDescription);
const localRelationshipType = ref(props.relationshipType);
const localStartNodeName = ref(props.startNodeName);
const localEndNodeName = ref(props.endNodeName);
const localAddToComponentLibrary = ref(props.addToComponentLibrary);
const localBackgroundColor = ref("#43D7B5");

// 触发词相关
const triggerWordList = ref([]);
const selectedTriggerWord = ref(props.relationTrigger);

// 加载状态
const isLoading = ref(false);

// 节点名称和关系名称搜索相关
const nodeNameOptions = ref([]);
const relationNameOptions = ref([]);
const isLoadingNodeNames = ref(false);
const isLoadingRelationNames = ref(false);

// 新增属性对话框相关
const addPropertyDialogVisible = ref(false);
const newProperty = ref({ name: "", type: "string" });

// 标记是否正在添加属性，避免被props更新覆盖
const isAddingProperty = ref(false);

// 保存从getSequenceList获取到的最新sequenceId
const latestSequenceIdFromServer = ref("");

// 跟踪面板之前的状态，用于判断是否是重新打开
const wasPanelOpen = ref(false);

// 计算段落内容（用于段落下保存时传递 sequenceContent）
const content = computed(() => {
  // 优先使用选中的段落内容
  if (props.selectedSequence && props.selectedSequence.sequenceContent) {
    return props.selectedSequence.sequenceContent;
  }
  // 如果没有选中的段落，使用marks中的内容
  if (!props.marks || props.marks.length === 0) return "";
  return props.marks.map((mark) => mark.content ?? "").join("");
});

// 计算段落位置列表（用于段落下保存时传递 sequencePositionList）
const sequencePositionList = computed(() => {
  if (props.selectedSequence && props.selectedSequence.sequencePositionList) {
    return props.selectedSequence.sequencePositionList;
  }
  if (props.marks && props.marks.length > 0) {
    return props.marks.flatMap(mark =>
      mark.rects && mark.rects.length > 0
        ? mark.rects.map(rect => ({
            sequenceX0: rect.x0,
            sequenceY0: rect.y0,
            sequenceX1: rect.x1,
            sequenceY1: rect.y1,
            sequencePage: rect.page
          }))
        : []
    );
  }
  return [];
});

// 初始化属性列表
localEntityProperties.value = props.entityProperties.map((prop) => ({
  ...prop,
  isNew: false, // 标记为现有属性
}));

// 监听属性变化，同步更新本地状态（但跳过添加属性时的更新）
watch(
  () => props.entityProperties,
  (newValue) => {
    // 如果正在添加属性，跳过这次更新
    if (isAddingProperty.value) {
      console.log("Skipping props update during property addition");
      return;
    }
    // 深拷贝新值，并标记为现有属性
    localEntityProperties.value = newValue.map((prop) => ({
      ...prop,
      isNew: false,
    }));
    console.log("Properties updated from props:", localEntityProperties.value);
  },
  { deep: true },
);

// 监听showPropertyPanel变化，当它变为true时，重新从props中获取最新的值
watch(
  () => props.showPropertyPanel,
  async (newValue) => {
    if (newValue) {
      isAddingProperty.value = false; // 重置添加状态
      // latestSequenceIdFromServer.value = ""; // 重置服务器返回的sequenceId
      // wasPanelOpen.value = true; // 标记面板已打开
      localEntityName.value = props.entityName;
      // 当操作来源是画布且nodeName未定义时，设置为空字符串
      localNodeName.value = props.operationSource === 'canvas' && props.nodeName === undefined ? '' : (props.nodeName !== undefined ? props.nodeName : props.entityName);
      localEntityDescription.value = props.entityDescription;
      localEntityProperties.value = props.entityProperties.map((prop) => ({
        ...prop,
        isNew: false, // 标记为现有属性
      }));
      localRelationshipName.value = props.relationshipName;
      // 当正在创建关系时，关系名称置空
      localRelationName.value = props.isCreatingRelationship ? '' : (props.relationName || props.relationshipName);
      localRelationshipDescription.value = props.relationshipDescription;
      localRelationshipType.value = props.relationshipType;
      localStartNodeName.value = props.startNodeName;
      localEndNodeName.value = props.endNodeName;
      localAddToComponentLibrary.value = props.addToComponentLibrary;
      localBackgroundColor.value = props.backgroundColor || "#43D7B5";
      // 重置触发词相关状态
      triggerWordList.value = [];
      console.log("Panel opened with properties:", localEntityProperties.value);
      // 先获取触发词列表，然后再设置selectedTriggerWord
      await fetchTriggerWords("");
      // 将props.relationTrigger转换为数字类型，以匹配triggerWordList中offset的类型
      selectedTriggerWord.value = props.relationTrigger ? Number(props.relationTrigger) : "";
      // 检查selectedTriggerWord是否存在于triggerWordList中
      const triggerWordExists = triggerWordList.value.some(item => item.offset === selectedTriggerWord.value);
      if (!triggerWordExists) {
        selectedTriggerWord.value = "";
      }
    }
  },
);

// 监听其他props的变化
watch(
  () => props.entityName,
  (newValue) => {
    localEntityName.value = newValue;
  },
);

watch(
  () => props.nodeName,
  (newValue) => {
    localNodeName.value = props.operationSource === 'canvas' && newValue === undefined ? '' : (newValue !== undefined ? newValue : props.entityName);
  },
);

watch(
  () => props.entityDescription,
  (newValue) => {
    localEntityDescription.value = newValue;
  },
);

watch(
  () => props.relationshipName,
  (newValue) => {
    localRelationshipName.value = newValue;
  },
);

watch(
  () => [props.relationName, props.isCreatingRelationship],
  ([newValue, isCreating]) => {
    localRelationName.value = isCreating ? '' : (newValue || props.relationshipName);
  },
  { deep: true }
);

watch(
  () => props.relationshipDescription,
  (newValue) => {
    localRelationshipDescription.value = newValue;
  },
);

watch(
  () => props.addToComponentLibrary,
  (newValue) => {
    localAddToComponentLibrary.value = newValue;
  },
);

watch(
  () => props.relationshipType,
  (newValue) => {
    localRelationshipType.value = newValue;
  },
);

watch(
  () => props.startNodeName,
  (newValue) => {
    localStartNodeName.value = newValue;
  },
);

watch(
  () => props.endNodeName,
  (newValue) => {
    localEndNodeName.value = newValue;
  },
);

watch(
  () => props.backgroundColor,
  (newValue) => {
    localBackgroundColor.value = newValue || "#43D7B5";
  },
);

// 监听relationTrigger变化
watch(
  () => props.relationTrigger,
  (newValue) => {
    // 将newValue转换为数字类型，以匹配triggerWordList中offset的类型
    selectedTriggerWord.value = newValue ? Number(newValue) : "";
    // 检查selectedTriggerWord是否存在于triggerWordList中
    const triggerWordExists = triggerWordList.value.some(item => item.offset === selectedTriggerWord.value);
    if (!triggerWordExists) {
      selectedTriggerWord.value = "";
    }
  },
);

// 监听关系名称变化
watch(
  () => props.relationshipName,
  (newValue) => {
    localRelationshipName.value = newValue;
  },
);

// 监听关系类型变化
watch(
  () => props.relationshipType,
  (newValue) => {
    localRelationshipType.value = newValue;
  },
);

// 监听关系属性变化
watch(
  () => props.entityProperties,
  (newValue) => {
    localEntityProperties.value = newValue.map((prop) => ({
      ...prop,
      isNew: false,
    }));
  },
  { deep: true },
);

// 监听操作来源变化
watch(
  () => props.operationSource,
  (newValue) => {
    // 操作来源变化时，重新获取触发词列表
    fetchTriggerWords("");
  },
);

const handleClosePropertyPanel = () => {
  emit("close");
};

const handleCancelPropertyPanel = () => {
  emit("cancel");
};
const levelIdCome=()=>{
   //层级：1-全部 2-领域下 3-专题下 4-文章下 5-段落下
   //层级关联ID：level=2填fieldId的值，level=3填topicId的值，level=4填articleId的值，level=5填sequenceId的值
  if(props.showReferenceText){
    return latestSequenceIdFromServer.value || props.sequenceId || "";//段落下
  }else if(props.currentGraphCreateMethod=='0'){
    return props.articleId;//文章下
  }else if(props.currentGraphCreateMethod=='1'||props.currentGraphCreateMethod=='2'){
    return props.articleId;//文章下
  }else if(props.currentGraphCreateMethod==''&&props.currentLevel==2){
    return props.topicId;//专题下
  }else if(props.currentGraphCreateMethod==''&&props.currentLevel==1){
    return props.domainId;//领域下
  }else{
    return ''//全部
  }
};
const levelCome=()=>{
  console.log(333333333333333,props)
   //层级：1-全部 2-领域下 3-专题下 4-文章下 5-段落下
   //层级关联ID：level=2填fieldId的值，level=3填topicId的值，level=4填articleId的值，level=5填sequenceId的值
  if(props.showReferenceText){
    return 5;//段落下
  }else if(props.currentGraphCreateMethod=='0'){
    return 4;//文章下
  }else if(props.currentGraphCreateMethod=='1'||props.currentGraphCreateMethod=='2'){
    return 4;//文章下
  }else if(props.currentGraphCreateMethod==''&&props.currentLevel==2){
    return 3;//专题下
  }else if(props.currentGraphCreateMethod==''&&props.currentLevel==1){
    return 2;//领域下
  }else{
    return 1;//全部
  }
};
const handleSavePropertyPanel = async () => {
  try {
    // 验证必填字段
    if (props.currentOperation === "entity") {
      if (!localNodeName.value || localNodeName.value.trim() === "") {
        ElMessage.warning("节点名称不能为空");
        return;
      }
    } else if (props.currentOperation === "relationship") {
      if (!localRelationName.value || localRelationName.value.trim() === "") {
        ElMessage.warning("关系名称不能为空");
        return;
      }
    }

    // 设置加载状态
    isLoading.value = true;
    console.log(111111111111111,props);
    console.log(666666666,latestSequenceIdFromServer.value)
      // 检查是否有参考文本
    // if (!props.showReferenceText) {
      if (props.currentOperation === "entity") {
      const templateData = {
        level:levelCome(),
        levelId:levelIdCome(),
        node:{
          nodeId: props.nodeId,  //为空新增、不为空修改
          nodeHash: props.nodeHash,
          nodeName: localNodeName.value,
          nodeDescription: localEntityDescription.value,
          nodeColor: localBackgroundColor.value,
          nodeTemplateName: props.entityName,
          nodeTemplateId: props.nodeTemplateId
        },
        properties: localEntityProperties.value.map((prop) => ({
          propertyKey: prop.name,
          propertyValue: prop.value
        })),
        
        // 段落下时添加 sequence 相关参数
        // 优先使用从服务器获取的最新sequenceId，如果没有则使用props中的sequenceId
        ...(props.showReferenceText && {
          articleId:props.articleId || "",
          sequenceId: latestSequenceIdFromServer.value || props.sequenceId || "",
          sequenceContent: content.value,
          sequencePositionList: sequencePositionList.value,
        }),
      };
      console.log("保存====",templateData);
      await graph.saveNode(templateData);
    } else if (props.currentOperation === "relationship") {
      // 检查 startNodeId 和 endNodeId 是否为空
      // if (!props.startNodeId || !props.endNodeId) {
      //   ElMessage.warning("请选择关系的起始节点和结束节点");
      //   isLoading.value = false;
      //   return;
      // }
      // 构建关系模板保存数据
      const getRelationTypeValue = (type) => {
        switch (type) {
          case "定向":
            return "1";
          case "双向":
            return "2";
          case "循环":
            return "3";
          default:
            return "1";
        }
      };
      // 构建关系模板保存数据
      console.log("Props startNodeHash:", props.startNodeHash);
      console.log("Props startNodeId:", props.startNodeId);
      console.log("Props endNodeHash:", props.endNodeHash);
      console.log("Props endNodeId:", props.endNodeId);
      console.log("All props:", props);
      const relationTemplateData = {
        level:levelCome(),
        levelId:levelIdCome(),
        relation: {
          relationId: props.relationId,
          relationHash: props.relationHash,
          relationName: localRelationName.value,
          relationType: getRelationTypeValue(props.relationshipType),
          relationTrigger: selectedTriggerWord.value,
          startNodeHash: props.startNodeHash,
          endNodeHash: props.endNodeHash,
          relationTemplateName: props.relationshipName,
          relationTemplateId: props.relationTemplateId
        },
        properties: localEntityProperties.value.map((prop) => ({
          propertyKey: prop.name,
          propertyValue: prop.value
        })),
        // 段落下时添加 sequence 相关参数
        // 优先使用从服务器获取的最新sequenceId，如果没有则使用props中的sequenceId
        ...(props.showReferenceText && {
          articleId:props.articleId || "",
          sequenceId: latestSequenceIdFromServer.value || props.sequenceId || "",
          sequenceContent: content.value,
          sequencePositionList: sequencePositionList.value,
        }),
      };
      console.log("保存关系数据:", relationTemplateData);
      console.log("保存====",relationTemplateData);
      await graph.saveRelation(relationTemplateData);
    }
    ElMessage.success("保存成功");
    // }
    // 准备保存到父组件的数据
  const saveData = {
    currentOperation: props.currentOperation,
    entityName: localEntityName.value,
    nodeName: localNodeName.value,
    entityDescription: localEntityDescription.value,
    entityProperties: localEntityProperties.value.map((prop) => ({
      propertyKey: prop.name,
      propertyValue: prop.value
    })),
    relationshipName: localRelationshipName.value,
    relationName: localRelationName.value,
    relationshipDescription: localRelationshipDescription.value,
    relationshipType: localRelationshipType.value,
    addToComponentLibrary: localAddToComponentLibrary.value,
    backgroundColor: localBackgroundColor.value,
    isFromComponentLibrary: props.isFromComponentLibrary,
    isFromCanvas: props.isFromCanvas,
    selectedTriggerWord: selectedTriggerWord.value,
    nodeTemplateId: props.nodeTemplateId,
    relationTemplateId: props.relationTemplateId,
  };

    // 异步更新数据，不阻塞面板关闭
    setTimeout(async () => {
      try {
        // 根据不同层级调用相应的查询接口
        let graphResponse;
        if (props.showReferenceText) {
          // 段落下：先调getSequenceList获取最新sequenceId，再调getGraphBySequenceId
          const sequenceListRes = await graph.getSequenceList(props.articleId);
          if (sequenceListRes && sequenceListRes.data && sequenceListRes.data.length > 0) {
            // 根据内容匹配获取对应的sequenceId
            const currentContent = content.value;
            const matchedSequence = sequenceListRes.data.find(
              (seq) => seq.sequenceContent === currentContent
            );
            const latestSequenceId = matchedSequence
              ? matchedSequence.sequenceId
              : sequenceListRes.data[0].sequenceId;
            // 保存从服务器获取的最新sequenceId，供后续保存使用
            latestSequenceIdFromServer.value = latestSequenceId;
            console.log(777777777777777,latestSequenceId,latestSequenceIdFromServer.value)
            graphResponse = await graph.getGraphBySequenceId(latestSequenceId);
          }
        } else if (props.currentGraphCreateMethod === '0') {
          // 文章下
          graphResponse = await graph.getGraphByArticleId(props.articleId);
        } else if (props.currentGraphCreateMethod === '1' || props.currentGraphCreateMethod === '2') {
          // 专题下
          graphResponse = await graph.getGraphByArticleId(props.articleId);
        } else if (props.currentLevel === 2) {
          // 专题下
          graphResponse = await graph.getGraphByTopicId(props.topicId);
        } else if (props.currentLevel === 1) {
          // 领域下
          graphResponse = await graph.getGraphByFieldId(props.domainId);
        }

        if (graphResponse && graphResponse.data) {
          // 触发更新事件，通知父组件更新图谱数据
          emit("update-nodes", graphResponse.data);
        }
      } catch (error) {
        console.error("更新数据失败:", error);
      }
    }, 100);

    // 延迟关闭面板，让用户看到加载状态
    setTimeout(() => {
      isLoading.value = false;
      emit("save", saveData);
    }, 500);
  } catch (error) {
    console.error("保存失败:", error);
    isLoading.value = false;
  }
};

const handleDeletePropertyPanel = async () => {
   console.log(111111111111111,props);
  try {
    // 弹出确认对话框
    await ElMessageBox.confirm("确定要删除吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // if(!props.showReferenceText){
      // 设置加载状态
    // isLoading.value = true;

    if (props.currentOperation === "entity") {
      // 检查 nodeTemplateId 是否为空
      // if (!props.nodeTemplateId) {
      //   ElMessage.warning("实体模板ID不能为空");
      //   isLoading.value = false;
      //   return;
      // }
      let data={
        level:levelCome(),
        levelId:levelIdCome(),
        nodeHash:props.nodeHash
      }
      // 调用删除接口
      await graph.deleteNode(data);
    } else if (props.currentOperation === "relationship") {
      // 检查 relationTemplateId 是否为空
      // if (!props.relationTemplateId) {
      //   ElMessage.warning("关系模板ID不能为空");
      //   isLoading.value = false;
      //   return;
      // }
      let data={
        level:levelCome(),
        levelId:levelIdCome(),
        relationHash:props.relationHash
      }
      // 调用删除接口
      await graph.deleteRelation(data);
    }

    // 删除成功提示
    ElMessage.success("删除成功");
    // }
    // 直接触发删除事件，让父组件处理删除逻辑
    emit("delete-item");

    // 异步更新数据，不阻塞面板关闭
    setTimeout(async () => {
      try {
        // 根据不同层级调用相应的查询接口
        let graphResponse;
        if (props.showReferenceText) {
          // 段落下：先调getSequenceList获取最新sequenceId，再调getGraphBySequenceId
          const sequenceListRes = await graph.getSequenceList(props.articleId);
          if (sequenceListRes && sequenceListRes.data && sequenceListRes.data.length > 0) {
            // 根据内容匹配获取对应的sequenceId
            const currentContent = content.value;
            const matchedSequence = sequenceListRes.data.find(
              (seq) => seq.sequenceContent === currentContent
            );
            const latestSequenceId = matchedSequence
              ? matchedSequence.sequenceId
              : sequenceListRes.data[0].sequenceId;
            // 保存从服务器获取的最新sequenceId，供后续保存使用
            latestSequenceIdFromServer.value = latestSequenceId;
            graphResponse = await graph.getGraphBySequenceId(latestSequenceId);
          }
        } else if (props.currentGraphCreateMethod === '0') {
          // 文章下
          graphResponse = await graph.getGraphByArticleId(props.articleId);
        } else if (props.currentGraphCreateMethod === '1' || props.currentGraphCreateMethod === '2') {
          // 专题下
          graphResponse = await graph.getGraphByArticleId(props.articleId);
        } else if (props.currentLevel === 2) {
          // 专题下
          graphResponse = await graph.getGraphByTopicId(props.topicId);
        } else if (props.currentLevel === 1) {
          // 领域下
          graphResponse = await graph.getGraphByFieldId(props.domainId);
        }

        if (graphResponse && graphResponse.data) {
          // 触发更新事件，通知父组件更新图谱数据
          emit("update-nodes", graphResponse.data);
        }
      } catch (error) {
        console.error("更新数据失败:", error);
      }
    }, 0);

    // 延迟关闭面板，让用户看到成功提示
    setTimeout(() => {
      // ElMessage.success("删除成功");
      emit("close");
    }, 500);
  } catch (error) {
    // 如果是用户取消操作，不显示错误信息
    if (error !== "cancel") {
      console.error("删除失败:", error);
      // ElMessage.error("删除失败，请重试");
    }
  }
};

const handleAddProperty = () => {
  // 重置新属性数据
  newProperty.value = { name: "", type: "string" };
  // 打开对话框
  addPropertyDialogVisible.value = true;
};

const handleConfirmAddProperty = async () => {
  // 验证属性名是否为空
  if (!newProperty.value.name || newProperty.value.name.trim() === "") {
    ElMessage.warning("请输入属性名称");
    return;
  }

  // 设置添加状态，防止被props更新覆盖
  isAddingProperty.value = true;

  // 创建新属性对象
  const newProp = {
    name: newProperty.value.name.trim(),
    type: newProperty.value.type,
    value: "",
    isNew: true, // 标记为新属性
  };

  console.log("Adding new property:", newProp);
  console.log(
    "Before addition:",
    JSON.parse(JSON.stringify(localEntityProperties.value)),
  );

  // 直接添加到本地数组
  localEntityProperties.value.push(newProp);

  console.log(
    "After addition:",
    JSON.parse(JSON.stringify(localEntityProperties.value)),
  );

  // 等待 DOM 更新
  await nextTick();

  // 关闭对话框
  addPropertyDialogVisible.value = false;

  // 重置新属性数据
  newProperty.value = { name: "", type: "string" };

  // 成功提示
  // ElMessage.success("属性添加成功");

  // 3秒后重置添加状态
  setTimeout(() => {
    isAddingProperty.value = false;
  }, 3000);

  console.log(
    "Final properties:",
    JSON.parse(JSON.stringify(localEntityProperties.value)),
  );
};

// 删除属性
const handleDeleteProperty = (index) => {
  // 从本地数组中删除属性
  localEntityProperties.value.splice(index, 1);
  console.log("Property deleted at index:", index);
  console.log("Updated properties:", localEntityProperties.value);
};

// 获取触发词列表
const fetchTriggerWords = async (sequenceContent = "") => {
  if(props.showReferenceText || sequenceContent){
    try {
      const response = await graph.segmentSequence({
        sequenceContent: props.referenceContent || sequenceContent,
      });
      if (response && response.data) {
        triggerWordList.value = response.data;
        // 检查selectedTriggerWord是否存在于triggerWordList中
        const triggerWordExists = triggerWordList.value.some(item => item.offset === Number(selectedTriggerWord.value));
        if (!triggerWordExists) {
          selectedTriggerWord.value = "";
        }
      }
    } catch (error) {
      console.error("获取触发词列表失败:", error);
    }
      }
  
};

// 处理触发词下拉框可见性变化
const handleTriggerWordVisible = (visible) => {
  if (visible) {
    // fetchTriggerWords("");
  }
};

// 处理节点名称下拉框可见性变化
const handleNodeNameVisible = (visible) => {
  if (visible && props.articleId) {
    fetchNodeNames("", (suggestions) => {
      // 可见性变化时触发搜索
    });
  }
};

// 处理节点名称搜索框焦点事件
const handleNodeNameFocus = () => {
  if (props.articleId) {
    fetchNodeNames("", (suggestions) => {
      // 焦点时触发搜索
    });
  }
};

// 处理节点名称选择事件
const handleNodeNameSelect = (item) => {
  localNodeName.value = item.value;
};

// 处理关系名称搜索框焦点事件
const handleRelationNameFocus = () => {
  if (props.articleId) {
    fetchRelationNames("", (suggestions) => {
      // 焦点时触发搜索
    });
  }
};

// 处理关系名称选择事件
const handleRelationNameSelect = (item) => {
  localRelationName.value = item.value;
};

// 获取节点名称列表
const fetchNodeNames = (queryString, callback) => {
  console.log(props.articleId)
  if (!props.articleId) {
    callback([]);
    return;
  }
  
  isLoadingNodeNames.value = true;
  console.log(props)
  let data={
    articleId: props.articleId,
    nodeName: queryString,
    nodeTemplateId: props.nodeTemplateId,
  }
  graph.getNodeNamesByArticleId(data)
    .then(response => {
      if (response && response.data) {
        const suggestions = response.data.map(item => ({
          value: item,
          label: item
        }));
        callback(suggestions);
      } else {
        callback([]);
      }
    })
    .catch(error => {
      console.error("获取节点名称列表失败:", error);
      callback([]);
    })
    .finally(() => {
      isLoadingNodeNames.value = false;
    });
};

// 获取关系名称列表
const fetchRelationNames = (queryString, callback) => {
  if (!props.articleId) {
    callback([]);
    return;
  }
  
  isLoadingRelationNames.value = true;
  console.log(props)
  let data={
    articleId: props.articleId,
    relationName: queryString,
    relationTemplateId: props.relationTemplateId,
  }
  graph.getRelationNamesByArticleId(data)
    .then(response => {
      if (response && response.data) {
        const suggestions = response.data.map(item => ({
          value: item,
          label: item
        }));
        callback(suggestions);
      } else {
        callback([]);
      }
    })
    .catch(error => {
      console.error("获取关系名称列表失败:", error);
      callback([]);
    })
    .finally(() => {
      isLoadingRelationNames.value = false;
    });
};

// 验证属性值
const validatePropertyValue = (value, type) => {
  if (!value || value.trim() === "") {
    return true; // 空值允许
  }
  
  switch (type) {
    case "string":
      return true; // 字符串类型总是有效
    case "number":
      return !isNaN(Number(value));
    case "boolean":
      return value === "true" || value === "false" || value === "1" || value === "0";
    case "date":
      return !isNaN(Date.parse(value));
    case "object":
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    case "array":
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch (e) {
        return false;
      }
    default:
      return true;
  }
};

// 处理输入框失焦事件
const handleInputBlur = (property, index) => {
  if (!validatePropertyValue(property.value, property.type)) {
    ElMessage.warning(`属性 "${property.name}" 的值类型不正确，请输入 ${property.type} 类型的值`);
  }
};

onMounted(() => {
  fetchTriggerWords("");
});

// 暴露重置方法给父组件
defineExpose({
  resetLatestSequenceId() {
    latestSequenceIdFromServer.value = "";
  }
});

</script>

<style scoped lang="scss">
/* 右侧面板 */
.right-panel {
  width: 260px;
  background-color: white;
  overflow: hidden;
}

.property-panel {
  position: absolute;
  top: 0px;
  right: 0;
  width: 260px;
  height:100%;
  background-color: white;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.property-panel-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  background-color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  img {
    width: 21px;
    height: 21px;
  }
}

.header-left el-icon {
  color: #67c23a;
  font-size: 16px;
}

.property-panel-header h3 {
  font-size: 18px;
  color: #333333;
  font-weight: 600;
  margin: 0;
}

.property-panel-body {
  flex: 1;
  padding: 0 24px 24px 24px;
  overflow-y: auto;
  background:#ffffff;
}

.property-item {
  margin-bottom: 20px;

  :deep(.el-input__wrapper) {
    background: #f6fcff;
    border: 0.8px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    height: 40px;
    box-sizing: border-box;
    box-shadow: none;
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #333333;
  }

  :deep(.el-textarea__inner) {
    font-size: 14px;
    color: #333333;
    background: #f6fcff;
    border: 0.8px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    box-shadow: none;
    resize: none;
  }

  :deep(.el-input__wrapper.is-disabled) {
    background: #f6fcff;
  }

  :deep(.el-input__inner:disabled) {
    background: #f6fcff;
    color: #999999;
  }

  :deep(.el-textarea__inner:disabled) {
    background: #f6fcff;
    color: #b4b3b3;
  }
 :deep(.el-select__wrapper.is-disabled) {
    background: #f6fcff !important;
    color: #b4b3b3 !important;
  }
  :deep(.el-select__wrapper) {
    background: #f6fcff !important;
    color: #333333 !important;
  }
  :deep(.el-select__wrapper) {
    background: #f6fcff !important;
    color: #333333 !important;
     border: 0.5px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    height: 40px;
    box-sizing: border-box;
    box-shadow: none;
    font-size: 13px;
  }
:deep(.el-select__input){
  color: #333333 !important;
}
  :deep(.el-input__inner::placeholder) {
    font-size: 14px;
    color: #999;
  }
  :deep(.el-textarea__inner::placeholder) {
    font-size: 13px;
    color: #999;
  }
}

.entity-name-display {
  // background: #f6fcff;
  // border: 0.8px solid rgba(224, 226, 235, 1);
  background: #f5f5f5;
  border: 0.8px solid #f5f5f5;
  border-radius: 4px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.property-item label {
  display: block;
  font-size: 14px;
  color: #000000;
  margin-bottom: 8px;
  font-weight: 500;
}

.property-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.property-count {
  font-size: 14px;
  color: #3dd2b0;
  background: rgba(61, 210, 176, 0.1);
  border-radius: 10px;
  padding: 1px 10px;
}

.properties-list {
  margin-bottom: 12px;
  min-height: 40px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-properties {
  color: #999;
  font-size: 14px;
  padding: 20px 0;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

.property-row {
  margin-bottom: 12px;
  background: #f4f8fc;
  border-radius: 4px;
  padding: 6px 12px 10px 12px;
  width: 100%;

  :deep(.el-select__wrapper) {
    background: #f6fcff;
    border: 0.5px solid rgba(224, 226, 235, 1);
    border-radius: 4px;
    height: 32px;
    box-sizing: border-box;
    box-shadow: none;
    font-size: 12px;
    color: #999999;
  }

  :deep(.el-select__caret) {
    font-size: 12px;
  }
}

.property-name-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.delete-property-btn {
  font-size: 16px;
  color: #999;
  padding: 0;
  margin-left: 8px;
  line-height: 1;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-property-btn:hover {
  color: #e54949;
  background: none;
}

.lines {
  padding-top: 15px;
  border-top: 1px solid rgba(238, 238, 238, 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #3dd2b0;
  border-color: #3dd2b0;
}

.property-name {
  font-size: 14px;
  color: #333333;
  margin-bottom: 4px;
  font-weight: 500;
  word-break: break-all;
}

.add-property-btn {
  width: 100%;

  .plusIcon {
    margin-right: 5px;
    color: #999;
    font-size: 12px;
  }
}

.el-button--small {
  border-radius: 4px;
  font-size: 14px;
  padding: 16px 11px;
}

.el-button--primary {
  background-color: #ffffff;
  font-size: 14px;
  color: #999999;
  border: 1px dashed rgba(213, 215, 222, 1);
  font-weight: 400;
}

.el-button--primary:hover {
  background-color: #3dd2b0;
  color: #ffffff;
}

.el-button--primary:hover .plusIcon {
  color: #ffffff;
}

.property-panel-footer {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-top: 1px solid #f0f0f0;
}

.close-btn {
  flex: 1;
  background: #f0f0f0;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  color: #666666;
  margin-right: 8px;
}

.delete-btn {
  flex: 1;
  background: #e54949;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  color: #fff;
  margin-right: 8px;
}

.save-btn {
  flex: 2;
  background: #3dd2b0;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  color: #fff;
}

.el-select {
  width: 100%;
}

.el-switch {
  float: right;
}

.el-input {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .right-panel {
    width: 280px;
  }

  .property-panel {
    width: 280px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-btn {
  background-color: rgba(61, 210, 176, 1) !important;
  border-color: rgba(61, 210, 176, 1) !important;
  color: white !important;
}

.confirm-btn:hover {
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
  color: #606266 !important;
}

/* 弹框关闭按钮样式 */
.el-dialog__headerbtn:hover .el-dialog__close {
  color: rgba(61, 210, 176, 1) !important;
}

/* 确保样式能够正确应用 */
:global(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: rgba(61, 210, 176, 1) !important;
}
</style>

<style lang="scss">
/* 全局样式 */
.el-select-dropdown__item {
  font-size: 13px;
  color: #333333;
}

.el-select-dropdown__item:hover {
  background-color: rgba(61, 210, 176, 0.1) !important;
}

.el-select-dropdown__item.selected,
.el-select-dropdown__item.is-selected {
  color: #3dd2b0 !important;
  background-color: rgba(61, 210, 176, 0.1) !important;
}

/* 对话框样式 */
.el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.el-dialog__body {
  padding: 20px 20px 10px;
}

.el-dialog__footer {
  padding: 10px 20px 20px;
  border-top: none;
}

.el-form-item__label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.el-form-item.is-required .el-form-item__label:before {
  color: #e54949;
}

/* 修复 rows 属性警告 */
.el-textarea__inner {
  resize: none;
}
</style>

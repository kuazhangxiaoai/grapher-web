// 移除 MockMethod 导入，使用类型推断

// 模拟领域数据
const mockDomains = [
  { fieldId: 1, fieldName: "服务" },
  { fieldId: 2, fieldName: "名城" },
  { fieldId: 3, fieldName: "规划知识" },
  { fieldId: 4, fieldName: "空间通讯" },
  { fieldId: 5, fieldName: "智能城市" },
  { fieldId: 6, fieldName: "生态环保" },
  { fieldId: 7, fieldName: "服务" },
  { fieldId: 12, fieldName: "名城" },
  { fieldId: 13, fieldName: "规划知识" },
  { fieldId: 14, fieldName: "空间通讯" },
  { fieldId: 15, fieldName: "智能城市" },
  { fieldId: 16, fieldName: "生态环保" },
];

// 模拟专题数据
const mockTopics = {
  1: [
    // 服务领域的专题
    { topicId: 101, topicName: "政务服务", fieldId: 1 },
    { topicId: 102, topicName: "会议管理", fieldId: 1 },
    { topicId: 103, topicName: "工作总线", fieldId: 1 },
    { topicId: 104, topicName: "规划编制", fieldId: 1 },
  ],
  2: [
    // 名城领域的专题
    { topicId: 201, topicName: "历史文化", fieldId: 2 },
    { topicId: 202, topicName: "城市规划", fieldId: 2 },
    { topicId: 203, topicName: "基础设施", fieldId: 2 },
    { topicId: 204, topicName: "公共服务", fieldId: 2 },
  ],
  3: [
    // 规划知识领域的专题
    { topicId: 301, topicName: "规划理论", fieldId: 3 },
    { topicId: 302, topicName: "规划法规", fieldId: 3 },
    { topicId: 303, topicName: "规划案例", fieldId: 3 },
    { topicId: 304, topicName: "规划技术", fieldId: 3 },
    { topicId: 301, topicName: "规划理论", fieldId: 3 },
    { topicId: 302, topicName: "规划法规", fieldId: 3 },
    { topicId: 303, topicName: "规划案例", fieldId: 3 },
    { topicId: 304, topicName: "规划技术", fieldId: 3 },
    { topicId: 301, topicName: "规划理论", fieldId: 3 },
    { topicId: 302, topicName: "规划法规", fieldId: 3 },
    { topicId: 303, topicName: "规划案例", fieldId: 3 },
    { topicId: 304, topicName: "规划技术", fieldId: 3 },
  ],
  4: [
    // 空间通讯领域的专题
    { topicId: 401, topicName: "空间数据", fieldId: 4 },
    { topicId: 402, topicName: "通讯网络", fieldId: 4 },
    { topicId: 403, topicName: "空间分析", fieldId: 4 },
    { topicId: 404, topicName: "通讯技术", fieldId: 4 },
  ],
  5: [
    // 智能城市领域的专题
    { topicId: 501, topicName: "智慧城市", fieldId: 5 },
    { topicId: 502, topicName: "数字孪生", fieldId: 5 },
    { topicId: 503, topicName: "智能交通", fieldId: 5 },
    { topicId: 504, topicName: "智慧能源", fieldId: 5 },
  ],
  6: [
    // 生态环保领域的专题
    { topicId: 601, topicName: "生态保护", fieldId: 6 },
    { topicId: 602, topicName: "环境保护", fieldId: 6 },
    { topicId: 603, topicName: "可持续发展", fieldId: 6 },
    { topicId: 604, topicName: "绿色建筑", fieldId: 6 },
  ],
};

export default [
  // 获取领域列表
  {
    url: "/serve_api/field/selectFieldByCondition",
    method: "get",
    response: ({ query }) => {
      const { condition } = query;
      let filteredDomains = mockDomains;

      // 如果有搜索条件，进行过滤
      if (condition) {
        filteredDomains = mockDomains.filter((domain) =>
          domain.fieldName.toLowerCase().includes(condition.toLowerCase()),
        );
      }

      return {
        code: 200,
        msg: "获取领域列表成功",
        data: filteredDomains,
      };
    },
  },

  // 新增领域
  {
    url: "/serve_api/field/addField",
    method: "post",
    response: ({ body }) => {
      const { fieldName } = body;

      // 模拟新增领域
      const newDomain = {
        fieldId: Date.now(),
        fieldName: fieldName,
      };

      return {
        code: 200,
        msg: "新增领域成功",
        data: newDomain,
      };
    },
  },

  // 删除领域
  {
    url: "/serve_api/field/remove",
    method: "get",
    response: () => {
      return {
        code: 200,
        msg: "删除领域成功",
      };
    },
  },

  // 获取专题列表
  {
    url: "/serve_api/topic/selectTopicByCondition",
    method: "get",
    response: ({ query }) => {
      const { condition, fieldId } = query;
      let filteredTopics = [];

      // 根据fieldId获取专题列表
      if (fieldId && mockTopics[fieldId]) {
        filteredTopics = mockTopics[fieldId];

        // 如果有搜索条件，进行过滤
        if (condition) {
          filteredTopics = filteredTopics.filter((topic) =>
            topic.topicName.toLowerCase().includes(condition.toLowerCase()),
          );
        }
      }

      return {
        code: 200,
        msg: "获取专题列表成功",
        data: filteredTopics,
      };
    },
  },

  // 新增专题
  {
    url: "/serve_api/topic/addTopic",
    method: "post",
    response: ({ body }) => {
      const { topicName, fieldId } = body;

      // 模拟新增专题
      const newTopic = {
        topicId: Date.now(),
        topicName: topicName,
        fieldId: fieldId,
      };

      return {
        code: 200,
        msg: "新增专题成功",
        data: newTopic,
      };
    },
  },

  // 删除专题
  {
    url: "/serve_api/topic/remove",
    method: "get",
    response: () => {
      return {
        code: 200,
        msg: "删除专题成功",
      };
    },
  },
];

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

// 模拟模板数据
const mockTemplates = {
  101: [
    // 政务服务专题的模板
    {
      nodeTemplateId: 1000,
      nodeTemplateName: "政府部门节点是",
      templateType: "node",
      topicId: 101,
      nodeTemplateColor: "#43D7B5",
    },
    {
      nodeTemplateId: 1001,
      nodeTemplateName: "政府部门节点",
      templateType: "node",
      topicId: 101,
      nodeTemplateColor: "#43D7B5",
    },
    {
      nodeTemplateId: 1002,
      nodeTemplateName: "服务事项节点",
      templateType: "node",
      topicId: 101,
      nodeTemplateColor: "#3B82F6",
    },
    {
      nodeTemplateId: 1003,
      nodeTemplateName: "服务事项节点在",
      templateType: "node",
      topicId: 101,
      nodeTemplateColor: "#3B82F6",
    },
    {
      relationTemplateId: 1004,
      relationTemplateName: "办理流程关系",
      templateType: "relation",
      topicId: 101,
      startNodeTemplateId: 1001,
      endNodeTemplateId: 1002,
      relationTemplateType: "1",
    },
    {
      relationTemplateId: 1005,
      relationTemplateName: "办理流程关系顶顶顶顶",
      templateType: "relation",
      topicId: 101,
      startNodeTemplateId: 1002,
      endNodeTemplateId: 1001,
      relationTemplateType: "1",
    },
    {
      relationTemplateId: 1006,
      relationTemplateName: "办理流程关系谢谢谢谢",
      templateType: "relation",
      topicId: 101,
      startNodeTemplateId: 1001,
      endNodeTemplateId: 1003,
      relationTemplateType: "1",
    },
    {
      relationTemplateId: 1007,
      relationTemplateName: "办理流程关系",
      templateType: "relation",
      topicId: 101,
      startNodeTemplateId: 1003,
      endNodeTemplateId: 1002,
      relationTemplateType: "1",
    },
    {
      relationTemplateId: 1008,
      relationTemplateName: "办理流程关系是",
      templateType: "relation",
      topicId: 101,
      startNodeTemplateId: 1003,
      endNodeTemplateId: 1002,
      relationTemplateType: "1",
    },
    {
      relationTemplateId: 1009,
      relationTemplateName: "办理流程关系的",
      templateType: "relation",
      topicId: 101,
      startNodeTemplateId: 1003,
      endNodeTemplateId: 1002,
      relationTemplateType: "1",
    },
  ],
  201: [
    // 历史文化专题的模板
    {
      nodeTemplateId: 2001,
      nodeTemplateName: "历史建筑节点",
      templateType: "node",
      topicId: 201,
      nodeTemplateColor: "#F59E0B",
    },
    {
      nodeTemplateId: 2002,
      nodeTemplateName: "文化遗产节点",
      templateType: "node",
      topicId: 201,
      nodeTemplateColor: "#EC4899",
    },
    {
      relationTemplateId: 2003,
      relationTemplateName: "时空关系",
      templateType: "relation",
      topicId: 201,
      startNodeTemplateId: 2001,
      endNodeTemplateId: 2002,
      relationTemplateType: "1",
    },
  ],
};

// 模拟组件库数据
const mockLibraryTemplates = [
  {
    templateId: 1,
    templateName: "基础节点",
    templateType: "node",
    description: "基础节点模板",
  },
  {
    templateId: 2,
    templateName: "高级节点",
    templateType: "node",
    description: "高级节点模板",
  },
  {
    templateId: 3,
    templateName: "基础关系",
    templateType: "relation",
    description: "基础关系模板",
  },
  {
    templateId: 4,
    templateName: "复杂关系",
    templateType: "relation",
    description: "复杂关系模板",
  },
];

export default [
  // 获取领域列表
  {
    url: "/graph_api/field/selectFieldByCondition",
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
    url: "/graph_api/field/addField",
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
    url: "/graph_api/field/remove",
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
    url: "/graph_api/topic/selectTopicByCondition",
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
    url: "/graph_api/topic/addTopic",
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
    url: "/graph_api/topic/remove",
    method: "get",
    response: () => {
      return {
        code: 200,
        msg: "删除专题成功",
      };
    },
  },

  // 节点/关系模版查询
  {
    url: "/graph_api/template/queryTemplate",
    method: "get",
    response: ({ query }) => {
      const { topicId } = query;
      // 将topicId转换为字符串，确保与mockTemplates的键类型匹配
      const topicIdStr = String(topicId);
      let templates = mockTemplates[topicIdStr] || [];

      // 如果没有找到对应专题的模板数据，返回默认模板数据
      if (templates.length === 0) {
        templates = [
          {
            nodeTemplateId: Date.now() + 1,
            nodeTemplateName: "默认节点1",
            templateType: "node",
            topicId: topicId,
            nodeTemplateColor: "#d77c43ff",
          },
          {
            nodeTemplateId: Date.now() + 2,
            nodeTemplateName: "默认节点2",
            templateType: "node",
            topicId: topicId,
            nodeTemplateColor: "#f6e63bff",
          },
          {
            relationTemplateId: Date.now() + 3,
            relationTemplateName: "默认关系",
            templateType: "relation",
            topicId: topicId,
            startNodeTemplateId: Date.now() + 1,
            endNodeTemplateId: Date.now() + 2,
            relationTemplateType: "1",
          },
        ];
      }

      // 分离节点模板和关系模板
      const nodeTemplates = templates.filter(
        (template) => template.templateType === "node",
      );
      const relationTemplates = templates.filter(
        (template) => template.templateType === "relation",
      );
      return {
        code: 200,
        msg: "查询模板成功",
        data: {
          nodeTemplates: nodeTemplates,
          relationTemplates: relationTemplates,
        },
      };
    },
  },

  // 节点模板保存
  {
    url: "/graph_api/template/saveNodeTemplate",
    method: "post",
    response: ({ body }) => {
      const {
        topicId,
        nodeTemplateName,
        nodeTemplateDescription,
        isLibraryFlag,
        nodeTemplateColor,
        properties,
      } = body;
      // 将topicId转换为字符串，确保与mockTemplates的键类型匹配
      const topicIdStr = String(topicId);
      const newTemplate = {
        nodeTemplateId: Date.now(),
        nodeTemplateName: nodeTemplateName,
        nodeTemplateDescription: nodeTemplateDescription || "",
        isLibraryFlag: isLibraryFlag || "0",
        nodeTemplateColor: nodeTemplateColor || "#43D7B5",
        properties: properties || [],
        templateType: "node",
        topicId: topicId,
      };
      // 将新模板添加到mockTemplates中
      if (!mockTemplates[topicIdStr]) {
        mockTemplates[topicIdStr] = [];
      }
      mockTemplates[topicIdStr].push(newTemplate);
      return {
        code: 200,
        msg: "保存节点模板成功",
        data: newTemplate,
      };
    },
  },

  // 关系模板保存
  {
    url: "/graph_api/template/saveRelationTemplate",
    method: "post",
    response: ({ body }) => {
      const {
        topicId,
        relationTemplateName,
        relationTemplateDescription,
        isLibraryFlag,
        properties,
        sourceNodeTemplateId,
        targetNodeTemplateId,
      } = body;
      // 将topicId转换为字符串，确保与mockTemplates的键类型匹配
      const topicIdStr = String(topicId);
      const newTemplate = {
        relationTemplateId: Date.now(),
        relationTemplateName: relationTemplateName,
        relationTemplateDescription: relationTemplateDescription || "",
        isLibraryFlag: isLibraryFlag || "0",
        properties: properties || [],
        templateType: "relation",
        topicId: topicId,
        startNodeTemplateId: sourceNodeTemplateId,
        endNodeTemplateId: targetNodeTemplateId,
        relationTemplateType: "1", // 默认定向关系
      };
      // 将新模板添加到mockTemplates中
      if (!mockTemplates[topicIdStr]) {
        mockTemplates[topicIdStr] = [];
      }
      mockTemplates[topicIdStr].push(newTemplate);
      return {
        code: 200,
        msg: "保存关系模板成功",
        data: newTemplate,
      };
    },
  },

  // 节点模版删除
  {
    url: "/graph_api/template/deleteNodeTemplate",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "删除节点模板成功",
      };
    },
  },

  // 关系模版删除
  {
    url: "/graph_api/template/deleteRelationTemplate",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "删除关系模板成功",
      };
    },
  },

  // 组件库查询
  {
    url: "/graph_api/template/queryLibraryTemplate",
    method: "get",
    response: ({ query }) => {
      const { templateName } = query;
      let filteredTemplates = mockLibraryTemplates;
      if (templateName) {
        filteredTemplates = mockLibraryTemplates.filter((template) =>
          template.templateName
            .toLowerCase()
            .includes(templateName.toLowerCase()),
        );
      }
      return {
        code: 200,
        msg: "查询组件库成功",
        data: filteredTemplates,
      };
    },
  },

  // 添加到模型接口
  {
    url: "/graph_api/template/addToModel",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "添加到模型成功",
      };
    },
  },

  // 复制领域
  {
    url: "/graph_api/field/copyField",
    method: "get",
    response: ({ query }) => {
      const { fieldId } = query;
      const originalDomain = mockDomains.find(
        (domain) => domain.fieldId == fieldId,
      );
      if (originalDomain) {
        const copiedDomain = {
          ...originalDomain,
          fieldId: Date.now(),
          fieldName: `${originalDomain.fieldName} (复制)`,
        };
        return {
          code: 200,
          msg: "复制领域成功",
          data: copiedDomain,
        };
      }
      return {
        code: 200,
        msg: "复制领域成功",
        data: null,
      };
    },
  },

  // 复制专题
  {
    url: "/graph_api/topic/copyTopic",
    method: "get",
    response: ({ query }) => {
      const { topicId } = query;
      // 查找原始专题
      let originalTopic = null;
      for (const fieldId in mockTopics) {
        const topic = mockTopics[fieldId].find((t) => t.topicId == topicId);
        if (topic) {
          originalTopic = topic;
          break;
        }
      }
      if (originalTopic) {
        const copiedTopic = {
          ...originalTopic,
          topicId: Date.now(),
          topicName: `${originalTopic.topicName} (复制)`,
        };
        return {
          code: 200,
          msg: "复制专题成功",
          data: copiedTopic,
        };
      }
      return {
        code: 200,
        msg: "复制专题成功",
        data: null,
      };
    },
  },

  // 文章相关接口
  // 获取graph列表
  {
    url: "/graph_api/article/selectArticle",
    method: "get",
    response: ({ query }) => {
      const { topicId, condition } = query;
      // 模拟文章数据
      const mockArticles = [
        {
          articleId: 1,
          articleName: "城市规划图谱",
          createMethod: "0",
          topicId: topicId,
          createTime: "2024-01-01 10:00:00",
          fileSize: "123KB",
        },
        {
          articleId: 2,
          articleName: "交通网络分析",
          createMethod: "1",
          topicId: topicId,
          createTime: "2024-01-02 14:30:00",
          fileSize: "256KB",
        },
      ];

      // 如果有搜索条件，进行过滤
      let filteredArticles = mockArticles;
      if (condition) {
        filteredArticles = mockArticles.filter((article) =>
          article.articleName.toLowerCase().includes(condition.toLowerCase()),
        );
      }

      return {
        code: 200,
        msg: "获取图谱列表成功",
        data: filteredArticles,
      };
    },
  },

  // 创建文章
  {
    url: "/graph_api/article/addArticle",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "创建文章成功",
        data: {
          articleId: Date.now(),
          articleName: "新创建的图谱",
        },
      };
    },
  },

  // 获取后端pdf的url
  {
    url: "/graph_api/article/getFileUrl",
    method: "get",
    response: () => {
      return {
        code: 200,
        msg: "获取文件URL成功",
        data: {
          fileUrl: "https://example.com/sample.pdf",
        },
      };
    },
  },

  // 删除文章
  {
    url: "/graph_api/article/deleteArticle",
    method: "get",
    response: () => {
      return {
        code: 200,
        msg: "删除文章成功",
      };
    },
  },

  // 模板相关接口
  // 获取topic下的所有节点模板
  {
    url: "/graph_api/template/queryNodeTemplate",
    method: "get",
    response: ({ query }) => {
      const { topicId } = query;
      // 模拟节点模板数据
      return {
        code: 200,
        msg: "获取节点模板成功",
        data: [
          {
            nodeTemplateId: 1,
            nodeTemplateName: "基础节点",
            topicId: topicId,
            nodeTemplateColor: "#43D7B5",
          },
          {
            nodeTemplateId: 2,
            nodeTemplateName: "高级节点",
            topicId: topicId,
            nodeTemplateColor: "#3B82F6",
          },
        ],
      };
    },
  },

  // 获取nodeTemplate 属性
  {
    url: "/graph_api/template/queryNodeTemplateProperties",
    method: "get",
    response: ({ query }) => {
      const { nodeTemplateId } = query;
      // 模拟节点模板属性数据
      return {
        code: 200,
        msg: "获取节点模板属性成功",
        data: [
          {
            propertyId: 1,
            propertyName: "名称",
            propertyType: "string",
            required: true,
          },
          {
            propertyId: 2,
            propertyName: "描述",
            propertyType: "text",
            required: false,
          },
        ],
      };
    },
  },

  // 查询关系模板
  {
    url: "/graph_api/template/queryRelationTemplate",
    method: "get",
    response: ({ query }) => {
      const { topicId } = query;
      // 模拟关系模板数据
      return {
        code: 200,
        msg: "获取关系模板成功",
        data: [
          {
            relationTemplateId: 1,
            relationTemplateName: "关联关系",
            topicId: topicId,
            relationTemplateType: "1",
          },
          {
            relationTemplateId: 2,
            relationTemplateName: "包含关系",
            topicId: topicId,
            relationTemplateType: "2",
          },
        ],
      };
    },
  },

  // 查询关系模板属性
  {
    url: "/graph_api/template/queryRelationTemplateProperties",
    method: "get",
    response: ({ query }) => {
      const { relationTemplateId } = query;
      // 模拟关系模板属性数据
      return {
        code: 200,
        msg: "获取关系模板属性成功",
        data: [
          {
            propertyId: 1,
            propertyName: "关系名称",
            propertyType: "string",
            required: true,
          },
          {
            propertyId: 2,
            propertyName: "关系描述",
            propertyType: "text",
            required: false,
          },
        ],
      };
    },
  },

  // 序列相关接口
  // 段落分词接口
  {
    url: "/graph_api/sequence/segmentSequence",
    method: "post",
    response: ({ body }) => {
      // 模拟分词结果
      return {
        code: 200,
        msg: "分词成功",
        data: {
          segments: [
            "城市",
            "规划",
            "交通",
            "网络",
          ],
        },
      };
    },
  },

  // 段落列表查询接口
  {
    url: "/graph_api/sequence/getSequenceList",
    method: "get",
    response: ({ query }) => {
      const { articleId } = query;
      // 模拟段落列表数据
      return {
        code: 200,
        msg: "获取段落列表成功",
        data: [
          {
            sequenceId: 1,
            articleId: articleId,
            sequenceContent: "城市规划是城市发展的重要指导。",
            sequenceNumber: 1,
          },
          {
            sequenceId: 2,
            articleId: articleId,
            sequenceContent: "交通网络是城市的重要基础设施。",
            sequenceNumber: 2,
          },
        ],
      };
    },
  },

  // 段落对应图谱保存提交接口
  {
    url: "/graph_api/sequence/saveGraph",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "保存图谱成功",
      };
    },
  },

  // 段落对应图谱查询接口
  {
    url: "/graph_api/sequence/getGraphBySequenceId",
    method: "get",
    response: ({ query }) => {
      const { sequenceId } = query;
      // 模拟图谱数据
      return {
        code: 200,
        msg: "获取图谱成功",
        data: {
          nodes: [
            {
              nodeHash: "node-hash-1",
              nodeId: 1,
              nodeDescription: "城市是人类聚居的场所",
              nodeColor: "#43D7B5",
              nodeName: "城市",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "城市" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-2",
              nodeId: 2,
              nodeDescription: "规划是对未来的安排",
              nodeColor: "#3B82F6",
              nodeName: "规划",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "规划" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-3",
              nodeId: 3,
              nodeDescription: "交通是城市的血脉",
              nodeColor: "#F59E0B",
              nodeName: "交通",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "交通" },
                { key: "type", value: "基础节点" }
              ]
            },
          ],
          relations: [
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-1",
              relationId: 1,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-5",
              relationId: 1,
              relationName: "关联899",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-6",
              relationId: 1,
              relationName: "关联6544",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-2",
              relationId: 2,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-3",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-3",
              relationId: 2,
              relationName: "关联666",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-4",
              relationId: 2,
              relationName: "关联77788",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
          ],
        },
      };
    },
  },

  // 文章对应图谱查询接口
  {
    url: "/graph_api/sequence/getGraphByArticleId",
    method: "get",
    response: ({ query }) => {
      const { articleId } = query;
      // 模拟图谱数据
      return {
        code: 200,
        msg: "获取图谱成功",
        data: {
          nodes: [
            {
              nodeHash: "node-hash-1",
              nodeId: 1,
              nodeDescription: "城市是人类聚居的场所",
              nodeColor: "#43D7B5",
              nodeName: "城市",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "城市" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-2",
              nodeId: 2,
              nodeDescription: "规划是对未来的安排",
              nodeColor: "#3B82F6",
              nodeName: "规划",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "规划" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-3",
              nodeId: 3,
              nodeDescription: "交通是城市的血脉",
              nodeColor: "#F59E0B",
              nodeName: "交通",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "交通" },
                { key: "type", value: "基础节点" }
              ]
            },
          ],
          relations: [
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-1",
              relationId: 1,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-5",
              relationId: 1,
              relationName: "关联899",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-6",
              relationId: 1,
              relationName: "关联6544",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-2",
              relationId: 2,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-3",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-3",
              relationId: 2,
              relationName: "关联666",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-4",
              relationId: 2,
              relationName: "关联77788",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
          ],
        },
      };
    },
  },

  // 专题下所有图谱对应图谱查询接口
  {
    url: "/graph_api/sequence/getGraphByTopicId",
    method: "get",
    response: ({ query }) => {
      const { topicId } = query;
      // 模拟图谱列表数据
      return {
        code: 200,
        msg: "获取图谱列表成功",
        data: {
          nodes: [
            {
              nodeHash: "node-hash-1",
              nodeId: 1,
              nodeDescription: "城市是人类聚居的场所",
              nodeColor: "#43D7B5",
              nodeName: "城市",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "城市" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-2",
              nodeId: 2,
              nodeDescription: "规划是对未来的安排",
              nodeColor: "#3B82F6",
              nodeName: "规划",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "规划" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-3",
              nodeId: 3,
              nodeDescription: "交通是城市的血脉",
              nodeColor: "#F59E0B",
              nodeName: "交通",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "交通" },
                { key: "type", value: "基础节点" }
              ]
            },
          ],
          relations: [
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-1",
              relationId: 1,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-5",
              relationId: 1,
              relationName: "关联899",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-6",
              relationId: 1,
              relationName: "关联6544",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-2",
              relationId: 2,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-3",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-3",
              relationId: 2,
              relationName: "关联666",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-4",
              relationId: 2,
              relationName: "关联77788",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
          ],
        },
      };
    },
  },

  // 领域下所有专题对应图谱查询接口
  {
    url: "/graph_api/sequence/getGraphByFieldId",
    method: "get",
    response: ({ query }) => {
      const { fieldId } = query;
      // 模拟图谱列表数据
      return {
        code: 200,
        msg: "获取图谱列表成功",
        data: {
          nodes: [
            {
              nodeHash: "node-hash-1",
              nodeId: 1,
              nodeDescription: "城市是人类聚居的场所",
              nodeColor: "#43D7B5",
              nodeName: "城市",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "城市" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-2",
              nodeId: 2,
              nodeDescription: "规划是对未来的安排",
              nodeColor: "#3B82F6",
              nodeName: "规划",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "规划" },
                { key: "type", value: "基础节点" }
              ]
            },
            {
              nodeHash: "node-hash-3",
              nodeId: 3,
              nodeDescription: "交通是城市的血脉",
              nodeColor: "#F59E0B",
              nodeName: "交通",
              nodeTemplateName: "基础节点",
              nodeTemplateId: 1,
              properties: [
                { key: "name", value: "交通" },
                { key: "type", value: "基础节点" }
              ]
            },
          ],
          relations: [
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-1",
              relationId: 1,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-5",
              relationId: 1,
              relationName: "关联899",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-2",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-6",
              relationId: 1,
              relationName: "关联6544",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-1",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-2",
              relationId: 2,
              relationName: "关联",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-3",
              endNodeHash: "node-hash-1",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-3",
              relationId: 2,
              relationName: "关联666",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
            {
              relationTemplateId: 1,
              startNodeHash: "node-hash-2",
              endNodeHash: "node-hash-3",
              properties: [
                { key: "name", value: "关联" },
                { key: "type", value: "关联关系" }
              ],
              relationHash: "relation-hash-4",
              relationId: 2,
              relationName: "关联77788",
              relationTemplateName: "关联关系",
              relationTrigger: "manual",
              relationType: "1"
            },
          ],
        },
      };
    },
  },

  // 模糊查询节点名称
  {
    url: "/graph_api/sequence/getNodeNamesByArticleId",
    method: "post",
    response: () => {
      // 模拟节点名称数据
      return {
        code: 200,
        msg: "获取节点名称成功",
        data: [
          "城市",
          "规划",
          "交通",
          "网络",
        ],
      };
    },
  },

  // 模糊查询关系名称
  {
    url: "/graph_api/sequence/getRelationNamesByArticleId",
    method: "post",
    response: () => {
      // 模拟关系名称数据
      return {
        code: 200,
        msg: "获取关系名称成功",
        data: [
          "关联",
          "包含",
          "影响",
        ],
      };
    },
  },

  // 节点保存提交接口
  {
    url: "/graph_api/sequence/saveNode",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "保存节点成功",
        data: {
          nodeId: Date.now(),
        },
      };
    },
  },

  // 节点删除接口
  {
    url: "/graph_api/sequence/deleteNode",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "删除节点成功",
      };
    },
  },

  // 关系保存接口
  {
    url: "/graph_api/sequence/saveRelation",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "保存关系成功",
        data: {
          relationId: Date.now(),
        },
      };
    },
  },

  // 关系删除接口
  {
    url: "/graph_api/sequence/deleteRelation",
    method: "post",
    response: () => {
      return {
        code: 200,
        msg: "删除关系成功",
      };
    },
  },
];


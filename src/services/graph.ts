import axios from "./config";

export default {
  /** 获取领域列表 */
  getDomainList(data: String): Promise<any> {
    return axios.get(
      `/field/selectFieldByCondition?condition=${data}`,
    );
  },
  /** 新增领域 */
  addDomain(formData: Object): Promise<any> {
    return axios.post(`/field/addField`, formData);
  },
  /** 删除领域 */
  deleteDomain(projectId: number): Promise<any> {
    return axios.get(`/field/remove/?fieldId=${projectId}`);
  },
  /** 获取专题列表 */
  getTopicProjectList(data: String, fieldId: number): Promise<any> {
    return axios.get(
      `/topic/selectTopicByCondition?condition=${data}&fieldId=${fieldId}`,
    );
  },
  /** 新增专题 */
  addTopicProject(formData: Object): Promise<any> {
    return axios.post(`/topic/addTopic`, formData);
  },
  /** 删除专题 */
  deleteTopic(projectId: number): Promise<any> {
    return axios.get(`/topic/remove?topicId=${projectId}`);
  },
  /** 节点/关系模版查询 */
  queryTemplate(topicId: number): Promise<any> {
    return axios.get(`/template/queryTemplate?topicId=${topicId}`);
  },
  /** 节点模板保存 */
  saveNodeTemplate(data: Object): Promise<any> {
    return axios.post(`/template/saveNodeTemplate`, data);
  },
  /** 关系模板保存 */
  saveRelationTemplate(data: Object): Promise<any> {
    return axios.post(`/template/saveRelationTemplate`, data);
  },
  /** 节点模版删除 */
  deleteNodeTemplate(data: Object): Promise<any> {
    return axios.post(`/template/deleteNodeTemplate`, data);
  },
  /** 关系模版删除 */
  deleteRelationTemplate(data: Object): Promise<any> {
    return axios.post(`/template/deleteRelationTemplate`, data);
  },
  /** 组件库查询 */
  queryLibraryTemplate(data: string): Promise<any> {
    return axios.get(
      `/template/queryLibraryTemplate?templateName=${data}`,
    );
  },
  /** 添加到模型接口 */
  addToModel(data: Object): Promise<any> {
    return axios.post(`/template/addToModel`, data);
  },
  /** 复制领域 */
  copyField(fieldId: string, newName?: string): Promise<any> {
    return axios.get(
      `/field/copyField?fieldId=${fieldId}${newName ? `&fieldName=${newName}` : ""}`,
    );
  },
  /** 复制专题 */
  copyTopic(topicId: string, newName?: string): Promise<any> {
    return axios.get(
      `/topic/copyTopic?topicId=${topicId}${newName ? `&topicName=${newName}` : ""}`,
    );
  },
  /** 输入topickId,获取graph*/
  getGraphList(topicId: string, condition: string = ""): Promise<any> {
    return axios.get(
      `/article/selectArticle?topicId=${topicId}${condition ? `&condition=${condition}` : ""}`,
    );
  },
  /** create Article*/
  addArticle(graphData): Promise<any> {
    //raphName: string, topicId: string, createMethod: string, file: any
    const formData = new FormData();
    formData.append("articleName", graphData.articleName);
    formData.append("createMethod", graphData.createMethod);
    formData.append("fileSize", "123");
    formData.append("topicId", graphData.topicId);
    if (graphData.uploadedFile) {
      formData.append("multipartFile", graphData.uploadedFile);
    }
    return axios.post(`/article/addArticle`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**获取后端pdf的url*/
  getArticleUrl(articleId: string): Promise<any> {
    return axios.get(`/article/getFileUrl?articleId=${articleId}`);
  },

  /**delete Article*/
  deleteArticle(articleId: string): Promise<any> {
    return axios.get(`/article/deleteArticle?articleId=${articleId}`);
  },

  /**获取topic下的所有节点模板*/
  getNodeTypes(topicId: string): Promise<any> {
    return axios.get(
      `/template/queryNodeTemplate?topicId=${topicId}`,
    );
  },

  /**获取nodeTemplate 属性*/
  getNodeTemplateProperties(nodeTemplateId: string): Promise<any> {
    return axios.get(
      `/template/queryNodeTemplateProperties?nodeTemplateId=${nodeTemplateId}`,
    );
  },
  /** 节点/关系模版查询 */
  queryRelationTemplate(topicId: number): Promise<any> {
    return axios.get(
      `/template/queryRelationTemplate?topicId=${topicId}`,
    );
  },
  /** 段落分词接口 */
  segmentSequence(data: Object): Promise<any> {
    return axios.post(`/sequence/segmentSequence`, data);
  },
  /** 段落列表查询接口 */
  getSequenceList(articleId: String): Promise<any> {
    return axios.get(
      `/sequence/getSequenceList?articleId=${articleId}`,
    );
  },
  /** 段落对应图谱保存提交接口 */
  saveGraph(data: Object): Promise<any> {
    return axios.post(`/sequence/saveGraph`, data);
  },
  /** 段落对应图谱查询接口 */
  getGraphBySequenceId(sequenceId: String): Promise<any> {
    return axios.get(
      `/sequence/getGraphBySequenceId?sequenceId=${sequenceId}`,
    );
  },
  /** 文章对应图谱查询接口 */
  getGraphByArticleId(articleId: String): Promise<any> {
    return axios.get(
      `/sequence/getGraphByArticleId?articleId=${articleId}`,
    );
  },
  /** 查询接口 */
  queryRelationTemplateProperties(relationTemplateId: String): Promise<any> {
    return axios.get(
      `/template/queryRelationTemplateProperties?relationTemplateId=${relationTemplateId}`,
    );
  },
  /** 专题下所有图谱对应图谱查询接口 */
  getGraphByTopicId(topicId: String): Promise<any> {
    return axios.get(
      `/sequence/getGraphByTopicId?topicId=${topicId}`,
    );
  },
  /** 领域下所有专题对应图谱查询接口 */
  getGraphByFieldId(fieldId: String): Promise<any> {
    return axios.get(
      `/sequence/getGraphByFieldId?fieldId=${fieldId}`,
    );
  },
  /** 模糊查询节点名称 */
  getNodeNamesByArticleId(articleId: String,nodeName: String): Promise<any> {
    return axios.get(
      `/sequence/getNodeNamesByArticleId?articleId=${articleId}&nodeName=${nodeName}`,
    );
  },
  /** 模糊查询关系名称 */
  getRelationNamesByArticleId(articleId: String,relationName: String): Promise<any> {
    return axios.get(
      `/sequence/getRelationNamesByArticleId?articleId=${articleId}&relationName=${relationName}`,
    );
  },
};

import axios from "./config";

export default {
  /** 获取领域列表 */
  getDomainList(data: String): Promise<any> {
    return axios.get(
      `/serve_api/field/selectFieldByCondition?condition=${data}`,
    );
  },
  /** 新增领域 */
  addDomain(formData: Object): Promise<any> {
    return axios.post(`/serve_api/field/addField`, formData);
  },
  /** 删除领域 */
  deleteDomain(projectId: number): Promise<any> {
    return axios.get(`/serve_api/field/remove/?fieldId=${projectId}`);
  },
  /** 获取专题列表 */
  getTopicProjectList(data: String, fieldId: number): Promise<any> {
    return axios.get(
      `/serve_api/topic/selectTopicByCondition?condition=${data}&fieldId=${fieldId}`,
    );
  },
  /** 新增专题 */
  addTopicProject(formData: Object): Promise<any> {
    return axios.post(`/serve_api/topic/addTopic`, formData);
  },
  /** 删除专题 */
  deleteTopic(projectId: number): Promise<any> {
    return axios.get(`/serve_api/topic/remove?topicId=${projectId}`);
  },
  /** 节点/关系模版查询 */
  queryTemplate(topicId: number): Promise<any> {
    return axios.get(`/serve_api/template/queryTemplate?topicId=${topicId}`);
  },
  /** 节点模板保存 */
  saveNodeTemplate(data: Object): Promise<any> {
    return axios.post(`/serve_api/template/saveNodeTemplate`, data);
  },
  /** 关系模板保存 */
  saveRelationTemplate(data: Object): Promise<any> {
    return axios.post(`/serve_api/template/saveRelationTemplate`, data);
  },
  /** 节点模版删除 */
  deleteNodeTemplate(data: Object): Promise<any> {
    return axios.post(`/serve_api/template/deleteNodeTemplate`, data);
  },
  /** 关系模版删除 */
  deleteRelationTemplate(data: Object): Promise<any> {
    return axios.post(`/serve_api/template/deleteRelationTemplate`, data);
  },
  /** 组件库查询 */
  queryLibraryTemplate(data: string): Promise<any> {
    return axios.get(
      `/serve_api/template/queryLibraryTemplate?templateName=${data}`,
    );
  },
  /** 添加到模型接口 */
  addToModel(data: Object): Promise<any> {
    return axios.post(`/serve_api/template/addToModel`, data);
  },
  /** 复制领域 */
  copyField(fieldId: string, newName?: string): Promise<any> {
    return axios.get(
      `/serve_api/field/copyField?fieldId=${fieldId}${newName ? `&fieldName=${newName}` : ""}`,
    );
  },
  /** 复制专题 */
  copyTopic(topicId: string, newName?: string): Promise<any> {
    return axios.get(
      `/serve_api/topic/copyTopic?topicId=${topicId}${newName ? `&topicName=${newName}` : ""}`,
    );
  },
  /** 输入topickId,获取graph*/
  getGraphList(topicId: object): Promise<any> {
    return axios.get(`/serve_api/article/selectArticle?topicId=${topicId}`);
  },
  /** create Article*/
  addArticle(graphData): Promise<any> {
    //raphName: string, topicId: string, createMethod: string, file: any
    const formData = new FormData();
    formData.append("articleName", graphData.articleName);
    formData.append("createMethod", graphData.createMethod);
    formData.append("fileSize", "123");
    formData.append("topicId", graphData.topicId);
    formData.append("multipartFile", graphData.uploadedFile);
    return axios.post(`/serve_api/article/addArticle`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**获取后端pdf的url*/
  getArticleUrl(articleId: string): Promise<any> {
    return axios.get(`/serve_api/article/getFileUrl?articleId=${articleId}`);
  },

  /**delete Article*/
  deleteArticle(articleId: string): Promise<any> {
    return axios.get(`/serve_api/article/deleteArticle?articleId=${articleId}`)
  },

  /**获取topic下的所有节点模板*/
  getNodeTypes(topicId: string): Promise<any> {
    return axios.get(`/serve_api/template/queryNodeTemplate?topicId=${topicId}`);
  },

  /**获取nodeTemplate 属性*/
  getNodeTemplateProperties(nodeTemplateId: string): Promise<any> {
    return axios.get(`/serve_api/template/queryNodeTemplateProperties?nodeTemplateId=${nodeTemplateId}`);
  }
};

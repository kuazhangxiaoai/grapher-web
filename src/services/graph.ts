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
  /** create Article*/
  addArticle(graphData): Promise<any> {
    //raphName: string, topicId: string, createMethod: string, file: any
    const formData = new FormData();
    formData.append("articleName", graphData.articleName);
    formData.append("createMethod", graphData.createMethod);
    formData.append("fileSize", "123");
    formData.append("topicId", graphData.topicId);
    formData.append("multipartFile", graphData.uploadedFile);
    return axios.post(`/serve_api/article/addArticle`,
        formData, {headers: { 'Content-Type': 'multipart/form-data'}});
  },

  /**获取后端pdf的url*/
  getArticleUrl(articleId: string): Promise<any> {
    return axios.get(`/serve_api/article/getFileUrl?articleId=${articleId}`);
  },

  /**delete Article*/
  deleteArticle(graphName: string, topicName: string, domainName: string, userName: string): Promise<any> {

    return axios.post(`/serve_api/article/removeArticle`,{
      graphName: graphName,
      topicName: topicName,
      domainName: domainName,
      userName: userName,
    });
  },
  /**get Article list*/
  getArticleList(topicName: string, domainName: string, userName: string): Promise<any> {
    return axios.get(`/serve_api/article/getArticleList`,
        {
          params: {
            topicName: topicName,
            domainName: domainName,
            userName: userName
          }
        });
  }
};

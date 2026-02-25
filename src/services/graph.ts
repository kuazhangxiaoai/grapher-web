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
  /** create graph*/
  addGraph(graphName: string, topicName: string, domainName: string, userName:string, type): Promise<any> {
    return axios.post(`/serve_api/project/addGraph`,
        {
          graphName: graphName,
          topicName: topicName,
          domainName: domainName,
          userName: userName,
        });
  },
  /**delete graph*/
  deleteGraph(graphName: string, topicName: string, domainName: string, userName: string): Promise<any> {

    return axios.post(`/serve_api/graph/removeGraph`,{
      graphName: graphName,
      topicName: topicName,
      domainName: domainName,
      userName: userName,
    });
  },
  /**get graph list*/
  getGraphList(topicName: string, domainName: string, userName: string): Promise<any> {
    return axios.get(`/serve_api/project/getGraphList`,
        {
          params: {
            topicName: topicName,
            domainName: domainName,
            userName: userName
          }
        });
  }
};

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
  /** 新增项目*/
  addProject(projectName: string, topicName: string, domainName: string, userName): Promise<any> {
    return axios.post(`/serve_api/project/addProject`,
        {
          projectName: projectName,
          topicName: topicName,
          domainName: domainName,
          userName: userName,
        });
  },
  deleteProject(projectName: string, topicName: string, domainName: string, userName: string): Promise<any> {
    return axios.post(`/serve_api/project/removeProject`,{
      projectName: projectName,
      topicName: topicName,
      domainName: domainName,
      userName: userName,
    });
  },
  getProjectList(topicName: string, domainName: string, userName: string): Promise<any> {
    return axios.get(`/serve_api/project/projectList`,
        {
          params: {
            topicName: topicName,
            domainName: domainName,
            userName: userName
          }
        });
  }
};

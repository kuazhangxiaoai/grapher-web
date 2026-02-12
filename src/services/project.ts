import axios from "./config";
export default {
  /** 获取领域列表 */
  getProjectList(data: String): Promise<any> {
    return axios.get(
      `/serve_api/field/selectFieldByCondition?condition=${data}`,
    );
  },
  /** 新增领域 */
  addProject(formData: Object): Promise<any> {
    return axios.post(`/serve_api/field/addField`, formData);
  },
  /** 删除领域 */
  deleteProject(projectId: number): Promise<any> {
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
};

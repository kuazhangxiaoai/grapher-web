import axios from './config'
export default {
    /** 获取项目列表 */
    getProjectList(data: Object): Promise<any> {
      return axios.post(`/serve_api/project/list`, data)
    },
    /** 获取项目信息 */
    getProjectInfo(projectId: number): Promise<any> {
        return axios.get(`/serve_api/project/getInfo/?pptProjectId=${projectId}`) 
    },
    /** 新增项目 */
    addProject(formData: Object): Promise<any> {
        return axios.post(`/serve_api/project/add/`, formData, )
    },
    /** 编辑项目 */
    editProject(projectData:any): Promise<any> {
        return axios.post(`/serve_api/project/edit/`,projectData)
    },
    /** 删除项目 */
    deleteProject(projectId: number): Promise<any> {
        return axios.get(`/serve_api/project/remove/?pptProjectId=${projectId}`) 
    },
    /** 编辑项目数据 */
    editProjectData(formData: Object): Promise<any> {
        return axios.post(`/serve_api/project/editPptData/`, formData, {
            // headers: { 'Content-Type':'application/json', },
        } )
    },
}

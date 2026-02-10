import type { AxiosRequestConfig } from 'axios'
import { useProjectStore } from '@/store'
import axios from './config'
export default {

    /** 文件上传 */
    uploadFile(file: File): Promise<any> {
        const formData = new FormData()
        formData.append('file', file)
        return axios.post(`/serve_api/attachment/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
    /** 文件上传 */
    uploadVideoFile(file: File): Promise<any> {
        const formData = new FormData()
        const useProject = useProjectStore();
        formData.append('file', file)
        formData.append('pptProjectId', (useProject.pptProjectId || 0).toString())
        return axios.post(`/serve_api/attachment/pptUpload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
    downloadFile(fileName: string, deleteAfter: boolean = false): Promise<string> {
        const config: AxiosRequestConfig = {
            params: { fileName, delete: deleteAfter },
            responseType: 'blob'
        };

        return axios.get(`/serve_api/attachment/download`, config)
            .then((response) => {
                const blob = response.data as Blob;

                // 你可以检测一下 blob 是否为图片（可选）
                const isImage = blob.type.startsWith("image/");
                if (!isImage && blob.type === 'application/octet-stream') {
                    console.warn("Content-Type 是 octet-stream，尝试作为图片展示");
                }

                const imageUrl = URL.createObjectURL(blob); // ✅ 转为 URL
                return imageUrl;
            })
            .catch((error) => {
                console.error('文件下载失败:', error);
                throw error;
            });
    },
    downloadPPT(): Promise<string> {
        const useProject = useProjectStore();
        const config: AxiosRequestConfig = {
            params: { projId: useProject.pptProjectId },
            // responseType: 'blob'
        };
        return axios.post(`/serve_api/project/downloadProj?projId=`+useProject.pptProjectId)
            .then((response) => {
                console.log(response.data.downloadUrl);
                return response.data.downloadUrl;
                
            })
            .catch((error) => {
                console.error('文件下载失败:', error);
                throw error;
            });
    }

}

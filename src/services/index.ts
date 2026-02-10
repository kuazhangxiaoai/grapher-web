// import axios from './config'
import axios from 'axios'
// export const SERVER_URL = 'http://localhost:5000'
export const SERVER_URL = (import.meta.env.MODE === 'development') ? '/api' : '/api'

export default {
  getMockData(filename: string): Promise<any> {
    return axios.get(`./mocks/${filename}.json`).then((res) => res.data)
  },

  getFileData(filename: string): Promise<any> {
    return axios.get(`/mocks/${filename}.json`).then((res) => res.data)
  },

  AIPPT_Outline(
    content: string,
    language: string,
    model: string,
  ): Promise<any> {
    return fetch(`${SERVER_URL}/tools/aippt_outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
        model,
        stream: true,
      }),
    })
  },

  AIPPT(
    content: string,
    language: string,
    model: string,
  ): Promise<any> {
    return fetch(`${SERVER_URL}/tools/aippt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
        model,
        stream: true,
      }),
    })
  },

  // 新增简单问答接口
  AISimpleQA(question: string): Promise<any> {
    return fetch(`/ai_api/simple/?question=${encodeURIComponent(question)}`,{
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
  },
}
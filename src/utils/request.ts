import { message } from 'antd'
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 是否自动 toast 错误，默认 true */
    errToast?: boolean
  }
}

type DataRequest = {
  [M in 'get' | 'delete' | 'post' | 'put' | 'patch']: <T = unknown>(
    ...args: Parameters<AxiosInstance[M]>
  ) => Promise<T>
}

const instance: AxiosInstance = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // TODO: 注入 token
  return config
})

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    // 文件流无业务包体，直接放行
    if (data?.code === undefined) return data
    // 成功解包 result
    if (data.code === 200) return data.result
    return Promise.reject(data)
  },
  (error) => {
    // 取消 / 关闭 toast 时不提示
    if (!axios.isCancel(error) && error?.config?.errToast !== false) {
      message.error(
        error.response?.data?.msg || '网络异常，请检查连接',
      )
    }
    return Promise.reject(error)
  },
)

export default instance as DataRequest & AxiosInstance

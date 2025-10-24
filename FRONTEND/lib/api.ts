import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (typeof window !== "undefined") {
        try {
          const refresh = localStorage.getItem("refresh_token")
          if (refresh) {
            const response = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
            const { access } = response.data

            localStorage.setItem("access_token", access)

            originalRequest.headers.Authorization = `Bearer ${access}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/login"
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  },
)

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "./api"

interface User {
  id: number
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, password_confirm: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      const token = localStorage.getItem("access_token")
      if (token) {
        try {
          const response = await api.get("/auth/me/")
          setUser(response.data)
        } catch (error) {
          // Token might be expired, try to refresh
          await refreshToken()
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  // Auto-refresh token before it expires
  useEffect(() => {
    const interval = setInterval(
      () => {
        refreshToken()
      },
      50 * 60 * 1000,
    ) // Refresh every 50 minutes (token expires in 1 hour)

    return () => clearInterval(interval)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login/", { email, password })
    const { access, refresh } = response.data

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
    }

    const userResponse = await api.get("/auth/me/")
    setUser(userResponse.data)

    router.push("/dashboard")
  }

  const register = async (email: string, username: string, password: string, password_confirm: string) => {
    await api.post("/auth/register/", {
      email,
      username,
      password,
      password_confirm,
    })

    // Auto-login after registration
    await login(email, password)
  }

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
    setUser(null)
    router.push("/login")
  }

  const refreshToken = async () => {
    if (typeof window === "undefined") return

    try {
      const refresh = localStorage.getItem("refresh_token")
      if (!refresh) return

      const response = await api.post("/auth/refresh/", { refresh })
      const { access } = response.data

      localStorage.setItem("access_token", access)

      // Update user data
      const userResponse = await api.get("/auth/me/")
      setUser(userResponse.data)
    } catch (error) {
      // Refresh token is invalid, logout
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

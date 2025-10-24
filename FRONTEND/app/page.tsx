"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-balance">
            <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent">
              TinderPet
            </span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance">Encuentra el match perfecto para tu mascota</p>
        </div>

        <div className="flex flex-col gap-4 pt-8">
          <Button asChild size="lg" className="bg-[#ff6b9d] hover:bg-[#ff4d85] text-white">
            <Link href="/register">Crear cuenta</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>Conecta con mascotas de tu misma raza</p>
          <p>Encuentra amigos para tu mejor amigo</p>
        </div>
      </div>
    </main>
  )
}

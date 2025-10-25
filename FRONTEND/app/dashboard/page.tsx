"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Edit, Heart, MessageCircle, LogOut } from "lucide-react"
import Link from "next/link"

interface Pet {
  id: number
  name: string
  pet_type: string
  breed: string
  age: number
  gender: string
  bio: string
  main_image: string
  is_active: boolean
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchPets()
    }
  }, [user])

  const fetchPets = async () => {
    try {
      const response = await api.get("/pets/")
      console.log("Fetched pets:", response.data) // Debugging line
      setPets(response.data)
    } catch (error) {
      console.error("Error fetching pets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (petId: number) => {
    try {
      await api.post(`/pets/${petId}/set_active/`)
      fetchPets()
    } catch (error) {
      console.error("Error setting active pet:", error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent">
              TinderPet
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-balance">Mis Mascotas</h2>
            <p className="text-muted-foreground">Gestiona los perfiles de tus mascotas</p>
          </div>
          <Button asChild className="bg-[#ff6b9d] hover:bg-[#ff4d85]">
            <Link href="/dashboard/pets/new">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Mascota
            </Link>
          </Button>
        </div>

        {pets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No tienes mascotas aún</h3>
              <p className="mb-6 text-center text-muted-foreground text-balance">
                Crea el perfil de tu mascota para empezar a encontrar matches
              </p>
              <Button asChild className="bg-[#ff6b9d] hover:bg-[#ff4d85]">
                <Link href="/dashboard/pets/new">Crear Primera Mascota</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <Card key={pet.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={pet.main_image || "/placeholder.svg?height=400&width=400"}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                  {pet.is_active && <Badge className="absolute right-2 top-2 bg-[#6bcf7f]">Activo</Badge>}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{pet.name}</CardTitle>
                      <CardDescription>
                        {pet.breed} • {pet.age} {pet.age === 1 ? "año" : "años"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{pet.gender === "male" ? "♂" : "♀"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{pet.bio}</p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/pets/${pet.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    {!pet.is_active && (
                      <Button
                        size="sm"
                        className="flex-1 bg-[#ff6b9d] hover:bg-[#ff4d85]"
                        onClick={() => handleSetActive(pet.id)}
                      >
                        Activar
                      </Button>
                    )}
                    {pet.is_active && (
                      <Button asChild size="sm" className="flex-1 bg-[#6bcf7f] hover:bg-[#5ab86d]">
                        <Link href="/discover">
                          <Heart className="mr-2 h-4 w-4" />
                          Descubrir
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pets.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[#ff6b9d]" />
                  Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/matches">Ver Mis Matches</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#ffd93d]" />
                  Mensajes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/messages">Ver Mensajes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Heart, X, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

interface Match {
  id: number
  pet1: Pet
  pet2: Pet
  created_at: string
}

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activePet, setActivePet] = useState<Pet | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; match: Match | null }>({
    open: false,
    match: null,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchActivePet()
    }
  }, [user])

  const fetchActivePet = async () => {
    try {
      const response = await api.get("/pets/")
      const userPets = response.data
      const active = userPets.find((p: Pet) => p.is_active)

      if (!active) {
        toast({
          title: "No hay mascota activa",
          description: "Por favor activa una mascota desde el dashboard",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setActivePet(active)
      fetchDiscoverPets(active.id)
    } catch (error) {
      console.error("Error fetching active pet:", error)
      setLoading(false)
    }
  }

  const fetchDiscoverPets = async (petId: number) => {
    try {
      const response = await api.get(`/discover/?pet_id=${petId}`)
      setPets(response.data)
    } catch (error) {
      console.error("Error fetching discover pets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!activePet || actionLoading || currentIndex >= pets.length) return

    setActionLoading(true)
    const currentPet = pets[currentIndex]

    try {
      const response = await api.post("/likes/", {
        from_pet: activePet.id,
        to_pet: currentPet.id,
      })

      // Check if it's a match
      if (response.data.match) {
        setMatchDialog({ open: true, match: response.data.match })
      }

      setCurrentIndex(currentIndex + 1)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo dar like",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePass = async () => {
    if (!activePet || actionLoading || currentIndex >= pets.length) return

    setActionLoading(true)
    const currentPet = pets[currentIndex]

    try {
      await api.post("/passes/", {
        from_pet: activePet.id,
        to_pet: currentPet.id,
      })

      setCurrentIndex(currentIndex + 1)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo pasar",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const currentPet = pets[currentIndex]
  const hasMorePets = currentIndex < pets.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent">
              Descubrir
            </span>
          </h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/matches">Matches</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto flex min-h-[calc(100vh-73px)] max-w-lg items-center justify-center px-4 py-8">
        {!hasMorePets ? (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-balance text-center">No hay más mascotas por ahora</h3>
              <p className="mb-6 text-center text-muted-foreground text-balance">
                Vuelve más tarde para ver nuevos perfiles
              </p>
              <Button asChild className="bg-[#ff6b9d] hover:bg-[#ff4d85]">
                <Link href="/dashboard">Volver al Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full space-y-6">
            {activePet && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Buscando para <span className="font-semibold text-foreground">{activePet.name}</span>
                </p>
              </div>
            )}

            <Card className="overflow-hidden shadow-xl">
              <div className="relative aspect-[3/4]">
                <img
                  src={currentPet.main_image || "/placeholder.svg?height=600&width=450"}
                  alt={currentPet.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-3xl font-bold">{currentPet.name}</h2>
                    <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
                      {currentPet.age} {currentPet.age === 1 ? "año" : "años"}
                    </Badge>
                  </div>
                  <p className="mb-2 text-lg font-medium">{currentPet.breed}</p>
                  <p className="line-clamp-3 text-sm text-white/90">{currentPet.bio}</p>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center gap-6">
              <Button
                size="lg"
                variant="outline"
                className="h-16 w-16 rounded-full border-2 bg-white p-0 shadow-lg hover:scale-110 hover:border-red-500 hover:bg-red-50"
                onClick={handlePass}
                disabled={actionLoading}
              >
                <X className="h-8 w-8 text-red-500" />
              </Button>

              <Button
                size="lg"
                className="h-20 w-20 rounded-full bg-gradient-to-r from-[#ff6b9d] to-[#ff4d85] p-0 shadow-xl hover:scale-110"
                onClick={handleLike}
                disabled={actionLoading}
              >
                <Heart className="h-10 w-10 fill-white text-white" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {pets.length - currentIndex} {pets.length - currentIndex === 1 ? "mascota" : "mascotas"} disponibles
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Match Dialog */}
      <Dialog open={matchDialog.open} onOpenChange={(open) => setMatchDialog({ ...matchDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent">
                ¡Es un Match!
              </span>
            </DialogTitle>
            <DialogDescription className="text-center">
              A {matchDialog.match?.pet2.name || matchDialog.match?.pet1.name} también le gustó {activePet?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#ff6b9d]">
              <img
                src={activePet?.main_image || "/placeholder.svg?height=96&width=96"}
                alt={activePet?.name}
                className="h-full w-full object-cover"
              />
            </div>
            <Heart className="h-8 w-8 fill-[#ff6b9d] text-[#ff6b9d]" />
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#ffd93d]">
              <img
                src={
                  matchDialog.match?.pet2.id === activePet?.id
                    ? matchDialog.match?.pet1.main_image
                    : matchDialog.match?.pet2.main_image || "/placeholder.svg?height=96&width=96"
                }
                alt={
                  matchDialog.match?.pet2.id === activePet?.id
                    ? matchDialog.match?.pet1.name
                    : matchDialog.match?.pet2.name
                }
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setMatchDialog({ open: false, match: null })}
            >
              Seguir Descubriendo
            </Button>
            <Button asChild className="flex-1 bg-[#ff6b9d] hover:bg-[#ff4d85]">
              <Link href="/matches" onClick={() => setMatchDialog({ open: false, match: null })}>
                Ver Matches
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

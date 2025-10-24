"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, MessageCircle } from "lucide-react"
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
  owner: {
    id: number
    username: string
    email: string
  }
}

interface Match {
  id: number
  pet1: Pet
  pet2: Pet
  created_at: string
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [userPets, setUserPets] = useState<Pet[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [matchesRes, petsRes] = await Promise.all([api.get("/matches/"), api.get("/pets/")])

      setMatches(matchesRes.data)
      setUserPets(petsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOtherPet = (match: Match): Pet => {
    const userPetIds = userPets.map((p) => p.id)
    return userPetIds.includes(match.pet1.id) ? match.pet2 : match.pet1
  }

  const getMyPet = (match: Match): Pet => {
    const userPetIds = userPets.map((p) => p.id)
    return userPetIds.includes(match.pet1.id) ? match.pet1 : match.pet2
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
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent">Mensajes</span>
          </h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/matches">Matches</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-balance">Conversaciones</h2>
          <p className="text-muted-foreground">Chatea con tus matches</p>
        </div>

        {matches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-muted p-6">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No tienes conversaciones</h3>
              <p className="mb-6 text-center text-muted-foreground text-balance">
                Consigue matches para empezar a chatear
              </p>
              <Button asChild className="bg-[#ff6b9d] hover:bg-[#ff4d85]">
                <Link href="/discover">Descubrir Mascotas</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const otherPet = getOtherPet(match)
              const myPet = getMyPet(match)

              return (
                <Link key={match.id} href={`/messages/${match.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                        <img
                          src={otherPet.main_image || "/placeholder.svg?height=64&width=64"}
                          alt={otherPet.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{otherPet.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {otherPet.breed}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Match con {myPet.name}</p>
                      </div>
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

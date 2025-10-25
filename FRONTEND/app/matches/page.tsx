"use client"

import { use, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, MessageCircle, Heart } from "lucide-react"
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
  pet1_details: Pet
  pet2_details: Pet
  created_at: string
}

export default function MatchesPage() {
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
    return userPetIds.includes(match.pet1_details.id) ? match.pet2_details : match.pet1_details
  }

  const getMyPet = (match: Match): Pet => {
    const userPetIds = userPets.map((p) => p.id)
    return userPetIds.includes(match.pet1_details.id) ? match.pet1_details : match.pet2_details
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
        <div className="container mx-auto flex items-center justify-between px-4 py-4 text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-[#ff6b9d] to-[#ffd93d] bg-clip-text text-transparent">Matches</span>
          </h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/discover">Descubrir</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-balance">Tus Matches</h2>
          <p className="text-muted-foreground">Mascotas que también les gustó tu perfil</p>
        </div>

        {matches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No tienes matches aún</h3>
              <p className="mb-6 text-center text-muted-foreground text-balance">
                Empieza a dar likes para encontrar tu primer match
              </p>
              <Button asChild className="bg-[#ff6b9d] hover:bg-[#ff4d85]">
                <Link href="/discover">Descubrir Mascotas</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => {
              const otherPet = getOtherPet(match)
              const myPet = getMyPet(match)

              return (
                <Card key={match.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <img
                      src={otherPet.main_image || "/placeholder.svg?height=400&width=400"}
                      alt={otherPet.name}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute right-2 top-2 bg-[#ff6b9d]">Match</Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{otherPet.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {otherPet.breed} • {otherPet.age} {otherPet.age === 1 ? "año" : "años"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Match con {myPet.name}</p>
                      </div>
                      <Badge variant="outline">{otherPet.gender === "male" ? "♂" : "♀"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{otherPet.bio}</p>
                    <Button asChild className="w-full bg-[#6bcf7f] hover:bg-[#5ab86d]">
                      <Link href={`/messages/${match.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar Mensaje
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

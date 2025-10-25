"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

interface Message {
  id: number
  match: number
  sender_pet: number
  content: string
  created_at: string
  is_read: boolean
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [match, setMatch] = useState<Match | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [userPets, setUserPets] = useState<Pet[]>([])
  const [myPet, setMyPet] = useState<Pet | null>(null)
  const [otherPet, setOtherPet] = useState<Pet | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, params.matchId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!match) return

    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [match])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchData = async () => {
    try {
      const [matchesRes, petsRes] = await Promise.all([api.get("/matches/"), api.get("/pets/")])

      const currentMatch = matchesRes.data.find((m: Match) => m.id === Number(params.matchId))
      console.log("aqui esta el match que quiero encontrar:", currentMatch)
      if (!currentMatch) {
        toast({
          title: "Match no encontrado",
          description: "No se pudo encontrar este match",
          variant: "destructive",
        })
        router.push("/matches")
        return
      }

      setMatch(currentMatch)
      setUserPets(petsRes.data)
      
      const userPetIds = petsRes.data.map((p: Pet) => p.id)
      const myPetInMatch = userPetIds.includes(currentMatch.pet1_details.id) ? currentMatch.pet1_details : currentMatch.pet2_details
      const otherPetInMatch = userPetIds.includes(currentMatch.pet1_details.id) ? currentMatch.pet2_details : currentMatch.pet1_details
     
      setMyPet(myPetInMatch)
      setOtherPet(otherPetInMatch)

      await fetchMessages()
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la conversación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/matches/${params.matchId}/messages/`)
      setMessages(response.data)

      // Mark messages as read
      await api.patch(`/matches/${params.matchId}/messages/read/`)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !myPet || sending) return

    setSending(true)

    try {
      const response = await api.post(`/matches/${params.matchId}/messages/create/`, {
        sender_pet: myPet.id,
        content: newMessage.trim(),
      })
      setMessages([...messages, response.data])
      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo enviar el mensaje",
        variant: "destructive",
      })
    } finally {
      setSending(false)
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
    <div className="flex h-screen flex-col bg-gradient-to-br from-pink-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3 text-gray-500">
          <Button asChild variant="ghost" size="sm">
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          {otherPet && (
            <div className="flex flex-1 items-center gap-3 text-gray-500">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherPet.main_image || "/placeholder.svg"} alt={otherPet.name} />
                <AvatarFallback>{otherPet.name}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{otherPet.name}</h2>
                <p className="text-xs text-muted-foreground">{otherPet.breed}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto flex flex-1 flex-col overflow-hidden px-4">
        <div className="flex-1 overflow-y-auto py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-muted-foreground">No hay mensajes aún</p>
                <p className="text-sm text-muted-foreground">Envía el primer mensaje para romper el hielo</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMyMessage = message.sender_pet === myPet?.id

                return (
                  <div key={message.id} className={cn("flex", isMyMessage ? "justify-end" : "justify-start")}>
                    <Card
                      className={cn(
                        "max-w-[70%] px-4 py-2",
                        isMyMessage
                          ? "bg-gradient-to-r from-[#ff6b9d] to-[#ff4d85] text-black"
                          : "bg-white text-foreground",
                      )}
                    >
                      <p className="break-words text-sm text-black">{message.content}</p>
                      <p className={cn("mt-1 text-xs", isMyMessage ? "text-white/70" : "text-gray-500")}>
                        {new Date(message.created_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </Card>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t bg-white/80 py-4 backdrop-blur-sm text-muted-foreground">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || sending} className="bg-[#ff6b9d] hover:bg-[#ff4d85]">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

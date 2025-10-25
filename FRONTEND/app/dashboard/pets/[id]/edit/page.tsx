"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Trash2, Upload, Star, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PetImage {
  id: number
  image: string
  uploaded_at: string
}

export default function EditPetPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [images, setImages] = useState<PetImage[]>([])
  const [mainImageUrl, setMainImageUrl] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    pet_type: "",
    breed: "",
    age: "",
    gender: "",
    bio: "",
  })

  useEffect(() => {
    fetchPet()
    fetchImages()
  }, [params.id])

  const fetchPet = async () => {
    try {
      const response = await api.get(`/pets/${params.id}/`)
      const pet = response.data
      setFormData({
        name: pet.name,
        pet_type: pet.pet_type,
        breed: pet.breed,
        age: pet.age.toString(),
        gender: pet.gender,
        bio: pet.bio,
      })
      setMainImageUrl(pet.main_image || "")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la mascota",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const fetchImages = async () => {
    try {
      const response = await api.get(`/pets/${params.id}/images/`)
      setImages(response.data)
    } catch (error) {
      console.error("Error fetching images:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("image", file)

      await api.post(`/pets/${params.id}/add_image/`, uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast({
        title: "Imagen agregada",
        description: "La imagen se ha subido exitosamente",
      })

      fetchImages()
      fetchPet()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo subir la imagen",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSetMainImage = async (imageId: number, imageUrl: string) => {
    try {
      await api.post(`/pets/${params.id}/set_main_image/`, {
        image_id: imageId,
      })

      setMainImageUrl(imageUrl)
      toast({
        title: "Imagen principal actualizada",
        description: "Esta imagen ahora es la principal del perfil",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo actualizar la imagen principal",
        variant: "destructive",
      })
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    try {
      await api.delete(`/pets/${params.id}/delete_image/`, {
        data: { image_id: imageId },
      })

      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente",
      })

      fetchImages()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo eliminar la imagen",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put(`/pets/${params.id}/`, {
        ...formData,
        age: Number.parseInt(formData.age),
      })

      toast({
        title: "Mascota actualizada",
        description: "Los cambios han sido guardados exitosamente",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.response?.data?.message || "No se pudo actualizar la mascota",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      await api.delete(`/pets/${params.id}/`)

      toast({
        title: "Mascota eliminada",
        description: "El perfil ha sido eliminado exitosamente",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo eliminar la mascota",
        variant: "destructive",
      })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Fotos de {formData.name}</CardTitle>
              <CardDescription>
                Sube fotos de tu mascota. Haz clic en la estrella para establecer la imagen principal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                      <Image src={img.image || "/placeholder.svg"} alt="Pet" fill className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={() => handleSetMainImage(img.id, img.image)}
                          title="Establecer como principal"
                        >
                          {mainImageUrl === img.image ? (
                            <Check className="h-4 w-4 text-[#6bcf7f]" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" className="h-8 w-8" title="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La foto será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteImage(img.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {mainImageUrl === img.image && (
                        <div className="absolute right-2 top-2 rounded-full bg-[#6bcf7f] p-1">
                          <Star className="h-4 w-4 fill-white text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="relative aspect-square">
                    <Input
                      id="add-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <Label
                      htmlFor="add-image"
                      className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
                    >
                      {uploadingImage ? (
                        <Spinner className="h-8 w-8" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Agregar foto</span>
                        </>
                      )}
                    </Label>
                  </div>
                </div>

                {images.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No hay fotos aún. Agrega la primera foto de tu mascota.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Información de la Mascota</CardTitle>
              <CardDescription>Actualiza los datos del perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Max"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pet_type">Tipo de Mascota *</Label>
                    <Select
                      value={formData.pet_type}
                      onValueChange={(value) => setFormData({ ...formData, pet_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog">Perro</SelectItem>
                        <SelectItem value="cat">Gato</SelectItem>
                        <SelectItem value="bird">Ave</SelectItem>
                        <SelectItem value="rabbit">Conejo</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breed">Raza *</Label>
                    <Input
                      id="breed"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      placeholder="Ej: Golden Retriever"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Edad (años) *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="30"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Ej: 3"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Género *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Macho</SelectItem>
                        <SelectItem value="female">Hembra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía *</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Cuéntanos sobre tu mascota..."
                    rows={4}
                    maxLength={500}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{formData.bio.length}/500 caracteres</p>
                </div>

                <div className="flex gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={deleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de tu mascota y todos
                          sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex flex-1 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 bg-[#ff6b9d] hover:bg-[#ff4d85]" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
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
import { ArrowLeft, Trash2, Upload, X } from "lucide-react"
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

export default function EditPetPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)

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
      if (pet.main_image_url) {
        setCurrentImageUrl(pet.main_image_url)
        setImagePreview(pet.main_image_url)
      }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no debe superar los 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(currentImageUrl || "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let mainImageUrl = currentImageUrl

      if (imageFile) {
        setUploadingImage(true)
        const uploadFormData = new FormData()
        uploadFormData.append("image", imageFile)

        const uploadResponse = await api.post("/pets/upload_image/", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        mainImageUrl = uploadResponse.data.url
        setUploadingImage(false)
      }

      await api.put(`/pets/${params.id}/`, {
        ...formData,
        age: Number.parseInt(formData.age),
        main_image_url: mainImageUrl,
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
      setUploadingImage(false)
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

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Editar Perfil de Mascota</CardTitle>
            <CardDescription>Actualiza la información de tu mascota</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="main_image">Imagen Principal</Label>
                {!imagePreview ? (
                  <div className="flex items-center gap-4">
                    <Input
                      id="main_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="main_image"
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background px-6 py-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF hasta 5MB</p>
                      </div>
                    </Label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg border">
                      <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cambiar
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {imageFile ? "Nueva imagen seleccionada" : "Imagen actual del perfil"}
                </p>
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
                  <Button
                    type="submit"
                    className="flex-1 bg-[#ff6b9d] hover:bg-[#ff4d85]"
                    disabled={saving || uploadingImage}
                  >
                    {uploadingImage ? "Subiendo..." : saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
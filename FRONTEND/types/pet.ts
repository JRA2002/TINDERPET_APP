export interface Pet {
    id: number
    name: string
    pet_type: string
    breed: string
    age: number
    gender: string
    bio: string
    main_image: string
    is_active: boolean
    images?: PetImage[]
  }

export interface PetMatch {
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

export interface PetImage {
  id: number
  image: string
  uploaded_at: string
}
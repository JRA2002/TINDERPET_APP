import { Pet } from "./pet"
export interface Match {
    id: number
    pet1_details: Pet
    pet2_details: Pet
    created_at: string
  }
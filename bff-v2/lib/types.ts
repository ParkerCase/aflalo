export interface User {
  id: string
  pin: string
  preferences: Record<string, unknown>
  created_at: Date
  is_universal: boolean
  location?: string
}

export interface CreateUserRequest {
  pin: string
  preferences: Record<string, unknown>
  is_universal: boolean
  location?: string
}

export interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
  isLoading: boolean
}

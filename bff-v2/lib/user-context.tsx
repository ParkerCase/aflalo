'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserContextType } from './types'

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing PIN in localStorage on app load
    const storedPin = localStorage.getItem('bff-user-pin')
    if (storedPin) {
      // Fetch user data from API
      fetch(`/api/users?pin=${storedPin}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const clearUser = () => {
    setUser(null)
    localStorage.removeItem('bff-user-pin')
  }

  const value: UserContextType = {
    user,
    setUser,
    clearUser,
    isLoading
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

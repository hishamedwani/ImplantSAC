import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { getStoredUser, logout as apiLogout } from '../api/client'
import type { User } from '../api/client'

interface AuthContextType {
  user:    User | null
  setUser: (u: User | null) => void
  logout:  () => void
}

const AuthContext = createContext<AuthContextType>({
  user:    null,
  setUser: () => {},
  logout:  () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser())

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
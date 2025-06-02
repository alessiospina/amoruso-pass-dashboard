'use client'

import { useJWTAuth } from '@/hooks/useJWTAuth'

export default function HeaderLogout({ children }: { children: React.ReactNode }) {
  const { logout } = useJWTAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div onClick={handleLogout} onKeyDown={handleLogout} role="button" tabIndex={0}>
      {children}
    </div>
  )
}

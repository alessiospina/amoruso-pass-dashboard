import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserPayload {
  id: string
  email: string
  name: string | null
  role: string
}

export interface AuthResponse {
  success: boolean
  user?: UserPayload
  token?: string
  message?: string
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key'
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

  /**
   * Autentica un utente con email e password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials

      // Trova l'utente nel database
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return {
          success: false,
          message: 'Credenziali non valide'
        }
      }

      // Verifica se l'utente è attivo
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account disattivato'
        }
      }

      // Verifica la password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Credenziali non valide'
        }
      }

      // Crea il payload per il JWT
      const userPayload: UserPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }

      // Genera il token JWT
      const token = jwt.sign(userPayload, this.JWT_SECRET, {
        expiresIn: this.JWT_EXPIRES_IN
      })

      return {
        success: true,
        user: userPayload,
        token
      }
    } catch (error) {
      console.error('Errore durante il login:', error)
      return {
        success: false,
        message: 'Errore interno del server'
      }
    }
  }

  /**
   * Verifica e decodifica un token JWT
   */
  static async verifyToken(token: string): Promise<UserPayload | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as UserPayload
      
      // Verifica che l'utente esista ancora nel database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      })

      if (!user || !user.isActive) {
        return null
      }

      return decoded
    } catch (error) {
      console.error('Errore nella verifica del token:', error)
      return null
    }
  }

  /**
   * Ottiene i dettagli di un utente dal database
   */
  static async getUserById(id: string): Promise<UserPayload | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      })

      if (!user || !user.isActive) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    } catch (error) {
      console.error('Errore nel recupero utente:', error)
      return null
    }
  }

  /**
   * Hash di una password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verifica una password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }
}

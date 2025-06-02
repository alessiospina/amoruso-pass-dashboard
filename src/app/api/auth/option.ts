import { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthService } from '@/services/auth.service'
import { getDictionary } from '@/locales/dictionary'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ user, token }) {
      if (user) {
        return { 
          ...token, 
          user: { 
            ...user as User,
            role: (user as any).role 
          } 
        }
      }
      return token
    },
    async session({ session, token }) {
      return { 
        ...session, 
        user: {
          ...token.user,
          role: (token.user as any)?.role || 'user'
        }
      }
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          const dict = await getDictionary()
          throw new Error(dict.login.message.auth_failed)
        }

        try {
          const authResult = await AuthService.login({
            email: credentials.email,
            password: credentials.password
          })

          if (!authResult.success || !authResult.user) {
            const dict = await getDictionary()
            throw new Error(authResult.message || dict.login.message.auth_failed)
          }

          // Restituisce i dati dell'utente per NextAuth
          return {
            id: authResult.user.id,
            name: authResult.user.name || authResult.user.email,
            email: authResult.user.email,
            role: authResult.user.role,
            avatar: '/assets/img/avatars/8.jpg', // Avatar di default
          }
        } catch (error) {
          console.error('Errore durante l\'autenticazione:', error)
          const dict = await getDictionary()
          throw new Error(dict.login.message.auth_failed)
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

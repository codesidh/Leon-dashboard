import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { findOrCreateUser, getUserById } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only allow signed-in users to proceed if they are approved
      const email = user.email
      if (!email) return false

      // Find or create user in database
      const dbUser = findOrCreateUser(
        email,
        user.name || '',
        account.provider === 'github.com' ? 'github' : 'google',
        account.providerAccountId!
      )

      // Check if user is approved
      if (!dbUser.approved && dbUser.role !== 'admin') {
        throw new Error('User approval pending. Please contact administrator.')
      }

      return true
    },
    async session({ session, user }) {
      // Add user role to session
      const dbUser = getUserById(user.id)
      if (dbUser) {
        session.user.role = dbUser.role
        session.user.approved = dbUser.approved
      }
      return session
    }
  }
})

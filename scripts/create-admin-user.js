const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Email e password dell'admin
    const email = 'admin@amoruso.com'
    const password = 'admin123'
    const name = 'Administrator'
    const role = 'admin'

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('❌ Utente admin già esistente con email:', email)
      return
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crea l'utente admin
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isActive: true,
      }
    })

    console.log('✅ Utente admin creato con successo!')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 Nome:', name)
    console.log('🛡️ Ruolo:', role)
    console.log('🆔 ID:', user.id)

  } catch (error) {
    console.error('❌ Errore nella creazione dell\'utente admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui lo script
createAdminUser()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔧 Creazione utente amministratore...')
    
    // Configurazione admin (puoi modificare questi valori)
    const adminData = {
      email: 'admin@amorusopass.com',
      password: 'admin123!',
      name: 'Amministratore Sistema',
      role: 'admin'
    }

    // Verifica se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (existingAdmin) {
      console.log(`⚠️  Utente admin già esistente: ${adminData.email}`)
      
      // Aggiorna la password se necessario
      const hashedPassword = await bcrypt.hash(adminData.password, 12)
      await prisma.user.update({
        where: { email: adminData.email },
        data: { 
          password: hashedPassword,
          role: 'admin',
          isActive: true
        }
      })
      console.log('🔄 Password admin aggiornata')
      return
    }

    // Cripta la password
    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    // Crea l'utente admin
    const admin = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: adminData.role,
        isActive: true
      }
    })

    console.log('✅ Utente amministratore creato con successo!')
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔑 Password: ${adminData.password}`)
    console.log(`👤 Nome: ${admin.name}`)
    console.log(`🛡️  Ruolo: ${admin.role}`)
    console.log('')
    console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo accesso!')

  } catch (error) {
    console.error('❌ Errore durante la creazione dell\'admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Supporto per parametri da riga di comando
const args = process.argv.slice(2)
if (args.length >= 2) {
  const email = args[0]
  const password = args[1]
  const name = args[2] || 'Amministratore'
  
  console.log(`📝 Usando parametri personalizzati:`)
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Password: ${password}`)
  console.log(`👤 Nome: ${name}`)
  
  // Override dei dati admin
  adminData = { email, password, name, role: 'admin' }
}

createAdminUser()

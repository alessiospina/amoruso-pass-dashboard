#!/bin/bash

# ==============================================
# AMORUSO PASS DASHBOARD - POST-DEPLOY SETUP
# ==============================================

set -e

echo "🔧 Setup post-deploy Amoruso Pass Dashboard"
echo "============================================="

# Attendi che i servizi siano pronti
echo "⏳ Attendendo che i servizi siano pronti..."
sleep 30

# Esegui migrazioni Prisma
echo "🗃️  Eseguendo migrazioni database..."
docker-compose exec -T app npx prisma migrate deploy

# Genera il client Prisma
echo "⚙️  Generando client Prisma..."
docker-compose exec -T app npx prisma generate

# Crea utente amministratore se non esiste
echo "👤 Creando utente amministratore..."
docker-compose exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Controlla se esiste già un admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@amoruso.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Utente admin già esistente');
      return;
    }
    
    // Crea nuovo admin
    const hashedPassword = await bcryptjs.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@amoruso.com',
        name: 'Amministratore',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Utente admin creato:', admin.email);
    console.log('🔑 Password temporanea: admin123');
    console.log('⚠️  CAMBIA LA PASSWORD AL PRIMO LOGIN!');
    
  } catch (error) {
    console.error('❌ Errore creazione admin:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
"

# Crea dati di esempio (opzionale)
echo "📊 Vuoi creare dati di esempio? (y/N)"
read -r create_sample_data

if [[ \$create_sample_data =~ ^[Yy]\$ ]]; then
  echo "🌱 Creando dati di esempio..."
  docker-compose exec -T app node -e "
const { PrismaClient } = require('@prisma/client');

async function createSampleData() {
  const prisma = new PrismaClient();
  
  try {
    // Crea alcuni ingressi di esempio
    const sampleIngressi = [
      {
        email: 'mario.rossi@example.com',
        ragione_sociale: 'Mario Rossi Trasporti SRL',
        targa: 'AB123CD',
        partita_iva: '12345678901',
        indirizzo: 'Via Roma 123, Milano',
        importo: 25.50
      },
      {
        email: 'francesco.verdi@logistics.com',
        ragione_sociale: 'Verdi Logistics SpA',
        targa: 'EF456GH',
        partita_iva: '98765432109',
        indirizzo: 'Corso Italia 456, Roma',
        importo: 45.00
      },
      {
        email: 'anna.bianchi@transport.it',
        ragione_sociale: 'Bianchi Transport',
        targa: 'IJ789KL',
        partita_iva: '11122233344',
        indirizzo: 'Piazza Duomo 789, Napoli',
        importo: 35.75
      }
    ];
    
    for (const ingresso of sampleIngressi) {
      await prisma.ingresso.create({ data: ingresso });
    }
    
    console.log('✅ Dati di esempio creati');
    
  } catch (error) {
    console.error('❌ Errore creazione dati esempio:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

createSampleData();
"
fi

# Verifica configurazione email
echo "📧 Testando configurazione email..."
docker-compose exec -T app node -e "
const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    // Verifica la connessione
    await transporter.verify();
    console.log('✅ Configurazione email valida');
    
  } catch (error) {
    console.log('⚠️  Configurazione email non valida:', error.message);
    console.log('📝 Controlla le variabili SMTP nel file .env');
  }
}

testEmail();
"

# Mostra riepilogo
echo ""
echo "🎉 Setup completato!"
echo "===================="
echo ""
echo "📍 Accessi disponibili:"
echo "   🌐 Dashboard: http://localhost:${APP_PORT:-3000}"
echo "   🗄️  Database:  localhost:${DB_PORT:-3306}"
echo "   🔄 Nginx:     http://localhost:${NGINX_PORT:-80}"
echo ""
echo "🔑 Credenziali Admin:"
echo "   📧 Email:    admin@amoruso.com"
echo "   🔐 Password: admin123"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Cambia la password admin al primo login"
echo "   2. Configura correttamente le variabili email"
echo "   3. In produzione, usa certificati SSL"
echo ""
echo "📊 Comandi utili:"
echo "   ./docker-start.sh logs    - Visualizza log"
echo "   ./docker-start.sh restart - Riavvia servizi"
echo "   ./docker-start.sh stop    - Ferma tutto"
echo ""

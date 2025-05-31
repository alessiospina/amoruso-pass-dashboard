#!/usr/bin/env ts-node

/**
 * Script di test per il sistema email
 * 
 * Uso: npx ts-node scripts/test-email-system.ts
 * 
 * Questo script testa tutte le funzionalità principali del sistema email
 */

import { getEmailNotificationService } from '../src/container/email.container'
import { getIngressoService } from '../src/container/ingresso.container'
import { getEmailService } from '../src/container/email.container'

async function testEmailSystem() {
  console.log('🚀 Avvio test sistema email...\n')

  const emailNotificationService = getEmailNotificationService()
  const emailService = getEmailService()
  const ingressoService = getIngressoService()

  try {
    // 1. Test configurazione email
    console.log('1️⃣ Test configurazione email...')
    const config = await emailNotificationService.verifyEmailConfiguration()
    console.log(`   ✅ Configurazione: ${config.isValid ? 'VALIDA' : 'NON VALIDA'}`)
    console.log(`   📝 Messaggio: ${config.message}\n`)

    // 2. Test recupero template attivi
    console.log('2️⃣ Test template email...')
    const templates = await emailService.getEmails({}, { page: 1, limit: 10 })
    console.log(`   📧 Template trovati: ${templates.total}`)
    
    const activeTemplates = templates.data.filter(t => t.isActive)
    console.log(`   ✅ Template attivi: ${activeTemplates.length}`)
    
    if (activeTemplates.length > 0) {
      console.log(`   📋 Primo template: "${activeTemplates[0].name}"`)
    }
    console.log()

    // 3. Test recupero ingressi recenti
    console.log('3️⃣ Test ingressi recenti...')
    const ingressi = await ingressoService.getIngressi({}, { page: 1, limit: 5 })
    console.log(`   🚗 Ingressi trovati: ${ingressi.total}`)
    
    if (ingressi.data.length > 0) {
      console.log(`   📋 Primo ingresso: ${ingressi.data[0].email} - ${ingressi.data[0].targa}`)
    }
    console.log()

    // 4. Test anteprima email (se ci sono template e ingressi)
    if (activeTemplates.length > 0 && ingressi.data.length > 0) {
      console.log('4️⃣ Test anteprima email...')
      const preview = await emailNotificationService.previewEmail(
        activeTemplates[0].id,
        ingressi.data[0]
      )
      
      console.log(`   📬 Destinatario: ${preview.to}`)
      console.log(`   📋 Oggetto: ${preview.subject}`)
      console.log(`   👥 CC: ${preview.cc.join(', ') || 'Nessuno'}`)
      console.log(`   📝 Corpo (primi 100 char): ${preview.text.substring(0, 100)}...`)
      console.log()
    }

    // 5. Test creazione nuovo ingresso (senza effettivo invio email
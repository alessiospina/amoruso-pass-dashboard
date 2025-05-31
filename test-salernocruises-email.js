const nodemailer = require('nodemailer');

// Configurazione specifica per info@salernocruises.com
const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 465,
  secure: true, // true per porta 465 (SSL)
  auth: {
    user: 'info@salernocruises.com',
    pass: 'infosalcruis!'
  },
  // Configurazioni aggiuntive per OVH
  connectionTimeout: 60000, // 60 secondi
  greetingTimeout: 30000,   // 30 secondi
  socketTimeout: 75000,     // 75 secondi
});

// Test di connessione e invio
async function testSalernoCruisesEmail() {
  try {
    console.log('🔄 Testing Salerno Cruises OVH Email...');
    console.log('📧 Email: info@salernocruises.com');
    console.log('🖥️  Server: ssl0.ovh.net:465 (SSL)');
    
    // Step 1: Verifica connessione
    console.log('\n1️⃣ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Step 2: Invia email di test
    console.log('\n2️⃣ Sending test email...');
    const testEmail = await transporter.sendMail({
      from: {
        name: 'Amoruso Pass System',
        address: 'info@salernocruises.com'
      },
      to: 'info@salernocruises.com', // Invio a se stesso per test
      subject: '🚗 Test Email - Configurazione Amoruso Pass Dashboard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🎉 Configurazione Email Riuscita!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Amoruso Pass Dashboard - Sistema Email</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">✅ Test Completato con Successo</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin: 0 0 15px 0;">📋 Dettagli Configurazione</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Server SMTP:</td>
                  <td style="padding: 8px 0;">ssl0.ovh.net</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Porta:</td>
                  <td style="padding: 8px 0;">465 (SSL)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;">info@salernocruises.com</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Data Test:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleString('it-IT')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0;">🚀 Sistema Pronto</h4>
              <p style="margin: 0;">Il sistema email di Amoruso Pass Dashboard è ora configurato correttamente e pronto per inviare notifiche automatiche per ogni nuovo ingresso registrato.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                🏠 Vai al Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
              Questo è un messaggio di test automatico.<br>
              Sistema: Amoruso Pass Dashboard | Provider: OVH
            </p>
          </div>
        </div>
      `,
      text: `
Test Email - Amoruso Pass Dashboard

✅ Configurazione email completata con successo!

Dettagli:
- Server: ssl0.ovh.net:465 (SSL)
- Email: info@salernocruises.com
- Data: ${new Date().toLocaleString('it-IT')}

Il sistema è ora pronto per inviare notifiche automatiche.
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', testEmail.messageId);
    console.log('📨 Check your inbox: info@salernocruises.com');
    
    console.log('\n🎉 Configuration complete! Email system is ready.');
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    
    // Suggerimenti specifici per errori OVH
    console.log('\n💡 Troubleshooting suggestions:');
    
    if (error.code === 'EAUTH') {
      console.log('   • Verify email and password in OVH panel');
      console.log('   • Make sure the email account exists and is active');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('   • Check internet connection');
      console.log('   • Try alternative: port 587 with secure: false');
      console.log('   • Verify firewall settings');
    } else if (error.code === 'EENVELOPE') {
      console.log('   • Check email address format');
      console.log('   • Verify domain is configured in OVH');
    }
    
    console.log('\n🔄 Alternative configuration to try:');
    console.log('   SMTP_HOST=ssl0.ovh.net');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_SECURE=false');
  }
}

// Esegui il test
testSalernoCruisesEmail();

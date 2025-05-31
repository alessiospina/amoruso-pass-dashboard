const nodemailer = require('nodemailer');

// Configurazione per OVH
const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 587,
  secure: false, // true per porta 465, false per altre porte
  auth: {
    user: 'tuoemail@tuodominio.com', // La tua email OVH
    pass: 'tua_password_email'       // La password della tua email
  },
  // Opzioni aggiuntive per OVH
  tls: {
    rejectUnauthorized: false // Solo per test, rimuovi in produzione
  }
});

// Test di connessione
async function testOVHConnection() {
  try {
    console.log('🔄 Testing OVH SMTP connection...');
    
    // Verifica la connessione
    await transporter.verify();
    console.log('✅ OVH SMTP connection successful!');
    
    // Invia email di test
    const testEmail = await transporter.sendMail({
      from: {
        name: 'Amoruso Pass System',
        address: 'tuoemail@tuodominio.com'
      },
      to: 'destinatario@example.com',
      subject: 'Test Email OVH - Amoruso Pass',
      html: `
        <h2>🎉 Test Email Successful!</h2>
        <p>Se ricevi questa email, la configurazione OVH è corretta.</p>
        <p><strong>Server:</strong> ssl0.ovh.net</p>
        <p><strong>Porta:</strong> 587</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
      `,
      text: 'Test email OVH successful! Configuration is working correctly.'
    });
    
    console.log('📧 Test email sent successfully!');
    console.log('Message ID:', testEmail.messageId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Suggerimenti per errori comuni
    if (error.code === 'EAUTH') {
      console.log('💡 Suggerimento: Verifica username e password email');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Suggerimento: Verifica host e porta del server SMTP');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Suggerimento: Controlla firewall o prova porta 465 con secure: true');
    }
  }
}

// Esegui il test
testOVHConnection();

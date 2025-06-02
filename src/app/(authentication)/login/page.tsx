import { Col, Row } from 'react-bootstrap'
import LoginForm from '@/app/(authentication)/login/login'
import { SearchParams } from '@/types/next'
import { getDictionary } from '@/locales/dictionary'

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl } = searchParams
  const dict = await getDictionary()

  const getCallbackUrl = () => {
    if (!callbackUrl) {
      return '/' // Default redirect to dashboard (root)
    }

    const url = callbackUrl.toString()
    
    // Se l'URL è di login, reindirizza alla root
    if (url === '/login') {
      return '/'
    }

    return url
  }

  // Logo SVG ottimizzato
  const LogoSVG = () => (
    <div className="login-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 90" width="200" height="90">
        <defs>
          <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#0d6efd", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#6610f2", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#0a58ca", stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#ffd700", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#ffed4a", stopOpacity:1}} />
          </linearGradient>
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        {/* Badge principale con gradiente */}
        <rect x="15" y="20" width="55" height="40" rx="8" ry="8" 
              fill="url(#badgeGradient)" 
              filter="url(#dropShadow)"
              stroke="#e9ecef" 
              strokeWidth="2"/>
        
        {/* Bordo interno decorativo */}
        <rect x="18" y="23" width="49" height="34" rx="6" ry="6" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="1"
              opacity="0.4"/>
        
        {/* Chip principale con gradiente */}
        <rect x="22" y="28" width="12" height="8" rx="2" fill="url(#chipGradient)" 
              filter="url(#dropShadow)"/>
        <rect x="24" y="30" width="8" height="4" rx="1" fill="#fff3cd" opacity="0.8"/>
        
        {/* Linee dati moderne */}
        <rect x="38" y="28" width="24" height="2" rx="1" fill="#ffffff" opacity="0.95"/>
        <rect x="38" y="33" width="18" height="2" rx="1" fill="#ffffff" opacity="0.8"/>
        <rect x="38" y="38" width="26" height="2" rx="1" fill="#ffffff" opacity="0.7"/>
        
        {/* Elementi decorativi */}
        <circle cx="58" cy="25" r="2" fill="#20c997" opacity="0.9"/>
        <circle cx="63" cy="25" r="1.5" fill="#0dcaf0" opacity="0.7"/>
        
        {/* Banda di sicurezza */}
        <rect x="22" y="45" width="40" height="4" rx="2" fill="#20c997" opacity="0.6"/>
        
        {/* Testo "AMORUSO" */}
        <text x="85" y="40" 
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              fontSize="28" 
              fontWeight="800" 
              fill="#212529"
              letterSpacing="-0.5px">AMORUSO</text>
        
        {/* Testo "PASS" */}
        <text x="85" y="58" 
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              fontSize="16" 
              fontWeight="700" 
              fill="#0d6efd" 
              letterSpacing="4px">PASS</text>
        
        {/* Sottotitolo */}
        <text x="85" y="70" 
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              fontSize="10" 
              fontWeight="500"
              fill="#6c757d"
              letterSpacing="1px">GESTIONE INGRESSI</text>
        
        {/* Linea decorativa */}
        <rect x="85" y="62" width="120" height="1" rx="0.5" fill="#0d6efd" opacity="0.3"/>
      </svg>
    </div>
  )

  return (
    <div className="login-page">
      <Row className="justify-content-center align-items-center w-100 px-3">
        <Col lg={5} md={7} sm={9}>
          <div className="login-card">
            {/* Logo sopra il titolo */}
            <LogoSVG />
            
            <div className="login-title">
              <h1>
                {dict.login.title}
              </h1>
              <p>
                {dict.login.description}
              </p>
            </div>

            <LoginForm callbackUrl={getCallbackUrl()} />
          </div>
        </Col>
      </Row>
    </div>
  )
}

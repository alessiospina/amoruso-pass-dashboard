'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faGauge, 
  faEuroSign, 
  faCalendarDay, 
  faCalendarAlt, 
  faCar, 
  faChartLine,
  faBuilding
} from '@fortawesome/free-solid-svg-icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DashboardStats {
  overview: {
    totalIngressi: number
    todayIngressi: number
    monthlyIngressi: number
    totalImporti: number
    todayImporti: number
    monthlyImporti: number
    uniqueTarghe: number
    uniqueRagioneSociali: number
    mostProfitableTarga: { targa: string, totalImporto: number } | null
    mostProfitableRagioneSociale: { ragione_sociale: string, totalImporto: number } | null
  }
  charts: {
    dailyStats: Array<{ date: string, ingressi: number, importo: number }>
    monthlyStats: Array<{ month: string, ingressi: number, importo: number }>
    topTarghe: Array<{ targa: string, count: number, totalImporto: number }>
    topRagioneSociali: Array<{ ragione_sociale: string, count: number, totalImporto: number }>
  }
  recentActivity: Array<{
    id: string
    email: string
    ragione_sociale: string
    targa: string
    importo: number
    created_at: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ingressi/stats')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Errore nel caricamento delle statistiche')
      }

      const data = await response.json()
      console.log('Dashboard stats data:', data)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('it-IT', {
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Caricamento statistiche...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    )
  }

  if (!stats) return null

  return (
    <div className="animated fadeIn">
      {/* Cards Overview */}
      <Row className="mb-4">
        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Totale Ingressi</div>
                  <div className="fs-2 fw-bold text-primary">{stats.overview.totalIngressi.toLocaleString()}</div>
                  <div className="text-muted small">
                    Oggi: <strong>{stats.overview.todayIngressi}</strong>
                  </div>
                </div>
                <div className="text-primary fs-1 opacity-25">
                  <FontAwesomeIcon icon={faGauge} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Ricavi Totali</div>
                  <div className="fs-2 fw-bold text-success">{formatCurrency(stats.overview.totalImporti)}</div>
                  <div className="text-muted small">
                    Oggi: <strong>{formatCurrency(stats.overview.todayImporti)}</strong>
                  </div>
                </div>
                <div className="text-success fs-1 opacity-25">
                  <FontAwesomeIcon icon={faEuroSign} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Questo Mese</div>
                  <div className="fs-2 fw-bold text-info">{stats.overview.monthlyIngressi.toLocaleString()}</div>
                  <div className="text-muted small">
                    Ricavi: <strong>{formatCurrency(stats.overview.monthlyImporti)}</strong>
                  </div>
                </div>
                <div className="text-info fs-1 opacity-25">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Targhe Uniche</div>
                  <div className="fs-2 fw-bold text-warning">{stats.overview.uniqueTarghe.toLocaleString()}</div>
                  <div className="text-muted small">
                    Top: <strong>
                      {stats.overview.mostProfitableTarga 
                        ? `${stats.overview.mostProfitableTarga.targa} (${formatCurrency(stats.overview.mostProfitableTarga.totalImporto)})`
                        : 'N/A'
                      }
                    </strong>
                  </div>
                </div>
                <div className="text-warning fs-1 opacity-25">
                  <FontAwesomeIcon icon={faCar} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Seconda riga di cards */}
      <Row className="mb-4">
        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Media Giornaliera</div>
                  <div className="fs-2 fw-bold text-secondary">
                    {stats.charts.dailyStats.length > 0 
                      ? Math.round(stats.charts.dailyStats.reduce((sum, day) => sum + day.ingressi, 0) / stats.charts.dailyStats.length)
                      : 0
                    }
                  </div>
                  <div className="text-muted small">
                    Media ricavi: <strong>
                      {formatCurrency(
                        stats.charts.dailyStats.length > 0 
                          ? stats.charts.dailyStats.reduce((sum, day) => sum + day.importo, 0) / stats.charts.dailyStats.length
                          : 0
                      )}
                    </strong>
                  </div>
                </div>
                <div className="text-secondary fs-1 opacity-25">
                  <FontAwesomeIcon icon={faCalendarDay} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Ragioni Sociali</div>
                  <div className="fs-2 fw-bold text-success">{stats.overview.uniqueRagioneSociali.toLocaleString()}</div>
                  <div className="text-muted small">
                    Top: <strong>
                      {stats.overview.mostProfitableRagioneSociale 
                        ? `${formatCurrency(stats.overview.mostProfitableRagioneSociale.totalImporto)}`
                        : 'N/A'
                      }
                    </strong>
                  </div>
                </div>
                <div className="text-success fs-1 opacity-25">
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">
                    {stats.overview.mostProfitableRagioneSociale?.ragione_sociale 
                      ? (stats.overview.mostProfitableRagioneSociale.ragione_sociale.length > 15 
                          ? `${stats.overview.mostProfitableRagioneSociale.ragione_sociale.substring(0, 15)}...`
                          : stats.overview.mostProfitableRagioneSociale.ragione_sociale)
                      : 'Migliore Cliente'
                    }
                  </div>
                  <div className="fs-3 fw-bold text-primary">
                    {stats.overview.mostProfitableRagioneSociale 
                      ? formatCurrency(stats.overview.mostProfitableRagioneSociale.totalImporto)
                      : 'N/A'
                    }
                  </div>
                  <div className="text-muted small">
                    Cliente più redditizio
                  </div>
                </div>
                <div className="text-primary fs-1 opacity-25">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted small mb-1">Ricavo Medio</div>
                  <div className="fs-3 fw-bold text-info">
                    {formatCurrency(
                      stats.overview.totalIngressi > 0 
                        ? stats.overview.totalImporti / stats.overview.totalIngressi
                        : 0
                    )}
                  </div>
                  <div className="text-muted small">
                    Per singolo ingresso
                  </div>
                </div>
                <div className="text-info fs-1 opacity-25">
                  <FontAwesomeIcon icon={faEuroSign} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Grafici */}
      <Row className="mb-4">
        {/* Grafico Andamento Giornaliero */}
        <Col xs={12} lg={8} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faChartLine} className="me-2 text-primary" />
                <strong>Andamento Ultimi 30 Giorni</strong>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.charts.dailyStats.slice(0, 30).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'ingressi' ? value : formatCurrency(Number(value)),
                      name === 'ingressi' ? 'Ingressi' : 'Ricavi'
                    ]}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="ingressi" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="importo" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Targhe e Top Ragioni Sociali */}
      <Row className="mb-4">
        {/* Top Targhe */}
        <Col xs={12} lg={6} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faCar} className="me-2 text-secondary" />
                <strong>Targhe Più Frequenti</strong>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px', overflowY: 'auto' }}>
                {stats.charts.topTarghe.map((item, index) => (
                  <div key={item.targa} className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={index < 3 ? 'primary' : 'secondary'} 
                        className="me-2"
                        style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="fw-bold">{item.targa}</div>
                        <div className="text-muted small">{formatCurrency(item.totalImporto)}</div>
                      </div>
                    </div>
                    <Badge bg="info" className="fs-6">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Top Ragioni Sociali */}
        <Col xs={12} lg={6} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faBuilding} className="me-2 text-success" />
                <strong>Ragioni Sociali Più Frequenti</strong>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px', overflowY: 'auto' }}>
                {stats.charts.topRagioneSociali.map((item, index) => (
                  <div key={item.ragione_sociale} className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={index < 3 ? 'success' : 'secondary'} 
                        className="me-2"
                        style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {index + 1}
                      </Badge>
                      <div style={{ maxWidth: '250px' }}>
                        <div className="fw-bold" style={{ 
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }} title={item.ragione_sociale}>
                          {item.ragione_sociale}
                        </div>
                        <div className="text-muted small">{formatCurrency(item.totalImporto)}</div>
                      </div>
                    </div>
                    <Badge bg="success" className="fs-6">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Grafico Mensile e Attività Recente */}
      <Row>
        {/* Grafico Andamento Mensile */}
        <Col xs={12} lg={8} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-info" />
                <strong>Andamento Mensile</strong>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.charts.monthlyStats.slice(0, 12).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonthYear}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'ingressi' ? value : formatCurrency(Number(value)),
                      name === 'ingressi' ? 'Ingressi' : 'Ricavi'
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="ingressi" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="importo" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Attività Recente */}
        <Col xs={12} lg={4} className="mb-3">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faGauge} className="me-2 text-primary" />
                <strong>Attività Recente</strong>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px', overflowY: 'auto' }}>
                {stats.recentActivity.map((ingresso) => (
                  <div key={ingresso.id} className="border-bottom pb-2 mb-2">
                    <div className="fw-bold small">{ingresso.ragione_sociale}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {ingresso.email}
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-1">
                      <Badge bg="secondary" className="small">
                        {ingresso.targa}
                      </Badge>
                      <span className="fw-bold text-success small">
                        {formatCurrency(ingresso.importo)}
                      </span>
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {formatDateTime(ingresso.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

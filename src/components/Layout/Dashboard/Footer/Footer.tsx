import React from 'react'
import { Container } from 'react-bootstrap'

export default function Footer() {
  return (
    <footer className="footer border-top px-sm-2 py-2">
      <Container fluid className="text-center align-items-center flex-column flex-md-row d-flex justify-content-between">
        <div>
          <strong className="text-primary">SalernoCruises</strong>
          {' '}
          © 2025
        </div>
        <div className="ms-md-auto">
          Powered by&nbsp;
          <strong className="text-dark">
            Manovalanza
          </strong>
        </div>
      </Container>
    </footer>
  )
}

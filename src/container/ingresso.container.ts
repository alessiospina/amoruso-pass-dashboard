import { prisma } from '@/lib/prisma'
import { PrismaIngressoRepository } from '@/repositories/ingresso.repository'
import { IngressoService } from '@/services/ingresso.service'

// Container per Dependency Injection
class IngressoContainer {
  private static instance: IngressoContainer
  private _ingressoService: IngressoService | null = null

  private constructor() {}

  static getInstance(): IngressoContainer {
    if (!IngressoContainer.instance) {
      IngressoContainer.instance = new IngressoContainer()
    }
    return IngressoContainer.instance
  }

  getIngressoService(): IngressoService {
    if (!this._ingressoService) {
      const repository = new PrismaIngressoRepository(prisma)
      this._ingressoService = new IngressoService(repository)
    }
    return this._ingressoService
  }

  // Per testing - permette di iniettare mock
  setIngressoService(service: IngressoService): void {
    this._ingressoService = service
  }

  // Reset per testing
  reset(): void {
    this._ingressoService = null
  }
}

// Singleton instance
export const ingressoContainer = IngressoContainer.getInstance()

// Helper function per ottenere il service
export const getIngressoService = (): IngressoService => {
  return ingressoContainer.getIngressoService()
}

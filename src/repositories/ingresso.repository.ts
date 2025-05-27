import { Ingresso, PrismaClient } from '@prisma/client'
import {
  CreateIngressoDTO,
  UpdateIngressoDTO,
  IngressoFiltersDTO,
  PaginationDTO,
  PaginatedResultDTO,
  IngressoAggregationsDTO,
} from '@/dto/ingresso.dto'

export interface IngressoRepository {
  create(data: CreateIngressoDTO): Promise<Ingresso>;
  findById(id: string): Promise<Ingresso | null>;
  findMany(filters: IngressoFiltersDTO, pagination: PaginationDTO): Promise<PaginatedResultDTO<Ingresso>>;
  findByEmail(email: string): Promise<Ingresso[]>;
  findByTarga(targa: string): Promise<Ingresso[]>;
  update(id: string, data: UpdateIngressoDTO): Promise<Ingresso>;
  delete(id: string): Promise<void>;
  count(filters?: IngressoFiltersDTO): Promise<number>;
  search(query: string, limit: number): Promise<Ingresso[]>;
  getCountByDateRange(startDate: Date, endDate: Date): Promise<number>;
}

export class PrismaIngressoRepository implements IngressoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateIngressoDTO): Promise<Ingresso> {
    return this.prisma.ingresso.create({
      data: {
        email: data.email,
        ragione_sociale: data.ragione_sociale,
        targa: data.targa.toUpperCase(),
        importo: data.importo,
      },
    })
  }

  async findById(id: string): Promise<Ingresso | null> {
    return this.prisma.ingresso.findUnique({
      where: { id },
    })
  }

  async findMany(
    filters: IngressoFiltersDTO = {},
    pagination: PaginationDTO,
  ): Promise<PaginatedResultDTO<Ingresso>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where = this.buildWhereClause(filters)

    const [data, total] = await Promise.all([
      this.prisma.ingresso.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.ingresso.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findByEmail(email: string): Promise<Ingresso[]> {
    return this.prisma.ingresso.findMany({
      where: {
        email: { contains: email },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async findByTarga(targa: string): Promise<Ingresso[]> {
    return this.prisma.ingresso.findMany({
      where: {
        targa: { contains: targa.toUpperCase() },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async update(id: string, data: UpdateIngressoDTO): Promise<Ingresso> {
    const updateData: any = { ...data }
    if (updateData.targa) {
      updateData.targa = updateData.targa.toUpperCase()
    }

    return this.prisma.ingresso.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ingresso.delete({
      where: { id },
    })
  }

  async count(filters: IngressoFiltersDTO = {}): Promise<number> {
    const where = this.buildWhereClause(filters)
    return this.prisma.ingresso.count({ where })
  }

  async search(query: string, limit: number): Promise<Ingresso[]> {
    return this.prisma.ingresso.findMany({
      where: {
        OR: [
          { email: { contains: query } },
          { ragione_sociale: { contains: query } },
          { targa: { contains: query.toUpperCase() } },
        ],
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    })
  }

  async getCountByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.ingresso.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
  }

  private buildWhereClause(filters: IngressoFiltersDTO): any {
    const where: any = {}

    if (filters.email) {
      where.email = { contains: filters.email }
    }

    if (filters.ragione_sociale) {
      where.ragione_sociale = { contains: filters.ragione_sociale }
    }

    if (filters.targa) {
      where.targa = { contains: filters.targa.toUpperCase() }
    }

    if (filters.importo_min !== undefined || filters.importo_max !== undefined) {
      where.importo = {}
      if (filters.importo_min !== undefined) where.importo.gte = filters.importo_min
      if (filters.importo_max !== undefined) where.importo.lte = filters.importo_max
    }

    if (filters.date_from || filters.date_to) {
      where.created_at = {}
      if (filters.date_from) where.created_at.gte = filters.date_from
      if (filters.date_to) where.created_at.lte = filters.date_to
    }

    return where
  }
}

import { Email, PrismaClient } from '@prisma/client'
import {
  CreateEmailDTO,
  UpdateEmailDTO,
  EmailFiltersDTO,
} from '@/dto/email.dto'
import { PaginationDTO, PaginatedResultDTO } from '@/dto/ingresso.dto'

export interface EmailRepository {
  create(data: CreateEmailDTO): Promise<Email>
  findById(id: string): Promise<Email | null>
  findMany(filters: EmailFiltersDTO, pagination: PaginationDTO): Promise<PaginatedResultDTO<Email>>
  findByName(name: string): Promise<Email[]>
  update(id: string, data: UpdateEmailDTO): Promise<Email>
  delete(id: string): Promise<void>
  count(filters?: EmailFiltersDTO): Promise<number>
  search(query: string, limit: number): Promise<Email[]>
}

export class PrismaEmailRepository implements EmailRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateEmailDTO): Promise<Email> {
    return this.prisma.email.create({
      data: {
        name: data.name.trim(),
        recipients: data.recipients.join(','), // Salva come stringa separata da virgole
        subject: data.subject.trim(),
        body: data.body.trim(),
        isActive: data.isActive ?? true,
      },
    })
  }

  async findById(id: string): Promise<Email | null> {
    return this.prisma.email.findUnique({
      where: { id },
    })
  }

  async findMany(
    filters: EmailFiltersDTO = {},
    pagination: PaginationDTO,
  ): Promise<PaginatedResultDTO<Email>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where = this.buildWhereClause(filters)

    const [data, total] = await Promise.all([
      this.prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.email.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findByName(name: string): Promise<Email[]> {
    return this.prisma.email.findMany({
      where: {
        name: { contains: name },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async update(id: string, data: UpdateEmailDTO): Promise<Email> {
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.recipients !== undefined) updateData.recipients = data.recipients.join(',')
    if (data.subject !== undefined) updateData.subject = data.subject.trim()
    if (data.body !== undefined) updateData.body = data.body.trim()
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    return this.prisma.email.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.email.delete({
      where: { id },
    })
  }

  async count(filters: EmailFiltersDTO = {}): Promise<number> {
    const where = this.buildWhereClause(filters)
    return this.prisma.email.count({ where })
  }

  async search(query: string, limit: number): Promise<Email[]> {
    return this.prisma.email.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { subject: { contains: query } },
          { recipients: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    })
  }

  private buildWhereClause(filters: EmailFiltersDTO): any {
    const where: any = {}

    if (filters.name) {
      where.name = { contains: filters.name }
    }

    if (filters.subject) {
      where.subject = { contains: filters.subject }
    }

    if (filters.recipient) {
      where.recipients = { contains: filters.recipient }
    }

    return where
  }
}

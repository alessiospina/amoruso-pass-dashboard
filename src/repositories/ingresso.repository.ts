import {Ingresso, PrismaClient} from '@prisma/client'
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

    // Metodi per statistiche
    countByDateRange(startDate: Date, endDate: Date): Promise<number>;

    sumImporti(): Promise<number>;

    sumImportiByDateRange(startDate: Date, endDate: Date): Promise<number>;

    getDailyStats(days: number): Promise<Array<{ date: string, ingressi: number, importo: number }>>;

    getMonthlyStats(months: number): Promise<Array<{ month: string, ingressi: number, importo: number }>>;

    getTopTarghe(limit: number): Promise<Array<{ targa: string, count: number, totalImporto: number }>>;

    getTopRagioneSociali(limit: number): Promise<Array<{
        ragione_sociale: string,
        count: number,
        totalImporto: number
    }>>;

    getUniqueTargheCount(): Promise<number>;

    getUniqueRagioneSocialiCount(): Promise<number>;

    getMostProfitableTarga(): Promise<{ targa: string, totalImporto: number } | null>;

    getMostProfitableRagioneSociale(): Promise<{ ragione_sociale: string, totalImporto: number } | null>;
}

export class PrismaIngressoRepository implements IngressoRepository {
    constructor(private prisma: PrismaClient) {
    }

    async create(data: CreateIngressoDTO): Promise<Ingresso> {
        const createData: any = {
            email: data.email,
            ragione_sociale: data.ragione_sociale,
            targa: data.targa.toUpperCase(),
            partita_iva: data.partita_iva,
            indirizzo: data.indirizzo,
            importo: data.importo,
        }

        // Se viene fornita una data personalizzata, utilizzala; altrimenti Prisma userà il default
        if (data.created_at) {
            createData.created_at = typeof data.created_at === 'string' ? new Date(data.created_at) : data.created_at
        }

        return this.prisma.ingresso.create({
            data: createData,
        })
    }

    async findById(id: string): Promise<Ingresso | null> {
        return this.prisma.ingresso.findUnique({
            where: {id},
        })
    }

    async findMany(
        filters: IngressoFiltersDTO = {},
        pagination: PaginationDTO,
    ): Promise<PaginatedResultDTO<Ingresso>> {
        const {page, limit} = pagination
        const skip = (page - 1) * limit

        const where = this.buildWhereClause(filters)

        const [data, total] = await Promise.all([
            this.prisma.ingresso.findMany({
                where,
                skip,
                take: limit,
                orderBy: {created_at: 'desc'},
            }),
            this.prisma.ingresso.count({where}),
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
                email: {contains: email},
            },
            orderBy: {created_at: 'desc'},
        })
    }

    async findByTarga(targa: string): Promise<Ingresso[]> {
        return this.prisma.ingresso.findMany({
            where: {
                targa: {contains: targa.toUpperCase()},
            },
            orderBy: {created_at: 'desc'},
        })
    }

    async update(id: string, data: UpdateIngressoDTO): Promise<Ingresso> {
        const updateData: any = {...data}
        if (updateData.targa) {
            updateData.targa = updateData.targa.toUpperCase()
        }

        // Gestisce il campo created_at se fornito
        if (updateData.created_at) {
            updateData.created_at = typeof updateData.created_at === 'string' ? new Date(updateData.created_at) : updateData.created_at
        }

        return this.prisma.ingresso.update({
            where: {id},
            data: updateData,
        })
    }

    async delete(id: string): Promise<void> {
        await this.prisma.ingresso.delete({
            where: {id},
        })
    }

    async count(filters: IngressoFiltersDTO = {}): Promise<number> {
        const where = this.buildWhereClause(filters)
        return this.prisma.ingresso.count({where})
    }

    async search(query: string, limit: number): Promise<Ingresso[]> {
        return this.prisma.ingresso.findMany({
            where: {
                OR: [
                    {email: {contains: query}},
                    {ragione_sociale: {contains: query}},
                    {targa: {contains: query.toUpperCase()}},
                    {partita_iva: {contains: query}},
                    {indirizzo: {contains: query}},
                ],
            },
            take: limit,
            orderBy: {created_at: 'desc'},
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

    // Implementazione metodi per statistiche
    async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
        return this.prisma.ingresso.count({
            where: {
                created_at: {
                    gte: startDate,
                    lt: endDate,
                },
            },
        })
    }

    async sumImporti(): Promise<number> {
        const result = await this.prisma.ingresso.aggregate({
            _sum: {
                importo: true,
            },
        })
        return result._sum.importo || 0
    }

    async sumImportiByDateRange(startDate: Date, endDate: Date): Promise<number> {
        const result = await this.prisma.ingresso.aggregate({
            where: {
                created_at: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            _sum: {
                importo: true,
            },
        })
        return result._sum.importo || 0
    }

    async getDailyStats(days: number): Promise<Array<{ date: string, ingressi: number, importo: number }>> {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        const results = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as ingressi,
        COALESCE(SUM(importo), 0) as importo
      FROM ingressi 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    ` as Array<{ date: Date, ingressi: bigint, importo: number }>

        return results.map(row => ({
            date: new Date(row.date).toISOString().split('T')[0],
            ingressi: Number(row.ingressi),
            importo: Number(row.importo || 0),
        }))
    }

    async getMonthlyStats(months: number): Promise<Array<{ month: string, ingressi: number, importo: number }>> {
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)

        const results = await this.prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as ingressi,
        COALESCE(SUM(importo), 0) as importo
      FROM ingressi 
      WHERE created_at >= ${startDate}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    ` as Array<{ month: string, ingressi: bigint, importo: number }>

        return results.map(row => ({
            month: row.month,
            ingressi: Number(row.ingressi),
            importo: Number(row.importo || 0),
        }))
    }

    async getTopTarghe(limit: number): Promise<Array<{ targa: string, count: number, totalImporto: number }>> {
        const results = await this.prisma.$queryRaw`
      SELECT 
        targa,
        COUNT(*) as count,
        COALESCE(SUM(importo), 0) as totalImporto
      FROM ingressi 
      GROUP BY targa
      ORDER BY count DESC, totalImporto DESC
      LIMIT ${limit}
    ` as Array<{ targa: string, count: bigint, totalImporto: number }>

        return results.map(row => ({
            targa: row.targa,
            count: Number(row.count),
            totalImporto: Number(row.totalImporto || 0),
        }))
    }

    async getTopRagioneSociali(limit: number): Promise<Array<{
        ragione_sociale: string,
        count: number,
        totalImporto: number
    }>> {
        const results = await this.prisma.$queryRaw`
      SELECT 
        ragione_sociale,
        COUNT(*) as count,
        COALESCE(SUM(importo), 0) as totalImporto
      FROM ingressi 
      GROUP BY ragione_sociale
      ORDER BY count DESC, totalImporto DESC
      LIMIT ${limit}
    ` as Array<{ ragione_sociale: string, count: bigint, totalImporto: number }>

        return results.map(row => ({
            ragione_sociale: row.ragione_sociale,
            count: Number(row.count),
            totalImporto: Number(row.totalImporto || 0),
        }))
    }

    async getUniqueTargheCount(): Promise<number> {
        const result = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT targa) as count
      FROM ingressi
    ` as Array<{ count: bigint }>

        return Number(result[0]?.count || 0)
    }

    async getUniqueRagioneSocialiCount(): Promise<number> {
        const result = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT ragione_sociale) as count
      FROM ingressi
    ` as Array<{ count: bigint }>

        return Number(result[0]?.count || 0)
    }

    async getMostProfitableTarga(): Promise<{ targa: string, totalImporto: number } | null> {
        const results = await this.prisma.$queryRaw`
      SELECT 
        targa,
        COALESCE(SUM(importo), 0) as totalImporto
      FROM ingressi 
      GROUP BY targa
      ORDER BY totalImporto DESC
      LIMIT 1
    ` as Array<{ targa: string, totalImporto: number }>

        return results[0] ? {
            targa: results[0].targa,
            totalImporto: Number(results[0].totalImporto || 0)
        } : null
    }

    async getMostProfitableRagioneSociale(): Promise<{ ragione_sociale: string, totalImporto: number } | null> {
        const results = await this.prisma.$queryRaw`
      SELECT 
        ragione_sociale,
        COALESCE(SUM(importo), 0) as totalImporto
      FROM ingressi 
      GROUP BY ragione_sociale
      ORDER BY totalImporto DESC
      LIMIT 1
    ` as Array<{ ragione_sociale: string, totalImporto: number }>

        return results[0] ? {
            ragione_sociale: results[0].ragione_sociale,
            totalImporto: Number(results[0].totalImporto || 0)
        } : null
    }

    private buildWhereClause(filters: IngressoFiltersDTO): any {
        const where: any = {}

        if (filters.email) {
            where.email = {contains: filters.email}
        }

        if (filters.ragione_sociale) {
            where.ragione_sociale = {contains: filters.ragione_sociale}
        }

        if (filters.targa) {
            where.targa = {contains: filters.targa.toUpperCase()}
        }

        if (filters.partita_iva) {
            where.partita_iva = {contains: filters.partita_iva}
        }

        if (filters.indirizzo) {
            where.indirizzo = {contains: filters.indirizzo}
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

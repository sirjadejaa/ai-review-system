import { prisma } from '@/lib/db';
import type { DomainFeedback, FeedbackStatus } from '@/lib/domain/types';
import {
  CreateFeedbackInputSchema,
  UpdateFeedbackStatusSchema,
  type CreateFeedbackInput,
} from '@/lib/validation/feedback-schema';

function toDomain(record: {
  id: string;
  rating: number;
  tags: string;
  notes: string | null;
  customerContact: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): DomainFeedback {
  let tags: string[] = [];
  try {
    tags = JSON.parse(record.tags);
  } catch {
    tags = [];
  }

  return {
    id: record.id,
    rating: record.rating,
    tags,
    notes: record.notes,
    customerContact: record.customerContact,
    status: record.status as FeedbackStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Creates customer feedback with strict 1-5 rating validation.
 * Never stores sensitive medical or prescription records.
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<DomainFeedback> {
  const validated = CreateFeedbackInputSchema.parse(input);

  const created = await prisma.feedback.create({
    data: {
      rating: validated.rating,
      tags: JSON.stringify(validated.tags),
      notes: validated.notes ?? null,
      customerContact: validated.customerContact ?? null,
      status: 'NEW',
    },
  });

  return toDomain(created);
}

/**
 * Retrieves feedback record by ID.
 */
export async function getFeedbackById(id: string): Promise<DomainFeedback | null> {
  const record = await prisma.feedback.findUnique({
    where: { id },
  });

  return record ? toDomain(record) : null;
}

/**
 * Lists feedback records ordered chronologically (newest first).
 */
export async function listFeedback(options?: {
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
}): Promise<DomainFeedback[]> {
  const records = await prisma.feedback.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });

  return records.map(toDomain);
}

/**
 * Updates status of a feedback record (NEW -> REVIEWED -> RESOLVED).
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<DomainFeedback | null> {
  UpdateFeedbackStatusSchema.parse({ status });

  try {
    const updated = await prisma.feedback.update({
      where: { id },
      data: { status },
    });
    return toDomain(updated);
  } catch {
    return null;
  }
}

/**
 * Calculates aggregate feedback statistics for the owner dashboard.
 */
export async function getFeedbackSummary(): Promise<{
  total: number;
  averageRating: number;
  newCount: number;
}> {
  const total = await prisma.feedback.count();
  const newCount = await prisma.feedback.count({ where: { status: 'NEW' } });
  const aggregations = await prisma.feedback.aggregate({
    _avg: { rating: true },
  });

  return {
    total,
    averageRating: aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0,
    newCount,
  };
}

export interface FeedbackDashboardSummary {
  total: number;
  averageRating: number;
  newCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface DashboardRecentFeedbackItem {
  id: string;
  rating: number;
  tags: string[];
  notes: string | null;
  status: FeedbackStatus;
  createdAt: Date;
}

/**
 * Calculates aggregate feedback statistics and fetches recent records for the owner dashboard.
 * Privacy rule: strictly omits customerContact from dashboard summary output.
 */
export async function getFeedbackDashboardAnalytics(
  startDate: Date | null
): Promise<{
  summary: FeedbackDashboardSummary;
  recent: DashboardRecentFeedbackItem[];
}> {
  const whereClause = startDate ? { createdAt: { gte: startDate } } : undefined;

  const [total, newCount, aggregations, ratingsGrouped, recentRecords] = await Promise.all([
    prisma.feedback.count({ where: whereClause }),
    prisma.feedback.count({
      where: {
        status: 'NEW',
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
    }),
    prisma.feedback.aggregate({
      where: whereClause,
      _avg: { rating: true },
    }),
    prisma.feedback.groupBy({
      by: ['rating'],
      where: whereClause,
      _count: { id: true },
    }),
    prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        rating: true,
        tags: true,
        notes: true,
        status: true,
        createdAt: true,
        // customerContact is deliberately omitted for owner dashboard privacy
      },
    }),
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const item of ratingsGrouped) {
    const r = item.rating as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      distribution[r] = item._count.id;
    }
  }

  const averageRating = aggregations._avg.rating
    ? Number(aggregations._avg.rating.toFixed(1))
    : 0;

  const recent: DashboardRecentFeedbackItem[] = recentRecords.map((r) => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(r.tags);
    } catch {
      tags = [];
    }
    return {
      id: r.id,
      rating: r.rating,
      tags,
      notes: r.notes,
      status: r.status as FeedbackStatus,
      createdAt: r.createdAt,
    };
  });

  return {
    summary: {
      total,
      averageRating,
      newCount,
      distribution,
    },
    recent,
  };
}

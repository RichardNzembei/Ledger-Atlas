import { and, asc, eq, sql } from 'drizzle-orm';
import { domainEvents } from '@inventory/db/schema';
import { ConcurrencyError } from '@inventory/domain/errors';
import { db } from './db.js';
import { uuidToBinary } from '@inventory/domain/utils';

export interface AppendOptions {
  tenantId: Buffer;
  streamType: string;
  streamId: Buffer;
  expectedVersion: number;
  events: Array<{
    type: string;
    payload: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>;
}

export interface StoredEvent {
  id: bigint;
  tenantId: Buffer;
  streamType: string;
  streamId: Buffer;
  version: number;
  eventType: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export class EventStore {
  async append(opts: AppendOptions): Promise<void> {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: domainEvents.version })
        .from(domainEvents)
        .where(
          and(
            eq(domainEvents.tenantId, opts.tenantId),
            eq(domainEvents.streamType, opts.streamType),
            eq(domainEvents.streamId, opts.streamId),
          ),
        )
        .orderBy(asc(domainEvents.version))
        .limit(1);

      const currentVersion = rows[0]?.version ?? 0;

      if (currentVersion !== opts.expectedVersion) {
        throw new ConcurrencyError(
          opts.streamId.toString('hex'),
          opts.expectedVersion,
          currentVersion,
        );
      }

      let nextVersion = currentVersion + 1;
      for (const event of opts.events) {
        await tx.insert(domainEvents).values({
          tenantId: opts.tenantId,
          streamType: opts.streamType,
          streamId: opts.streamId,
          version: nextVersion++,
          eventType: event.type,
          payload: event.payload,
          metadata: event.metadata,
        });
      }
    });
  }

  async readStream(
    tenantId: Buffer,
    streamType: string,
    streamId: Buffer,
    fromVersion = 0,
  ): Promise<StoredEvent[]> {
    const rows = await db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.tenantId, tenantId),
          eq(domainEvents.streamType, streamType),
          eq(domainEvents.streamId, streamId),
          sql`${domainEvents.version} > ${fromVersion}`,
        ),
      )
      .orderBy(asc(domainEvents.version));

    return rows as StoredEvent[];
  }

  async readByType(
    tenantId: Buffer,
    eventType: string,
    limit = 100,
  ): Promise<StoredEvent[]> {
    const rows = await db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.tenantId, tenantId),
          eq(domainEvents.eventType, eventType),
        ),
      )
      .orderBy(asc(domainEvents.occurredAt))
      .limit(limit);

    return rows as StoredEvent[];
  }
}

export const eventStore = new EventStore();

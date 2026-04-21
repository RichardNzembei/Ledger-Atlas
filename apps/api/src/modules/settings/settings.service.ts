import { and, eq } from 'drizzle-orm';
import { settings } from '@inventory/db/schema';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import type { UpsertSettingRequest, SettingScope } from '@inventory/contracts/settings';
import { db } from '../../infra/db.js';

const SETTING_DEFAULTS: Record<string, unknown> = {
  'pos.currency': 'KES',
  'pos.tax_rate': 0.16,
  'pos.receipt_footer': '',
  'pos.allow_negative_stock': false,
  'inventory.low_stock_threshold': 10,
  'inventory.cost_method': 'fifo',
  'notifications.email_enabled': true,
  'notifications.low_stock_email': '',
};

export class SettingsService {
  async resolve(
    tenantId: Buffer,
    opts: { scopeType?: SettingScope; scopeId?: string; prefix?: string },
  ): Promise<Record<string, unknown>> {
    const conditions = [eq(settings.tenantId, tenantId)];

    const rows = await db
      .select()
      .from(settings)
      .where(and(...conditions));

    const resolved: Record<string, unknown> = { ...SETTING_DEFAULTS };

    // Apply tenant-level settings
    for (const row of rows.filter((r) => r.scopeType === 'tenant')) {
      resolved[row.key] = row.value;
    }

    // Apply scope-specific overrides
    if (opts.scopeType && opts.scopeId) {
      const scopeIdBuf = uuidToBinary(opts.scopeId);
      for (const row of rows.filter(
        (r) =>
          r.scopeType === opts.scopeType &&
          r.scopeId != null &&
          Buffer.from(r.scopeId as Buffer).equals(scopeIdBuf),
      )) {
        resolved[row.key] = row.value;
      }
    }

    if (opts.prefix) {
      return Object.fromEntries(
        Object.entries(resolved).filter(([k]) => k.startsWith(opts.prefix!)),
      );
    }

    return resolved;
  }

  async upsert(tenantId: Buffer, body: UpsertSettingRequest) {
    const existing = await db
      .select({ id: settings.id })
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantId),
          eq(settings.scopeType, body.scopeType ?? 'tenant'),
          eq(settings.key, body.key),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(settings)
        .set({ value: body.value })
        .where(eq(settings.id, existing[0].id));
    } else {
      const id = uuidToBinary(uuidv7());
      const scopeId = body.scopeId ? uuidToBinary(body.scopeId) : null;
      await db.insert(settings).values({
        id,
        tenantId,
        scopeType: body.scopeType ?? 'tenant',
        scopeId,
        key: body.key,
        value: body.value,
      });
    }
  }

  async list(tenantId: Buffer, scopeType?: 'tenant' | 'location' | 'user') {
    const conditions = [eq(settings.tenantId, tenantId)];
    if (scopeType) conditions.push(eq(settings.scopeType, scopeType));
    const rows = await db
      .select()
      .from(settings)
      .where(and(...conditions));

    return rows.map((r) => ({
      id: binaryToUuid(r.id as Buffer),
      tenantId: binaryToUuid(r.tenantId as Buffer),
      key: r.key,
      value: r.value,
      scopeType: r.scopeType,
      scopeId: r.scopeId ? binaryToUuid(r.scopeId as Buffer) : null,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
}

export const settingsService = new SettingsService();

import {
  mysqlTable,
  binary,
  varchar,
  text,
  boolean,
  timestamp,
  int,
  decimal,
  json,
  bigint,
  char,
  mysqlEnum,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/mysql-core';

// ---------------------------------------------------------------------------
// Core tables
// ---------------------------------------------------------------------------

export const tenants = mysqlTable(
  'tenants',
  {
    id: binary('id', { length: 16 }).notNull(),
    slug: varchar('slug', { length: 63 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['active', 'suspended', 'trial']).notNull().default('trial'),
    plan: mysqlEnum('plan', ['free', 'starter', 'growth', 'enterprise']).notNull().default('free'),
    settings: json('settings').notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    slugIdx: unique('idx_tenants_slug').on(t.slug),
  }),
);

export const users = mysqlTable(
  'users',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['active', 'suspended', 'invited']).notNull().default('invited'),
    roles: json('roles').notNull().$type<string[]>(),
    lastLoginAt: timestamp('last_login_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    tenantEmailIdx: unique('idx_users_tenant_email').on(t.tenantId, t.email),
    statusIdx: index('idx_users_tenant_status').on(t.tenantId, t.status),
  }),
);

export const locations = mysqlTable(
  'locations',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    parentId: binary('parent_id', { length: 16 }),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: mysqlEnum('type', ['warehouse', 'store', 'bin', 'virtual']).notNull().default('store'),
    address: text('address'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    tenantCodeIdx: unique('idx_locations_tenant_code').on(t.tenantId, t.code),
    activeIdx: index('idx_locations_active').on(t.tenantId, t.isActive),
  }),
);

export const products = mysqlTable(
  'products',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    sku: varchar('sku', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }),
    subcategory: varchar('subcategory', { length: 100 }),
    unitOfMeasure: varchar('unit_of_measure', { length: 20 }).notNull().default('unit'),
    basePrice: decimal('base_price', { precision: 14, scale: 4 }).notNull().default('0'),
    costPrice: decimal('cost_price', { precision: 14, scale: 4 }).notNull().default('0'),
    taxClass: varchar('tax_class', { length: 50 }),
    trackLots: boolean('track_lots').notNull().default(false),
    trackSerials: boolean('track_serials').notNull().default(false),
    reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }),
    reorderQty: decimal('reorder_qty', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    tenantSkuIdx: unique('idx_products_tenant_sku').on(t.tenantId, t.sku),
    activeIdx: index('idx_products_tenant_active').on(t.tenantId, t.isActive),
    categoryIdx: index('idx_products_category').on(t.tenantId, t.category),
  }),
);

export const customers = mysqlTable(
  'customers',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    code: varchar('code', { length: 50 }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 320 }),
    phone: varchar('phone', { length: 30 }),
    segment: mysqlEnum('segment', ['retail', 'wholesale', 'vip', 'staff']).notNull().default('retail'),
    creditLimit: decimal('credit_limit', { precision: 14, scale: 4 }).notNull().default('0'),
    balance: decimal('balance', { precision: 14, scale: 4 }).notNull().default('0'),
    address: text('address'),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    emailIdx: unique('idx_customers_tenant_email').on(t.tenantId, t.email),
    phoneIdx: index('idx_customers_tenant_phone').on(t.tenantId, t.phone),
    segmentIdx: index('idx_customers_segment').on(t.tenantId, t.segment),
  }),
);

export const assets = mysqlTable(
  'assets',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    assetTag: varchar('asset_tag', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }),
    status: mysqlEnum('status', ['active', 'in_maintenance', 'disposed', 'lost']).notNull().default('active'),
    lifecycleStage: mysqlEnum('lifecycle_stage', [
      'acquired', 'assigned', 'in_service', 'under_repair', 'decommissioned', 'disposed',
    ]).notNull().default('acquired'),
    locationId: binary('location_id', { length: 16 }),
    assignedToUserId: binary('assigned_to_user_id', { length: 16 }),
    acquiredAt: varchar('acquired_at', { length: 10 }),
    acquisitionCost: decimal('acquisition_cost', { precision: 14, scale: 4 }).notNull().default('0'),
    bookValue: decimal('book_value', { precision: 14, scale: 4 }).notNull().default('0'),
    depreciationMethod: mysqlEnum('depreciation_method', [
      'straight_line', 'declining_balance', 'units_of_production', 'none',
    ]).notNull().default('straight_line'),
    usefulLifeMonths: int('useful_life_months', { unsigned: true }),
    salvageValue: decimal('salvage_value', { precision: 14, scale: 4 }).notNull().default('0'),
    serialNumber: varchar('serial_number', { length: 128 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    tagIdx: unique('idx_assets_tenant_tag').on(t.tenantId, t.assetTag),
    statusIdx: index('idx_assets_tenant_status').on(t.tenantId, t.status),
    locationIdx: index('idx_assets_location').on(t.tenantId, t.locationId),
  }),
);

export const sales = mysqlTable(
  'sales',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    saleNumber: varchar('sale_number', { length: 50 }).notNull(),
    locationId: binary('location_id', { length: 16 }).notNull(),
    customerId: binary('customer_id', { length: 16 }),
    cashierId: binary('cashier_id', { length: 16 }).notNull(),
    status: mysqlEnum('status', ['open', 'completed', 'voided', 'refunded', 'partially_refunded']).notNull().default('open'),
    subtotal: decimal('subtotal', { precision: 14, scale: 4 }).notNull().default('0'),
    discountTotal: decimal('discount_total', { precision: 14, scale: 4 }).notNull().default('0'),
    taxTotal: decimal('tax_total', { precision: 14, scale: 4 }).notNull().default('0'),
    total: decimal('total', { precision: 14, scale: 4 }).notNull().default('0'),
    paid: decimal('paid', { precision: 14, scale: 4 }).notNull().default('0'),
    changeGiven: decimal('change_given', { precision: 14, scale: 4 }).notNull().default('0'),
    currency: char('currency', { length: 3 }).notNull().default('KES'),
    notes: text('notes'),
    metadata: json('metadata').notNull().$type<Record<string, unknown>>(),
    completedAt: timestamp('completed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    numberIdx: unique('idx_sales_tenant_number').on(t.tenantId, t.saleNumber),
    statusIdx: index('idx_sales_tenant_status').on(t.tenantId, t.status),
    locationDateIdx: index('idx_sales_location_date').on(t.tenantId, t.locationId, t.createdAt),
    customerIdx: index('idx_sales_customer').on(t.tenantId, t.customerId),
  }),
);

export const saleItems = mysqlTable(
  'sale_items',
  {
    id: binary('id', { length: 16 }).notNull(),
    saleId: binary('sale_id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    productId: binary('product_id', { length: 16 }).notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 4 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 14, scale: 4 }).notNull(),
    discountPct: decimal('discount_pct', { precision: 5, scale: 4 }).notNull().default('0'),
    discountAmt: decimal('discount_amt', { precision: 14, scale: 4 }).notNull().default('0'),
    taxPct: decimal('tax_pct', { precision: 5, scale: 4 }).notNull().default('0'),
    taxAmt: decimal('tax_amt', { precision: 14, scale: 4 }).notNull().default('0'),
    lineTotal: decimal('line_total', { precision: 14, scale: 4 }).notNull(),
    notes: varchar('notes', { length: 500 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    saleIdx: index('idx_sale_items_sale').on(t.saleId),
    productIdx: index('idx_sale_items_product').on(t.tenantId, t.productId),
  }),
);

export const payments = mysqlTable(
  'payments',
  {
    id: binary('id', { length: 16 }).notNull(),
    saleId: binary('sale_id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    method: mysqlEnum('method', ['cash', 'mpesa', 'card', 'bank_transfer', 'credit', 'other']).notNull(),
    amount: decimal('amount', { precision: 14, scale: 4 }).notNull(),
    reference: varchar('reference', { length: 100 }),
    status: mysqlEnum('status', ['pending', 'confirmed', 'failed', 'refunded']).notNull().default('pending'),
    providerResponse: json('provider_response').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    saleIdx: index('idx_payments_sale').on(t.saleId),
    referenceIdx: index('idx_payments_reference').on(t.tenantId, t.reference),
    statusIdx: index('idx_payments_status').on(t.tenantId, t.status),
  }),
);

export const stockOnHand = mysqlTable(
  'stock_on_hand',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    productId: binary('product_id', { length: 16 }).notNull(),
    locationId: binary('location_id', { length: 16 }).notNull(),
    quantity: decimal('quantity', { precision: 14, scale: 4 }).notNull().default('0'),
    reserved: decimal('reserved', { precision: 14, scale: 4 }).notNull().default('0'),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    lookupIdx: unique('idx_soh_lookup').on(t.tenantId, t.productId, t.locationId),
    locationIdx: index('idx_soh_location').on(t.tenantId, t.locationId),
  }),
);

// ---------------------------------------------------------------------------
// Metadata tables
// ---------------------------------------------------------------------------

export const fieldDefinitions = mysqlTable(
  'field_definitions',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    fieldKey: varchar('field_key', { length: 100 }).notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    dataType: mysqlEnum('data_type', [
      'string', 'text', 'number', 'decimal', 'boolean',
      'date', 'datetime', 'enum', 'reference', 'json',
    ]).notNull(),
    config: json('config').notNull().$type<Record<string, unknown>>(),
    isRequired: boolean('is_required').notNull().default(false),
    isIndexed: boolean('is_indexed').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: int('display_order').notNull().default(0),
    section: varchar('section', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    lookupIdx: unique('idx_fielddef_lookup').on(t.tenantId, t.entityType, t.fieldKey),
    entityIdx: index('idx_fielddef_entity').on(t.tenantId, t.entityType, t.isActive),
  }),
);

export const ruleDefinitions = mysqlTable(
  'rule_definitions',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    engine: mysqlEnum('engine', ['validation', 'decision', 'reactive', 'policy']).notNull(),
    triggerEvent: varchar('trigger_event', { length: 100 }),
    priority: int('priority').notNull().default(100),
    body: json('body').notNull().$type<unknown>(),
    version: int('version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(false),
    authoredByUserId: binary('authored_by_user_id', { length: 16 }),
    authoredFromNaturalLanguage: text('authored_from_natural_language'),
    dryRunResults: json('dry_run_results').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    activatedAt: timestamp('activated_at', { mode: 'date' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    engineIdx: index('idx_rules_tenant_engine').on(t.tenantId, t.engine, t.isActive),
    triggerIdx: index('idx_rules_trigger').on(t.tenantId, t.triggerEvent, t.isActive),
  }),
);

export const settings = mysqlTable(
  'settings',
  {
    id: binary('id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    scopeType: mysqlEnum('scope_type', ['tenant', 'location', 'user']).notNull(),
    scopeId: binary('scope_id', { length: 16 }),
    key: varchar('key', { length: 200 }).notNull(),
    value: json('value').notNull().$type<unknown>(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    lookupIdx: unique('idx_settings_lookup').on(t.tenantId, t.scopeType, t.scopeId, t.key),
  }),
);

// ---------------------------------------------------------------------------
// Event store
// ---------------------------------------------------------------------------

export const domainEvents = mysqlTable(
  'domain_events',
  {
    id: bigint('id', { mode: 'bigint', unsigned: true }).autoincrement().notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    streamType: varchar('stream_type', { length: 50 }).notNull(),
    streamId: binary('stream_id', { length: 16 }).notNull(),
    version: int('version', { unsigned: true }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: json('payload').notNull().$type<Record<string, unknown>>(),
    metadata: json('metadata').notNull().$type<Record<string, unknown>>(),
    occurredAt: timestamp('occurred_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id] }),
    streamIdx: unique('idx_events_stream').on(t.tenantId, t.streamType, t.streamId, t.version),
    tenantTimeIdx: index('idx_events_tenant_time').on(t.tenantId, t.occurredAt),
    typeIdx: index('idx_events_type').on(t.tenantId, t.eventType, t.occurredAt),
  }),
);

// ---------------------------------------------------------------------------
// Extension tables
// ---------------------------------------------------------------------------

export const productExtensions = mysqlTable(
  'product_extensions',
  {
    productId: binary('product_id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    custom: json('custom').notNull().$type<Record<string, unknown>>(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId] }),
    tenantIdx: index('idx_prodext_tenant').on(t.tenantId),
  }),
);

export const assetExtensions = mysqlTable(
  'asset_extensions',
  {
    assetId: binary('asset_id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    custom: json('custom').notNull().$type<Record<string, unknown>>(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.assetId] }),
    tenantIdx: index('idx_assetext_tenant').on(t.tenantId),
  }),
);

export const customerExtensions = mysqlTable(
  'customer_extensions',
  {
    customerId: binary('customer_id', { length: 16 }).notNull(),
    tenantId: binary('tenant_id', { length: 16 }).notNull(),
    custom: json('custom').notNull().$type<Record<string, unknown>>(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.customerId] }),
    tenantIdx: index('idx_custext_tenant').on(t.tenantId),
  }),
);

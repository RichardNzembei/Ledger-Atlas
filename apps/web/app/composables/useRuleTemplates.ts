export interface RuleTemplate {
  id: number;
  name: string;
  category: string;
  engine: 'reactive' | 'decision' | 'validation' | 'policy';
  triggerEvent?: string;
  priority: number;
  scenario: string;
  dependencies?: string[];
  body: unknown;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  // ── Inventory & Stock ──────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Low-stock alert (basic)',
    category: 'Inventory & Stock',
    engine: 'reactive',
    triggerEvent: 'stock.below_reorder',
    priority: 100,
    scenario: 'Notify the manager by email when any product drops below its reorder point.',
    dependencies: ['setting notifications.low_stock.enabled = true', 'setting notifications.low_stock.recipients'],
    body: {
      conditions: {
        all: [
          { fact: 'setting.notifications.low_stock.enabled', operator: 'equal', value: true },
        ],
      },
      actions: [
        {
          type: 'notify',
          channel: 'email',
          recipients: '{{setting.notifications.low_stock.recipients}}',
          template: 'low_stock_alert',
          data: {
            product_name: '{{product.name}}',
            sku: '{{product.sku}}',
            location: '{{location.name}}',
            current_quantity: '{{quantity}}',
            reorder_point: '{{product.reorder_point}}',
            reorder_qty: '{{product.reorder_qty}}',
          },
        },
      ],
    },
  },
  {
    id: 2,
    name: 'Critical low-stock alert for perishables',
    category: 'Inventory & Stock',
    engine: 'reactive',
    triggerEvent: 'stock.level_changed',
    priority: 90,
    scenario: 'Send a multi-channel urgent alert when a perishable product hits ≤5 units.',
    dependencies: ['custom field product.is_perishable (boolean)', 'setting notifications.critical_stock.sms_enabled = true'],
    body: {
      conditions: {
        all: [
          { fact: 'product.custom.is_perishable', operator: 'equal', value: true },
          { fact: 'quantity', operator: 'lessThanInclusive', value: 5 },
        ],
      },
      actions: [
        {
          type: 'notify',
          channel: 'email',
          recipients: ['store_manager', 'purchasing_manager'],
          template: 'critical_perishable_alert',
          subject: 'URGENT: {{product.name}} at {{quantity}} units',
        },
        {
          type: 'notify',
          channel: 'sms',
          recipients: ['store_manager'],
          message: 'URGENT reorder: {{product.name}} ({{sku}}) at {{location.name}} — {{quantity}} left',
        },
      ],
    },
  },
  {
    id: 3,
    name: 'Overstock warning',
    category: 'Inventory & Stock',
    engine: 'reactive',
    triggerEvent: 'stock.level_changed',
    priority: 100,
    scenario: 'Warn the purchasing team when stock exceeds 3× the reorder point.',
    body: {
      conditions: {
        all: [
          { fact: 'product.reorder_point', operator: 'greaterThan', value: 0 },
          { fact: 'resulting_quantity', operator: 'greaterThan', value: { fact: 'product.reorder_point', multiply: 3 } },
        ],
      },
      actions: [
        { type: 'notify', channel: 'email', recipients: ['purchasing_manager'], template: 'overstock_warning' },
      ],
    },
  },
  {
    id: 4,
    name: 'Negative stock prevention',
    category: 'Inventory & Stock',
    engine: 'validation',
    priority: 10,
    scenario: 'Block any sale or transfer that would cause on-hand quantity to go negative.',
    dependencies: ['setting pos.allow_negative_stock = false'],
    body: {
      entity: 'sale_line',
      when: 'create',
      conditions: {
        all: [
          { fact: 'setting.pos.allow_negative_stock', operator: 'equal', value: false },
          { fact: 'resulting_quantity', operator: 'lessThan', value: 0 },
        ],
      },
      onFailure: {
        message: 'Cannot sell {{quantity}} units of {{product.name}} — only {{available_quantity}} in stock at {{location.name}}.',
        code: 'INSUFFICIENT_STOCK',
      },
    },
  },
  {
    id: 5,
    name: 'Auto-reorder trigger',
    category: 'Inventory & Stock',
    engine: 'reactive',
    triggerEvent: 'stock.below_reorder',
    priority: 100,
    scenario: 'When stock drops below reorder point, automatically create a draft purchase order.',
    dependencies: ['custom field product.default_supplier (reference)', 'setting purchasing.auto_reorder_enabled = true'],
    body: {
      conditions: {
        all: [
          { fact: 'setting.purchasing.auto_reorder_enabled', operator: 'equal', value: true },
          { fact: 'product.custom.default_supplier', operator: 'isNotNull' },
          { fact: 'product.reorder_qty', operator: 'greaterThan', value: 0 },
        ],
      },
      actions: [
        {
          type: 'create_record',
          entity: 'purchase_order',
          data: {
            status: 'draft',
            vendor_id: '{{product.custom.default_supplier}}',
            location_id: '{{location.id}}',
            lines: [{ product_id: '{{product.id}}', quantity: '{{product.reorder_qty}}', unit_cost: '{{product.cost_price}}' }],
          },
        },
        { type: 'notify', channel: 'email', recipients_role: 'purchasing_manager', template: 'draft_po_created' },
      ],
    },
  },
  {
    id: 6,
    name: 'Stocktake variance escalation',
    category: 'Inventory & Stock',
    engine: 'policy',
    priority: 50,
    scenario: 'Require approval when a stocktake adjustment exceeds 100 units or KES 10,000.',
    dependencies: ['setting stocktake.variance_escalation_qty = 100', 'setting stocktake.variance_escalation_value = 10000'],
    body: {
      action: 'stock.adjust',
      conditions: {
        all: [
          { any: [
            { fact: 'resource.abs_quantity_delta', operator: 'greaterThan', value: { fact: 'setting.stocktake.variance_escalation_qty' } },
            { fact: 'resource.abs_value_delta', operator: 'greaterThan', value: { fact: 'setting.stocktake.variance_escalation_value' } },
          ] },
          { not: { fact: 'subject.roles', operator: 'contains', value: 'regional_manager' } },
        ],
      },
      effect: 'deny',
      reason: 'Variance exceeds threshold. Requires Regional Manager approval.',
    },
  },
  {
    id: 7,
    name: 'Slow-moving stock alert',
    category: 'Inventory & Stock',
    engine: 'reactive',
    triggerEvent: 'schedule.monthly',
    priority: 100,
    scenario: 'Monthly alert for products that have not sold in 90 days but are held in stock.',
    dependencies: ['setting inventory.slow_moving_threshold_days = 90'],
    body: {
      query: {
        entity: 'stock_on_hand',
        where: {
          all: [
            { fact: 'quantity', operator: 'greaterThan', value: 0 },
            { fact: 'product.last_sold_at', operator: 'olderThan', value: { fact: 'setting.inventory.slow_moving_threshold_days', unit: 'days' } },
          ],
        },
      },
      actions: [
        { type: 'generate_report', template: 'slow_moving_stock', recipients: ['purchasing_manager', 'store_manager'], format: 'pdf' },
      ],
    },
  },

  // ── Sales & POS ────────────────────────────────────────────────────────────
  {
    id: 8,
    name: 'Large sale alert to management',
    category: 'Sales & POS',
    engine: 'reactive',
    triggerEvent: 'sale.completed',
    priority: 100,
    scenario: 'Notify the owner by SMS whenever a single sale exceeds KES 100,000.',
    dependencies: ['setting notifications.large_sale_threshold = 100000', 'setting notifications.owner_phone'],
    body: {
      conditions: {
        all: [
          { fact: 'sale.total', operator: 'greaterThan', value: { fact: 'setting.notifications.large_sale_threshold' } },
        ],
      },
      actions: [
        {
          type: 'notify',
          channel: 'sms',
          to: '{{setting.notifications.owner_phone}}',
          message: 'Large sale: KES {{sale.total}} at {{location.name}} — cashier {{user.display_name}}',
        },
      ],
    },
  },
  {
    id: 9,
    name: 'Negative margin block',
    category: 'Sales & POS',
    engine: 'validation',
    priority: 10,
    scenario: 'Prevent sales where the selling price is below the cost price.',
    body: {
      entity: 'sale_line',
      when: 'create',
      conditions: {
        all: [
          { fact: 'product.cost_price', operator: 'greaterThan', value: 0 },
          { fact: 'unit_price', operator: 'lessThan', value: { fact: 'product.cost_price' } },
        ],
      },
      onFailure: {
        message: 'Unit price KES {{unit_price}} is below cost price KES {{product.cost_price}} for {{product.name}}.',
        code: 'NEGATIVE_MARGIN',
        allow_override: true,
        override_role: 'manager',
      },
    },
  },
  {
    id: 10,
    name: 'Cash-only limit enforcement',
    category: 'Sales & POS',
    engine: 'policy',
    priority: 50,
    scenario: 'Block cash sales over KES 500,000 as an anti-money-laundering policy.',
    dependencies: ['setting policy.cash_sale_limit = 500000'],
    body: {
      action: 'sale.complete',
      conditions: {
        all: [
          { fact: 'resource.payment_methods', operator: 'equal', value: ['cash'] },
          { fact: 'resource.total', operator: 'greaterThan', value: { fact: 'setting.policy.cash_sale_limit' } },
        ],
      },
      effect: 'deny',
      reason: 'Cash-only sales above KES {{setting.policy.cash_sale_limit}} are not permitted.',
    },
  },
  {
    id: 11,
    name: 'Sale void authorization',
    category: 'Sales & POS',
    engine: 'policy',
    priority: 50,
    scenario: 'Cashiers cannot void sales. Managers can void only at their location within 24 hours.',
    body: {
      action: 'sale.void',
      conditions: {
        any: [
          { fact: 'subject.roles', operator: 'contains', value: 'admin' },
          { all: [
            { fact: 'subject.roles', operator: 'contains', value: 'manager' },
            { fact: 'subject.home_location_id', operator: 'equal', value: { fact: 'resource.location_id' } },
            { fact: 'resource.age_hours', operator: 'lessThanInclusive', value: 24 },
          ] },
        ],
      },
      effect: 'allow',
      default_effect: 'deny',
      deny_reason: 'Only admins or managers at the same location can void sales within 24 hours.',
    },
  },
  {
    id: 12,
    name: 'Refund approval chain',
    category: 'Sales & POS',
    engine: 'decision',
    priority: 100,
    scenario: 'Refunds under KES 5,000 auto-approved; KES 5,000–50,000 need manager; above KES 50,000 need Finance Lead.',
    dependencies: ['setting refunds.auto_approval_limit = 5000', 'setting refunds.manager_limit = 50000'],
    body: {
      hitPolicy: 'first',
      inputs: ['refund.total'],
      outputs: ['required_approver_role', 'can_auto_approve'],
      rows: [
        { conditions: [{ op: '<=', value: { fact: 'setting.refunds.auto_approval_limit' } }], outputs: [null, true] },
        { conditions: [{ op: '<=', value: { fact: 'setting.refunds.manager_limit' } }], outputs: ['manager', false] },
        { conditions: [{ op: '>', value: { fact: 'setting.refunds.manager_limit' } }], outputs: ['finance_lead', false] },
      ],
    },
  },
  {
    id: 13,
    name: 'Held sale expiry cleanup',
    category: 'Sales & POS',
    engine: 'reactive',
    triggerEvent: 'schedule.hourly',
    priority: 100,
    scenario: 'Automatically expire parked carts inactive for more than 24 hours.',
    dependencies: ['setting pos.held_sale_expiry_hours'],
    body: {
      query: {
        entity: 'held_sale',
        where: {
          all: [
            { fact: 'status', operator: 'equal', value: 'held' },
            { fact: 'held_since', operator: 'olderThan', value: { fact: 'setting.pos.held_sale_expiry_hours', unit: 'hours' } },
          ],
        },
      },
      actions: [
        { type: 'update_record', updates: { status: 'expired', expired_at: 'now' } },
      ],
    },
  },
  {
    id: 14,
    name: 'After-hours sale flagging',
    category: 'Sales & POS',
    engine: 'reactive',
    triggerEvent: 'sale.completed',
    priority: 100,
    scenario: 'Flag sales completed outside business hours for review.',
    dependencies: ['setting business_hours.start = "08:00"', 'setting business_hours.end = "20:00"'],
    body: {
      conditions: {
        any: [
          { fact: 'sale.completed_at_time', operator: 'lessThan', value: { fact: 'setting.business_hours.start' } },
          { fact: 'sale.completed_at_time', operator: 'greaterThan', value: { fact: 'setting.business_hours.end' } },
        ],
      },
      actions: [
        { type: 'update_record', entity: 'sale', id: '{{sale.id}}', updates: { 'custom.flagged_review_reason': 'after_hours' } },
      ],
    },
  },
  {
    id: 15,
    name: 'Duplicate customer merge prevention',
    category: 'Sales & POS',
    engine: 'validation',
    priority: 10,
    scenario: 'Block creating a customer whose phone number already exists in the system.',
    body: {
      entity: 'customer',
      when: 'create',
      conditions: {
        all: [
          { fact: 'phone', operator: 'isNotNull' },
          { fact: 'existing_customer_by_phone', operator: 'exists' },
        ],
      },
      onFailure: {
        message: 'A customer with phone {{phone}} already exists: {{existing_customer_by_phone.name}}.',
        code: 'DUPLICATE_PHONE',
        hint: { existing_customer_id: '{{existing_customer_by_phone.id}}' },
      },
    },
  },

  // ── Pricing & Discounts ────────────────────────────────────────────────────
  {
    id: 16,
    name: 'Customer segment tiered discount',
    category: 'Pricing & Discounts',
    engine: 'decision',
    priority: 100,
    scenario: 'Different customer segments get different base discounts, with volume bonuses.',
    body: {
      hitPolicy: 'first',
      inputs: ['customer.segment', 'cart.total_quantity'],
      outputs: ['discount_percent', 'free_shipping'],
      rows: [
        { conditions: [{ op: '==', value: 'vip' }, null], outputs: [20, true] },
        { conditions: [{ op: '==', value: 'wholesale' }, { op: '>=', value: 100 }], outputs: [15, true] },
        { conditions: [{ op: '==', value: 'wholesale' }, { op: '>=', value: 50 }], outputs: [12, false] },
        { conditions: [{ op: '==', value: 'wholesale' }, null], outputs: [10, false] },
        { conditions: [{ op: '==', value: 'staff' }, null], outputs: [25, false] },
        { conditions: [{ op: '==', value: 'retail' }, { op: '>=', value: 100 }], outputs: [5, false] },
        { conditions: [null, null], outputs: [0, false] },
      ],
    },
  },
  {
    id: 17,
    name: 'Weekend / holiday premium pricing',
    category: 'Pricing & Discounts',
    engine: 'decision',
    priority: 100,
    scenario: 'Specific products charge 10% more on weekends and public holidays.',
    dependencies: ['custom field product.weekend_premium_applies (boolean)', 'setting pricing.weekend_days', 'setting pricing.weekend_premium_percent = 10'],
    body: {
      hitPolicy: 'first',
      inputs: ['product.custom.weekend_premium_applies', 'date.day_of_week', 'date.is_public_holiday'],
      outputs: ['price_multiplier'],
      rows: [
        { conditions: [{ op: '==', value: true }, { op: 'in', value: { fact: 'setting.pricing.weekend_days' } }, null], outputs: [1.10] },
        { conditions: [{ op: '==', value: true }, null, { op: '==', value: true }], outputs: [1.10] },
        { conditions: [null, null, null], outputs: [1.00] },
      ],
    },
  },
  {
    id: 18,
    name: 'Volume discount decision table',
    category: 'Pricing & Discounts',
    engine: 'decision',
    priority: 100,
    scenario: 'Tiered per-product discount based on line quantity.',
    body: {
      hitPolicy: 'first',
      inputs: ['line.quantity'],
      outputs: ['line_discount_percent'],
      rows: [
        { conditions: [{ op: '>=', value: 100 }], outputs: [15] },
        { conditions: [{ op: '>=', value: 50 }], outputs: [10] },
        { conditions: [{ op: '>=', value: 20 }], outputs: [5] },
        { conditions: [{ op: '>=', value: 10 }], outputs: [2] },
        { conditions: [null], outputs: [0] },
      ],
    },
  },
  {
    id: 19,
    name: 'VIP customer auto-discount',
    category: 'Pricing & Discounts',
    engine: 'decision',
    priority: 100,
    scenario: 'VIP customers always get 15% off, applied automatically at checkout.',
    body: {
      hitPolicy: 'first',
      inputs: ['customer.segment'],
      outputs: ['sale_discount_percent'],
      rows: [
        { conditions: [{ op: '==', value: 'vip' }], outputs: [15] },
        { conditions: [null], outputs: [0] },
      ],
    },
  },
  {
    id: 20,
    name: 'Promotional period pricing',
    category: 'Pricing & Discounts',
    engine: 'decision',
    priority: 100,
    scenario: 'During a defined promotional period, apply a discount to specific categories.',
    dependencies: ['setting promo.start_date', 'setting promo.end_date', 'setting promo.categories', 'setting promo.discount_percent'],
    body: {
      hitPolicy: 'first',
      inputs: ['date.today', 'product.category'],
      outputs: ['line_discount_percent'],
      rows: [
        {
          conditions: [
            { op: 'between', value: [{ fact: 'setting.promo.start_date' }, { fact: 'setting.promo.end_date' }] },
            { op: 'in', value: { fact: 'setting.promo.categories' } },
          ],
          outputs: [{ fact: 'setting.promo.discount_percent' }],
        },
        { conditions: [null, null], outputs: [0] },
      ],
    },
  },

  // ── Customers & Credit ─────────────────────────────────────────────────────
  {
    id: 21,
    name: 'Credit limit enforcement',
    category: 'Customers & Credit',
    engine: 'validation',
    priority: 10,
    scenario: 'Prevent credit sales that would exceed the customer\'s available credit.',
    dependencies: ['custom field customer.credit_limit (number)'],
    body: {
      entity: 'sale',
      when: 'complete',
      conditions: {
        all: [
          { fact: 'payment_methods', operator: 'contains', value: 'credit' },
          { fact: 'customer.custom.credit_limit', operator: 'greaterThan', value: 0 },
          { fact: 'credit_after_sale', operator: 'greaterThan', value: { fact: 'customer.custom.credit_limit' } },
        ],
      },
      onFailure: {
        message: 'This sale would exceed {{customer.name}}\'s credit limit of KES {{customer.custom.credit_limit}}.',
        code: 'CREDIT_LIMIT_EXCEEDED',
        allow_override: true,
        override_role: 'finance_lead',
      },
    },
  },
  {
    id: 22,
    name: 'VIP thank-you email',
    category: 'Customers & Credit',
    engine: 'reactive',
    triggerEvent: 'sale.completed',
    priority: 100,
    scenario: 'When a VIP customer completes a purchase over a threshold, send a thank-you with a discount code.',
    dependencies: ['setting loyalty.vip_thank_you_threshold = 50000', 'setting loyalty.thank_you_discount_percent = 10', 'setting loyalty.thank_you_code_validity_days = 30'],
    body: {
      conditions: {
        all: [
          { fact: 'customer.segment', operator: 'equal', value: 'vip' },
          { fact: 'sale.total', operator: 'greaterThan', value: { fact: 'setting.loyalty.vip_thank_you_threshold' } },
        ],
      },
      actions: [
        {
          type: 'create_record',
          entity: 'discount_code',
          data: { customer_id: '{{customer.id}}', percent: '{{setting.loyalty.thank_you_discount_percent}}', valid_days: '{{setting.loyalty.thank_you_code_validity_days}}', code_prefix: 'VIP' },
          store_result_as: 'new_code',
        },
        { type: 'notify', channel: 'email', to: '{{customer.email}}', template: 'vip_thank_you', data: { discount_code: '{{new_code.code}}' } },
      ],
    },
  },
  {
    id: 23,
    name: 'Customer segment auto-tagging',
    category: 'Customers & Credit',
    engine: 'reactive',
    triggerEvent: 'sale.completed',
    priority: 100,
    scenario: 'Automatically upgrade a customer\'s segment based on cumulative lifetime spend.',
    dependencies: ['setting segmentation.vip_spend_threshold = 500000', 'setting segmentation.wholesale_spend_threshold = 100000'],
    body: {
      actions: [
        {
          type: 'update_record',
          entity: 'customer',
          id: '{{customer.id}}',
          condition: { fact: 'customer.custom.lifetime_spend_after_sale', operator: 'greaterThan', value: { fact: 'setting.segmentation.vip_spend_threshold' } },
          updates: { segment: 'vip' },
        },
        {
          type: 'update_record',
          entity: 'customer',
          id: '{{customer.id}}',
          condition: { all: [
            { fact: 'customer.segment', operator: 'notEqual', value: 'vip' },
            { fact: 'customer.custom.lifetime_spend_after_sale', operator: 'greaterThan', value: { fact: 'setting.segmentation.wholesale_spend_threshold' } },
          ] },
          updates: { segment: 'wholesale' },
        },
      ],
    },
  },
  {
    id: 24,
    name: 'Dormant customer re-engagement',
    category: 'Customers & Credit',
    engine: 'reactive',
    triggerEvent: 'schedule.weekly',
    priority: 100,
    scenario: 'Email customers who haven\'t bought in 90 days with a re-engagement offer.',
    dependencies: ['setting reengagement.dormant_days = 90'],
    body: {
      query: {
        entity: 'customer',
        where: {
          all: [
            { fact: 'status', operator: 'equal', value: 'active' },
            { fact: 'email', operator: 'isNotNull' },
            { fact: 'last_purchase_at', operator: 'olderThan', value: { fact: 'setting.reengagement.dormant_days', unit: 'days' } },
            { fact: 'custom.last_reengagement_sent_at', operator: 'olderThanOrNull', value: { value: 90, unit: 'days' } },
          ],
        },
      },
      actions: [
        { type: 'notify', channel: 'email', to: '{{customer.email}}', template: 'reengagement' },
        { type: 'update_record', entity: 'customer', id: '{{customer.id}}', updates: { 'custom.last_reengagement_sent_at': 'now' } },
      ],
    },
  },

  // ── Assets ─────────────────────────────────────────────────────────────────
  {
    id: 25,
    name: 'Warranty expiry warning',
    category: 'Assets',
    engine: 'reactive',
    triggerEvent: 'schedule.daily',
    priority: 100,
    scenario: 'Alert the facilities team 60 days before an asset\'s warranty expires.',
    dependencies: ['custom field asset.warranty_expiry_date (date)', 'setting assets.warranty_warning_days = 60'],
    body: {
      query: {
        entity: 'asset',
        where: {
          all: [
            { fact: 'status', operator: 'equal', value: 'active' },
            { fact: 'custom.warranty_expiry_date', operator: 'isNotNull' },
            { fact: 'days_until_warranty_expiry', operator: 'between', value: [0, { fact: 'setting.assets.warranty_warning_days' }] },
            { fact: 'custom.warranty_warning_sent', operator: 'notEqual', value: true },
          ],
        },
      },
      actions: [
        { type: 'notify', channel: 'email', recipients: '{{setting.assets.warranty_warning_recipients}}', template: 'warranty_expiring' },
        { type: 'update_record', entity: 'asset', id: '{{asset.id}}', updates: { 'custom.warranty_warning_sent': true } },
      ],
    },
  },
  {
    id: 26,
    name: 'Asset maintenance due reminder',
    category: 'Assets',
    engine: 'reactive',
    triggerEvent: 'schedule.daily',
    priority: 100,
    scenario: 'Alert when asset maintenance is due or overdue, and create a task.',
    dependencies: ['custom field asset.next_maintenance_due (date)', 'custom field asset.maintenance_assignee_id (reference)'],
    body: {
      query: {
        entity: 'asset',
        where: {
          all: [
            { fact: 'status', operator: 'equal', value: 'active' },
            { fact: 'custom.next_maintenance_due', operator: 'lessThanOrEqual', value: { fact: 'today' } },
          ],
        },
      },
      actions: [
        { type: 'notify', channel: 'email', to_user_id: '{{asset.custom.maintenance_assignee_id}}', template: 'maintenance_due', cc_role: 'facilities_manager' },
        { type: 'create_record', entity: 'task', data: { title: 'Maintenance due: {{asset.name}}', assigned_to: '{{asset.custom.maintenance_assignee_id}}', due_date: '{{asset.custom.next_maintenance_due}}' } },
      ],
    },
  },
  {
    id: 27,
    name: 'Asset assignment audit trail',
    category: 'Assets',
    engine: 'reactive',
    triggerEvent: 'asset.assigned',
    priority: 100,
    scenario: 'Every asset assignment or reassignment creates an immutable audit log entry.',
    body: {
      actions: [
        {
          type: 'create_record',
          entity: 'audit_log',
          data: {
            category: 'asset_assignment',
            asset_id: '{{asset.id}}',
            asset_tag: '{{asset.tag}}',
            previous_assignee: '{{event.previous_assignee_id}}',
            new_assignee: '{{event.new_assignee_id}}',
            location_id: '{{event.location_id}}',
            reason: '{{event.reason}}',
            actor_id: '{{actor.id}}',
            timestamp: 'now',
          },
        },
      ],
    },
  },

  // ── Operational / Administrative ───────────────────────────────────────────
  {
    id: 28,
    name: 'Daily closing summary',
    category: 'Operational',
    engine: 'reactive',
    triggerEvent: 'schedule.daily',
    priority: 100,
    scenario: 'Email store manager a summary of the day\'s activity at configured closing time.',
    dependencies: ['setting closing.summary_recipients'],
    body: {
      actions: [
        {
          type: 'generate_report',
          template: 'daily_closing_summary',
          parameters: { location_id: '{{location.id}}', date: '{{today}}' },
          sections: ['sales_summary', 'top_products', 'low_stock_items', 'cash_variance', 'voided_sales', 'refunds_issued'],
          recipients: '{{setting.closing.summary_recipients}}',
          format: 'pdf_email',
        },
      ],
    },
  },
  {
    id: 29,
    name: 'Approval workflow for purchase orders',
    category: 'Operational',
    engine: 'decision',
    priority: 50,
    scenario: 'POs over KES 50,000 need manager approval; over KES 500,000 need director approval.',
    dependencies: ['setting purchasing.manager_approval_threshold = 50000', 'setting purchasing.director_approval_threshold = 500000'],
    body: {
      hitPolicy: 'first',
      inputs: ['po.total'],
      outputs: ['required_approver_role'],
      rows: [
        { conditions: [{ op: '>=', value: { fact: 'setting.purchasing.director_approval_threshold' } }], outputs: ['director'] },
        { conditions: [{ op: '>=', value: { fact: 'setting.purchasing.manager_approval_threshold' } }], outputs: ['manager'] },
        { conditions: [null], outputs: [null] },
      ],
    },
  },
  {
    id: 30,
    name: 'Multi-currency conversion at POS',
    category: 'Operational',
    engine: 'decision',
    priority: 100,
    scenario: 'Accept USD at POS, convert to KES at configured rate, and log the conversion.',
    dependencies: ['setting pos.fx_rate.USD = 150.00', 'setting pos.fx_rate.updated_at'],
    body: {
      hitPolicy: 'first',
      inputs: ['payment.currency', 'payment.amount'],
      outputs: ['kes_equivalent'],
      rows: [
        { conditions: [{ op: '==', value: 'KES' }, null], outputs: [{ fact: 'payment.amount' }] },
        { conditions: [{ op: '==', value: 'USD' }, null], outputs: [{ expression: 'payment.amount * setting.pos.fx_rate.USD' }] },
      ],
    },
  },
];

export function useRuleTemplates() {
  const categories = computed(() => {
    const order = ['Inventory & Stock', 'Sales & POS', 'Pricing & Discounts', 'Customers & Credit', 'Assets', 'Operational'];
    return order.filter((c) => RULE_TEMPLATES.some((t) => t.category === c));
  });

  const templatesByCategory = computed(() =>
    Object.fromEntries(
      categories.value.map((c) => [c, RULE_TEMPLATES.filter((t) => t.category === c)]),
    ),
  );

  return { categories, templatesByCategory, templates: RULE_TEMPLATES };
}

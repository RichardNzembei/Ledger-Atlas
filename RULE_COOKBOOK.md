# Ledger Atlas — Rule Cookbook

**Document version:** 1.0
**Status:** Living reference — expanded as new patterns are validated
**Audience:** Admins authoring rules, implementation partners configuring customer instances

> 30 production-ready rule templates for common business scenarios. Each recipe includes the business problem, the engine to use, the full rule JSON, the settings and custom fields it depends on, testing notes, and common pitfalls. Copy, adapt, activate.

---

## How to use this cookbook

Each recipe follows the same structure:

- **Scenario** — the business problem in plain language.
- **Engine** — which of the four engines handles this.
- **Dependencies** — any settings or custom fields that must exist first.
- **Rule JSON** — paste-ready rule body.
- **Testing** — how to verify it works before going live.
- **Pitfalls** — what commonly goes wrong.

Rules are grouped by business domain. Use the table of contents to jump to the category you need.

### Table of contents

**Inventory & Stock (1–7)**
1. Low-stock alert (basic)
2. Critical low-stock alert for perishables
3. Overstock warning
4. Negative stock prevention
5. Auto-reorder trigger
6. Stocktake variance escalation
7. Slow-moving stock alert

**Sales & POS (8–15)**
8. Large sale alert to management
9. Negative margin block
10. Cash-only limit enforcement
11. Sale void authorization
12. Refund approval chain
13. Held sale expiry cleanup
14. After-hours sale flagging
15. Duplicate customer merge prevention

**Pricing & Discounts (16–20)**
16. Customer segment tiered discount
17. Weekend / holiday premium pricing
18. Volume discount decision table
19. VIP customer auto-discount
20. Promotional period pricing

**Customers & Credit (21–24)**
21. Credit limit enforcement
22. VIP thank-you email
23. Customer segment auto-tagging
24. Dormant customer re-engagement

**Assets (25–27)**
25. Warranty expiry warning
26. Asset maintenance due reminder
27. Asset assignment audit trail

**Operational / Administrative (28–30)**
28. Daily closing summary
29. Approval workflow for purchase orders
30. Multi-currency conversion at POS

---

## Inventory & Stock

### 1. Low-stock alert (basic)

**Scenario:** Notify the manager by email when any product's stock at any location drops below its reorder point.

**Engine:** Reactive

**Dependencies:**
- Setting `notifications.low_stock.enabled` = `true`
- Setting `notifications.low_stock.recipients` = `["store_manager"]`
- Built-in reorder point on each product

**Rule JSON:**
```json
{
  "conditions": {
    "all": [
      { "fact": "setting.notifications.low_stock.enabled", "operator": "equal", "value": true }
    ]
  },
  "actions": [
    {
      "type": "notify",
      "channel": "email",
      "recipients": "{{setting.notifications.low_stock.recipients}}",
      "template": "low_stock_alert",
      "data": {
        "product_name": "{{product.name}}",
        "sku": "{{product.sku}}",
        "location": "{{location.name}}",
        "current_quantity": "{{quantity}}",
        "reorder_point": "{{product.reorder_point}}",
        "reorder_qty": "{{product.reorder_qty}}"
      }
    }
  ]
}
```

**Testing:** Find a product with low stock at a test location. Manually adjust stock down to trigger the threshold. Check email delivery.

**Pitfalls:** If reorder points are set to 0, this rule will never fire. Validate that products have sensible reorder points before activating. Also — the rule fires every time stock crosses the threshold downward; if stock oscillates around the threshold (received / sold in quick succession), you can get alert spam. Consider debouncing with a time-window condition.

---

### 2. Critical low-stock alert for perishables

**Scenario:** For perishable products only, send a more urgent multi-channel alert when stock is critically low (≤5 units).

**Engine:** Reactive

**Dependencies:**
- Custom Field on Product: `is_perishable` (boolean)
- Setting `notifications.critical_stock.sms_enabled` = `true`

**Rule JSON:**
```json
{
  "conditions": {
    "all": [
      { "fact": "product.custom.is_perishable", "operator": "equal", "value": true },
      { "fact": "quantity", "operator": "lessThanInclusive", "value": 5 }
    ]
  },
  "actions": [
    {
      "type": "notify",
      "channel": "email",
      "recipients": ["store_manager", "purchasing_manager"],
      "template": "critical_perishable_alert",
      "subject": "URGENT: {{product.name}} at {{quantity}} units"
    },
    {
      "type": "notify",
      "channel": "sms",
      "recipients": ["store_manager"],
      "message": "URGENT reorder: {{product.name}} ({{sku}}) at {{location.name}} — {{quantity}} left"
    }
  ]
}
```

**Testing:** Mark a test product as perishable, reduce its stock to 5, confirm email and SMS fire.

**Pitfalls:** SMS costs real money. Set a monthly budget cap in the notification settings.

---

### 3. Overstock warning

**Scenario:** Warn the purchasing team when stock levels exceed 3× the reorder point.

**Engine:** Reactive

**Rule JSON:**
```json
{
  "conditions": {
    "all": [
      { "fact": "product.reorder_point", "operator": "greaterThan", "value": 0 },
      { "fact": "resulting_quantity", "operator": "greaterThan", "value": { "fact": "product.reorder_point", "multiply": 3 } }
    ]
  },
  "actions": [
    { "type": "notify", "channel": "email", "recipients": ["purchasing_manager"], "template": "overstock_warning" }
  ]
}
```

**Testing:** Receive a large quantity of a product whose reorder point is 10 — receive 40 units and confirm the warning fires.

**Pitfalls:** Not every overstock is a mistake; seasonal businesses over-stock deliberately before peak periods.

---

### 4. Negative stock prevention

**Scenario:** Block any sale or transfer that would cause on-hand quantity to go negative.

**Engine:** Validation

**Dependencies:**
- Setting `pos.allow_negative_stock` (default `false`)

**Rule JSON:**
```json
{
  "entity": "sale_line",
  "when": "create",
  "conditions": {
    "all": [
      { "fact": "setting.pos.allow_negative_stock", "operator": "equal", "value": false },
      { "fact": "resulting_quantity", "operator": "lessThan", "value": 0 }
    ]
  },
  "onFailure": {
    "message": "Cannot sell {{quantity}} units of {{product.name}} — only {{available_quantity}} in stock at {{location.name}}.",
    "code": "INSUFFICIENT_STOCK"
  }
}
```

**Testing:** Attempt to sell more units than are available. Verify the sale is blocked.

**Pitfalls:** Some businesses genuinely allow negative stock (pre-order models). Match the rule to the setting.

---

### 5. Auto-reorder trigger

**Scenario:** When stock drops below reorder point, automatically create a draft purchase order to the default supplier.

**Engine:** Reactive

**Dependencies:**
- Custom Field on Product: `default_supplier` (reference → Vendor)
- Setting `purchasing.auto_reorder_enabled` = `true`

**Rule JSON:**
```json
{
  "conditions": {
    "all": [
      { "fact": "setting.purchasing.auto_reorder_enabled", "operator": "equal", "value": true },
      { "fact": "product.custom.default_supplier", "operator": "isNotNull" },
      { "fact": "product.reorder_qty", "operator": "greaterThan", "value": 0 }
    ]
  },
  "actions": [
    {
      "type": "create_record",
      "entity": "purchase_order",
      "data": {
        "status": "draft",
        "vendor_id": "{{product.custom.default_supplier}}",
        "location_id": "{{location.id}}",
        "lines": [{ "product_id": "{{product.id}}", "quantity": "{{product.reorder_qty}}", "unit_cost": "{{product.cost_price}}" }]
      }
    },
    { "type": "notify", "channel": "email", "recipients_role": "purchasing_manager", "template": "draft_po_created" }
  ]
}
```

**Testing:** Configure a product with a `default_supplier`, drop its stock below reorder, confirm a draft PO appears.

**Pitfalls:** Multiple locations hitting reorder for the same product create multiple draft POs. Consider batch consolidation.

---

### 6. Stocktake variance escalation

**Scenario:** When a stocktake adjustment exceeds 100 units or KES 10,000 in value, require approval and log for audit.

**Engine:** Policy

**Dependencies:**
- Setting `stocktake.variance_escalation_qty` = `100`
- Setting `stocktake.variance_escalation_value` = `10000`

**Rule JSON:**
```json
{
  "action": "stock.adjust",
  "conditions": {
    "all": [
      { "any": [
        { "fact": "resource.abs_quantity_delta", "operator": "greaterThan", "value": { "fact": "setting.stocktake.variance_escalation_qty" } },
        { "fact": "resource.abs_value_delta", "operator": "greaterThan", "value": { "fact": "setting.stocktake.variance_escalation_value" } }
      ]},
      { "not": { "fact": "subject.roles", "operator": "contains", "value": "regional_manager" } }
    ]
  },
  "effect": "deny",
  "reason": "Variance exceeds threshold. Requires Regional Manager approval."
}
```

**Testing:** Attempt a stock adjustment of 150 units as a regular manager — denied. As regional manager — allowed.

**Pitfalls:** Always read thresholds from settings so both rules stay in sync when values are updated.

---

### 7. Slow-moving stock alert

**Scenario:** Monthly alert for products that have not sold in 90 days but are held in stock.

**Engine:** Reactive (scheduled)

**Dependencies:**
- Setting `inventory.slow_moving_threshold_days` = `90`

**Rule JSON:**
```json
{
  "query": {
    "entity": "stock_on_hand",
    "where": {
      "all": [
        { "fact": "quantity", "operator": "greaterThan", "value": 0 },
        { "fact": "product.last_sold_at", "operator": "olderThan", "value": { "fact": "setting.inventory.slow_moving_threshold_days", "unit": "days" } }
      ]
    }
  },
  "actions": [
    { "type": "generate_report", "template": "slow_moving_stock", "recipients": ["purchasing_manager", "store_manager"], "format": "pdf" }
  ]
}
```

**Testing:** Run the rule manually; confirm the report lists only products matching the criteria.

**Pitfalls:** Document whether transfers count as "movement" and whether returns count as sales.

---

## Sales & POS

### 8. Large sale alert to management

**Scenario:** Notify the owner by SMS whenever a single sale exceeds KES 100,000.

**Engine:** Reactive

**Dependencies:**
- Setting `notifications.large_sale_threshold` = `100000`
- Setting `notifications.owner_phone` = `"+254712345678"`

**Rule JSON:**
```json
{
  "conditions": {
    "all": [
      { "fact": "sale.total", "operator": "greaterThan", "value": { "fact": "setting.notifications.large_sale_threshold" } }
    ]
  },
  "actions": [
    {
      "type": "notify",
      "channel": "sms",
      "to": "{{setting.notifications.owner_phone}}",
      "message": "Large sale: KES {{sale.total}} at {{location.name}} — cashier {{user.display_name}}"
    }
  ]
}
```

**Pitfalls:** Rate-limit SMS. A large wholesale order could trigger many notifications in quick succession.

---

### 9. Negative margin block

**Scenario:** Prevent sales where the selling price is below the cost price.

**Engine:** Validation

**Rule JSON:**
```json
{
  "entity": "sale_line",
  "when": "create",
  "conditions": {
    "all": [
      { "fact": "product.cost_price", "operator": "greaterThan", "value": 0 },
      { "fact": "unit_price", "operator": "lessThan", "value": { "fact": "product.cost_price" } }
    ]
  },
  "onFailure": {
    "message": "Unit price KES {{unit_price}} is below cost price KES {{product.cost_price}} for {{product.name}}.",
    "code": "NEGATIVE_MARGIN",
    "allow_override": true,
    "override_role": "manager"
  }
}
```

**Pitfalls:** Clearance sales legitimately sell below cost. Either exempt clearance products or allow manager override.

---

### 10. Cash-only limit enforcement

**Scenario:** Block cash sales over KES 500,000 as a security and anti-money-laundering policy.

**Engine:** Policy

**Dependencies:**
- Setting `policy.cash_sale_limit` = `500000`

**Rule JSON:**
```json
{
  "action": "sale.complete",
  "conditions": {
    "all": [
      { "fact": "resource.payment_methods", "operator": "equal", "value": ["cash"] },
      { "fact": "resource.total", "operator": "greaterThan", "value": { "fact": "setting.policy.cash_sale_limit" } }
    ]
  },
  "effect": "deny",
  "reason": "Cash-only sales above KES {{setting.policy.cash_sale_limit}} are not permitted."
}
```

**Pitfalls:** Confirm condition checks for `["cash"]` strictly — don't block legitimate cash+M-Pesa split payments.

---

### 11. Sale void authorization

**Scenario:** Cashiers cannot void sales. Managers can void only at their location within 24 hours.

**Engine:** Policy

**Rule JSON:**
```json
{
  "action": "sale.void",
  "conditions": {
    "any": [
      { "fact": "subject.roles", "operator": "contains", "value": "admin" },
      { "all": [
        { "fact": "subject.roles", "operator": "contains", "value": "manager" },
        { "fact": "subject.home_location_id", "operator": "equal", "value": { "fact": "resource.location_id" } },
        { "fact": "resource.age_hours", "operator": "lessThanInclusive", "value": 24 }
      ]}
    ]
  },
  "effect": "allow",
  "default_effect": "deny",
  "deny_reason": "Only admins or managers at the same location can void sales within 24 hours."
}
```

**Pitfalls:** Populate `home_location_id` on all user records, or the manager condition never matches.

---

### 12. Refund approval chain

**Scenario:** Refunds under KES 5,000 auto-approved; KES 5,000–50,000 need manager; above KES 50,000 need Finance Lead.

**Engine:** Decision

**Dependencies:**
- Setting `refunds.auto_approval_limit` = `5000`
- Setting `refunds.manager_limit` = `50000`

**Rule JSON:**
```json
{
  "hitPolicy": "first",
  "inputs": ["refund.total"],
  "outputs": ["required_approver_role", "can_auto_approve"],
  "rows": [
    { "conditions": [{ "op": "<=", "value": { "fact": "setting.refunds.auto_approval_limit" } }], "outputs": [null, true] },
    { "conditions": [{ "op": "<=", "value": { "fact": "setting.refunds.manager_limit" } }], "outputs": ["manager", false] },
    { "conditions": [{ "op": ">", "value": { "fact": "setting.refunds.manager_limit" } }], "outputs": ["finance_lead", false] }
  ]
}
```

**Pitfalls:** Use `<=` or `<` consistently for boundary values and document which side falls where.

---

### 13. Held sale expiry cleanup

**Scenario:** Clear parked carts inactive for more than 24 hours.

**Engine:** Reactive (scheduled hourly)

**Rule JSON:**
```json
{
  "query": {
    "entity": "held_sale",
    "where": {
      "all": [
        { "fact": "status", "operator": "equal", "value": "held" },
        { "fact": "held_since", "operator": "olderThan", "value": { "fact": "setting.pos.held_sale_expiry_hours", "unit": "hours" } }
      ]
    }
  },
  "actions": [
    { "type": "update_record", "updates": { "status": "expired", "expired_at": "now" } }
  ]
}
```

**Pitfalls:** Expiring a held sale must also release any stock reservations.

---

### 14. After-hours sale flagging

**Scenario:** Flag sales completed outside business hours for review.

**Engine:** Reactive

**Dependencies:**
- Setting `business_hours.start` = `"08:00"`
- Setting `business_hours.end` = `"20:00"`

**Rule JSON:**
```json
{
  "conditions": {
    "any": [
      { "fact": "sale.completed_at_time", "operator": "lessThan", "value": { "fact": "setting.business_hours.start" } },
      { "fact": "sale.completed_at_time", "operator": "greaterThan", "value": { "fact": "setting.business_hours.end" } }
    ]
  },
  "actions": [
    { "type": "update_record", "entity": "sale", "id": "{{sale.id}}", "updates": { "custom.flagged_review_reason": "after_hours" } }
  ]
}
```

**Pitfalls:** Server timezone vs. local timezone — ensure time comparisons use the location's local time.

---

### 15. Duplicate customer merge prevention

**Scenario:** Block creating a customer whose phone number already exists in the system.

**Engine:** Validation

**Rule JSON:**
```json
{
  "entity": "customer",
  "when": "create",
  "conditions": {
    "all": [
      { "fact": "phone", "operator": "isNotNull" },
      { "fact": "existing_customer_by_phone", "operator": "exists" }
    ]
  },
  "onFailure": {
    "message": "A customer with phone {{phone}} already exists: {{existing_customer_by_phone.name}}.",
    "code": "DUPLICATE_PHONE",
    "hint": { "existing_customer_id": "{{existing_customer_by_phone.id}}" }
  }
}
```

**Pitfalls:** Normalize phone numbers before comparison — `0712345678`, `+254712345678`, and `254712345678` should all match.

---

## Pricing & Discounts

### 16. Customer segment tiered discount

**Scenario:** Different customer segments get different base discounts, with volume bonuses.

**Engine:** Decision

**Rule JSON:**
```json
{
  "hitPolicy": "first",
  "inputs": ["customer.segment", "cart.total_quantity"],
  "outputs": ["discount_percent", "free_shipping"],
  "rows": [
    { "conditions": [{ "op": "==", "value": "vip" }, null], "outputs": [20, true] },
    { "conditions": [{ "op": "==", "value": "wholesale" }, { "op": ">=", "value": 100 }], "outputs": [15, true] },
    { "conditions": [{ "op": "==", "value": "wholesale" }, { "op": ">=", "value": 50 }], "outputs": [12, false] },
    { "conditions": [{ "op": "==", "value": "wholesale" }, null], "outputs": [10, false] },
    { "conditions": [{ "op": "==", "value": "staff" }, null], "outputs": [25, false] },
    { "conditions": [{ "op": "==", "value": "retail" }, { "op": ">=", "value": 100 }], "outputs": [5, false] },
    { "conditions": [null, null], "outputs": [0, false] }
  ]
}
```

**Pitfalls:** Always include a catch-all row — without it an unrecognized segment may cause an engine error.

---

### 17. Weekend / holiday premium pricing

**Scenario:** Specific products charge 10% more on weekends and public holidays.

**Engine:** Decision

**Dependencies:**
- Custom Field on Product: `weekend_premium_applies` (boolean)
- Setting `pricing.weekend_days` = `["saturday", "sunday"]`
- Setting `pricing.weekend_premium_percent` = `10`

**Rule JSON:**
```json
{
  "hitPolicy": "first",
  "inputs": ["product.custom.weekend_premium_applies", "date.day_of_week", "date.is_public_holiday"],
  "outputs": ["price_multiplier"],
  "rows": [
    { "conditions": [{ "op": "==", "value": true }, { "op": "in", "value": { "fact": "setting.pricing.weekend_days" } }, null], "outputs": [1.10] },
    { "conditions": [{ "op": "==", "value": true }, null, { "op": "==", "value": true }], "outputs": [1.10] },
    { "conditions": [null, null, null], "outputs": [1.00] }
  ]
}
```

**Pitfalls:** Kenya's public holiday list must be maintained annually in settings.

---

### 18. Volume discount decision table

**Scenario:** Tiered per-product discount based on line quantity.

**Engine:** Decision

**Rule JSON:**
```json
{
  "hitPolicy": "first",
  "inputs": ["line.quantity"],
  "outputs": ["line_discount_percent"],
  "rows": [
    { "conditions": [{ "op": ">=", "value": 100 }], "outputs": [15] },
    { "conditions": [{ "op": ">=", "value": 50 }], "outputs": [10] },
    { "conditions": [{ "op": ">=", "value": 20 }], "outputs": [5] },
    { "conditions": [{ "op": ">=", "value": 10 }], "outputs": [2] },
    { "conditions": [null], "outputs": [0] }
  ]
}
```

**Pitfalls:** Document explicitly whether volume discount stacks with segment discount or replaces it.

---

### 19. VIP customer auto-discount

**Scenario:** VIP customers always get 15% off, applied automatically at checkout.

**Engine:** Decision

**Rule JSON:**
```json
{
  "hitPolicy": "first",
  "inputs": ["customer.segment"],
  "outputs": ["sale_discount_percent"],
  "rows": [
    { "conditions": [{ "op": "==", "value": "vip" }], "outputs": [15] },
    { "conditions": [null], "outputs": [0] }
  ]
}
```

**Pitfalls:** If rule #16 is also active, discount may compound. Consolidate all discount logic into one table.

---

### 20. Promotional period pricing

**Scenario:** During a defined promotional period, apply a discount to specific categories.

**Engine:** Decision

**Dependencies:**
- Setting `promo.start_date`, `promo.end_date`, `promo.categories`, `promo.discount_percent`

**Rule JSON:**
```json
{
  "hitPolicy": "first",
  "inputs": ["date.today", "product.category"],
  "outputs": ["line_discount_percent"],
  "rows": [
    {
      "conditions": [
        { "op": "between", "value": [{ "fact": "setting.promo.start_date" }, { "fact": "setting.promo.end_date" }] },
        { "op": "in", "value": { "fact": "setting.promo.categories" } }
      ],
      "outputs": [{ "fact": "setting.promo.discount_percent" }]
    },
    { "conditions": [null, null], "outputs": [0] }
  ]
}
```

**Pitfalls:** Deactivate the rule or update dates after the promo ends — stale promo rules fire silently.

---

## Customers & Credit

### 21. Credit limit enforcement

**Scenario:** Prevent credit sales that would exceed the customer's available credit.

**Engine:** Validation

**Rule JSON:**
```json
{
  "entity": "sale",
  "when": "complete",
  "conditions": {
    "all": [
      { "fact": "payment_methods", "operator": "contains", "value": "credit" },
      { "fact": "customer.custom.credit_limit", "operator": "greaterThan", "value": 0 },
      { "fact": "credit_after_sale", "operator": "greaterThan", "value": { "fact": "customer.custom.credit_limit" } }
    ]
  },
  "onFailure": {
    "message": "This sale would exceed {{customer.name}}'s credit limit of KES {{customer.custom.credit_limit}}.",
    "code": "CREDIT_LIMIT_EXCEEDED",
    "allow_override": true,
    "override_role": "finance_lead"
  }
}
```

**Pitfalls:** Define precisely what `credit_used` includes — invoiced, or invoiced-minus-paid.

---

### 22. VIP thank-you email

**Scenario:** When a VIP customer completes a purchase over a threshold, send a thank-you with a discount code.

**Engine:** Reactive

**Dependencies:**
- Setting `loyalty.vip_thank_you_threshold` = `50000`
- Setting `loyalty.thank_you_discount_percent` = `10`
- Setting `loyalty.thank_you_code_validity_days` = `30`

**Rule JSON:**
```json
{
  "conditions": {
    "all": [
      { "fact": "customer.segment", "operator": "equal", "value": "vip" },
      { "fact": "sale.total", "operator": "greaterThan", "value": { "fact": "setting.loyalty.vip_thank_you_threshold" } }
    ]
  },
  "actions": [
    {
      "type": "create_record",
      "entity": "discount_code",
      "data": { "customer_id": "{{customer.id}}", "percent": "{{setting.loyalty.thank_you_discount_percent}}", "valid_days": "{{setting.loyalty.thank_you_code_validity_days}}", "code_prefix": "VIP" },
      "store_result_as": "new_code"
    },
    { "type": "notify", "channel": "email", "to": "{{customer.email}}", "template": "vip_thank_you", "data": { "discount_code": "{{new_code.code}}" } }
  ]
}
```

**Pitfalls:** Add a `last_thank_you_sent_at` timestamp check to avoid emailing the same customer repeatedly.

---

### 23. Customer segment auto-tagging

**Scenario:** Automatically upgrade a customer's segment based on cumulative spend.

**Engine:** Reactive

**Dependencies:**
- Setting `segmentation.vip_spend_threshold` = `500000`
- Setting `segmentation.wholesale_spend_threshold` = `100000`

**Rule JSON:**
```json
{
  "actions": [
    {
      "type": "update_record",
      "entity": "customer",
      "id": "{{customer.id}}",
      "condition": { "fact": "customer.custom.lifetime_spend_after_sale", "operator": "greaterThan", "value": { "fact": "setting.segmentation.vip_spend_threshold" } },
      "updates": { "segment": "vip" }
    },
    {
      "type": "update_record",
      "entity": "customer",
      "id": "{{customer.id}}",
      "condition": { "all": [
        { "fact": "customer.segment", "operator": "notEqual", "value": "vip" },
        { "fact": "customer.custom.lifetime_spend_after_sale", "operator": "greaterThan", "value": { "fact": "setting.segmentation.wholesale_spend_threshold" } }
      ]},
      "updates": { "segment": "wholesale" }
    }
  ]
}
```

**Pitfalls:** This only upgrades, never downgrades. Admins must correct wrong VIP tags manually.

---

### 24. Dormant customer re-engagement

**Scenario:** Email customers who haven't bought in 90 days with a re-engagement offer.

**Engine:** Reactive (scheduled weekly)

**Rule JSON:**
```json
{
  "query": {
    "entity": "customer",
    "where": {
      "all": [
        { "fact": "status", "operator": "equal", "value": "active" },
        { "fact": "email", "operator": "isNotNull" },
        { "fact": "last_purchase_at", "operator": "olderThan", "value": { "fact": "setting.reengagement.dormant_days", "unit": "days" } },
        { "fact": "custom.last_reengagement_sent_at", "operator": "olderThanOrNull", "value": { "value": 90, "unit": "days" } }
      ]
    }
  },
  "actions": [
    { "type": "notify", "channel": "email", "to": "{{customer.email}}", "template": "reengagement" },
    { "type": "update_record", "entity": "customer", "id": "{{customer.id}}", "updates": { "custom.last_reengagement_sent_at": "now" } }
  ]
}
```

**Pitfalls:** Only email customers with `marketing_consent == true` (data protection compliance).

---

## Assets

### 25. Warranty expiry warning

**Scenario:** Alert facilities team 60 days before an asset's warranty expires.

**Engine:** Reactive (scheduled daily)

**Dependencies:**
- Custom Field on Asset: `warranty_expiry_date` (date)
- Setting `assets.warranty_warning_days` = `60`

**Rule JSON:**
```json
{
  "query": {
    "entity": "asset",
    "where": {
      "all": [
        { "fact": "status", "operator": "equal", "value": "active" },
        { "fact": "custom.warranty_expiry_date", "operator": "isNotNull" },
        { "fact": "days_until_warranty_expiry", "operator": "between", "value": [0, { "fact": "setting.assets.warranty_warning_days" }] },
        { "fact": "custom.warranty_warning_sent", "operator": "notEqual", "value": true }
      ]
    }
  },
  "actions": [
    { "type": "notify", "channel": "email", "recipients": "{{setting.assets.warranty_warning_recipients}}", "template": "warranty_expiring" },
    { "type": "update_record", "entity": "asset", "id": "{{asset.id}}", "updates": { "custom.warranty_warning_sent": true } }
  ]
}
```

**Pitfalls:** Reset `warranty_warning_sent` if the warranty is renewed and expiry date extended.

---

### 26. Asset maintenance due reminder

**Scenario:** Alert when asset maintenance is due or overdue.

**Engine:** Reactive (scheduled daily)

**Dependencies:**
- Custom Field on Asset: `next_maintenance_due` (date)
- Custom Field on Asset: `maintenance_assignee_id` (reference)

**Rule JSON:**
```json
{
  "query": {
    "entity": "asset",
    "where": {
      "all": [
        { "fact": "status", "operator": "equal", "value": "active" },
        { "fact": "custom.next_maintenance_due", "operator": "lessThanOrEqual", "value": { "fact": "today" } }
      ]
    }
  },
  "actions": [
    { "type": "notify", "channel": "email", "to_user_id": "{{asset.custom.maintenance_assignee_id}}", "template": "maintenance_due", "cc_role": "facilities_manager" },
    { "type": "create_record", "entity": "task", "data": { "title": "Maintenance due: {{asset.name}}", "assigned_to": "{{asset.custom.maintenance_assignee_id}}", "due_date": "{{asset.custom.next_maintenance_due}}" } }
  ]
}
```

**Pitfalls:** Overdue assets keep firing daily — add a `last_reminder_sent` timestamp to throttle.

---

### 27. Asset assignment audit trail

**Scenario:** Every asset assignment/reassignment creates an immutable audit entry.

**Engine:** Reactive

**Rule JSON:**
```json
{
  "actions": [
    {
      "type": "create_record",
      "entity": "audit_log",
      "data": {
        "category": "asset_assignment",
        "asset_id": "{{asset.id}}",
        "asset_tag": "{{asset.tag}}",
        "previous_assignee": "{{event.previous_assignee_id}}",
        "new_assignee": "{{event.new_assignee_id}}",
        "location_id": "{{event.location_id}}",
        "reason": "{{event.reason}}",
        "actor_id": "{{actor.id}}",
        "timestamp": "now"
      }
    }
  ]
}
```

**Pitfalls:** Audit logs grow unbounded — set a retention policy and archive to cold storage.

---

## Operational / Administrative

### 28. Daily closing summary

**Scenario:** Email store manager a summary of the day's activity at configured closing time.

**Engine:** Reactive (scheduled daily)

**Rule JSON:**
```json
{
  "actions": [
    {
      "type": "generate_report",
      "template": "daily_closing_summary",
      "parameters": { "location_id": "{{location.id}}", "date": "{{today}}" },
      "sections": ["sales_summary", "top_products", "low_stock_items", "cash_variance", "voided_sales", "refunds_issued"],
      "recipients": "{{setting.closing.summary_recipients}}",
      "format": "pdf_email"
    }
  ]
}
```

**Pitfalls:** Multi-location — create one rule per location or managers receive irrelevant data.

---

### 29. Approval workflow for purchase orders

**Scenario:** POs over KES 50,000 need manager approval; over KES 500,000 need director approval.

**Engine:** Decision + Policy

**Rule JSON (decision — routes):**
```json
{
  "hitPolicy": "first",
  "inputs": ["po.total"],
  "outputs": ["required_approver_role"],
  "rows": [
    { "conditions": [{ "op": ">=", "value": { "fact": "setting.purchasing.director_approval_threshold" } }], "outputs": ["director"] },
    { "conditions": [{ "op": ">=", "value": { "fact": "setting.purchasing.manager_approval_threshold" } }], "outputs": ["manager"] },
    { "conditions": [null], "outputs": [null] }
  ]
}
```

**Rule JSON (policy — enforces):**
```json
{
  "action": "purchase_order.submit",
  "conditions": {
    "any": [
      { "fact": "resource.required_approver_role", "operator": "isNull" },
      { "fact": "resource.approved_by_roles", "operator": "contains", "value": { "fact": "resource.required_approver_role" } }
    ]
  },
  "effect": "allow",
  "default_effect": "deny",
  "deny_reason": "This PO requires {{resource.required_approver_role}} approval before submission."
}
```

**Pitfalls:** A director's approval should satisfy the manager threshold too — implement role hierarchy.

---

### 30. Multi-currency conversion at POS

**Scenario:** Accept USD at POS, convert to KES at configured rate, log the conversion.

**Engine:** Decision + Reactive

**Dependencies:**
- Setting `pos.fx_rate.USD` = `150.00`
- Setting `pos.fx_rate.updated_at` = `"2026-04-20T08:00:00Z"`

**Rule JSON (decision):**
```json
{
  "hitPolicy": "first",
  "inputs": ["payment.currency", "payment.amount"],
  "outputs": ["kes_equivalent"],
  "rows": [
    { "conditions": [{ "op": "==", "value": "KES" }, null], "outputs": [{ "fact": "payment.amount" }] },
    { "conditions": [{ "op": "==", "value": "USD" }, null], "outputs": [{ "expression": "payment.amount * setting.pos.fx_rate.USD" }] }
  ]
}
```

**Rule JSON (reactive — audit):**
```json
{
  "conditions": { "all": [{ "fact": "payment.currency", "operator": "notEqual", "value": "KES" }] },
  "actions": [
    {
      "type": "create_record",
      "entity": "fx_audit_log",
      "data": {
        "sale_id": "{{sale.id}}",
        "currency": "{{payment.currency}}",
        "foreign_amount": "{{payment.amount}}",
        "kes_equivalent": "{{payment.kes_equivalent}}",
        "rate_used": "{{setting.pos.fx_rate[payment.currency]}}",
        "rate_date": "{{setting.pos.fx_rate.updated_at}}"
      }
    }
  ]
}
```

**Pitfalls:** Stale FX rates silently apply wrong conversions — warn when `pos.fx_rate.updated_at` is older than N days.

---

## Appendix A — common JSON patterns

### Reading from settings
`{ "fact": "setting.<key>" }` — reads the current value of any setting key at rule evaluation time.

### Referencing custom fields
`{ "fact": "entity.custom.<field_key>" }` in conditions; `{{entity.custom.<field_key>}}` in templates.

### Composing conditions
- `all` — AND (every condition must pass)
- `any` — OR (at least one must pass)
- `not` — negates the nested condition
- Nest arbitrarily deep

### Action timing
Reactive actions fire **asynchronously** and do not block the triggering transaction. For synchronous blocks, use Validation or Policy engines.

---

## Appendix B — naming convention

Follow the pattern `<Subject> <Verb Phrase>`:
- ✅ "Low Stock Alert" — "VIP Thank You Email" — "Credit Limit Enforcement"
- ❌ "AlertLowStock" — "Email VIP customers when they spend a lot"

---

*End of Rule Cookbook — v1.0*

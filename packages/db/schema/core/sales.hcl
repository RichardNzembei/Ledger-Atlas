table "sales" {
  schema = schema.inventory

  column "id"           { null = false  type = binary(16) }
  column "tenant_id"    { null = false  type = binary(16) }
  column "sale_number"  { null = false  type = varchar(50)  comment = "Human-facing reference" }
  column "location_id"  { null = false  type = binary(16) }
  column "customer_id"  { null = true   type = binary(16) }
  column "cashier_id"   { null = false  type = binary(16) }
  column "status" {
    null    = false
    type    = enum("open", "completed", "voided", "refunded", "partially_refunded")
    default = "open"
  }
  column "subtotal"      { null = false  type = decimal(14, 4)  default = 0 }
  column "discount_total"{ null = false  type = decimal(14, 4)  default = 0 }
  column "tax_total"     { null = false  type = decimal(14, 4)  default = 0 }
  column "total"         { null = false  type = decimal(14, 4)  default = 0 }
  column "paid"          { null = false  type = decimal(14, 4)  default = 0 }
  column "change_given"  { null = false  type = decimal(14, 4)  default = 0 }
  column "currency"      { null = false  type = char(3)  default = "KES" }
  column "notes"         { null = true   type = text }
  column "metadata"      { null = false  type = json  comment = "Rule trace, applied discounts, tax breakdown" }
  column "completed_at"  { null = true   type = timestamp(3) }
  column "created_at"    { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "updated_at"    { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }

  primary_key { columns = [column.id] }

  index "idx_sales_tenant_number"    { unique = true  columns = [column.tenant_id, column.sale_number] }
  index "idx_sales_tenant_status"    { columns = [column.tenant_id, column.status] }
  index "idx_sales_location_date"    { columns = [column.tenant_id, column.location_id, column.created_at] }
  index "idx_sales_customer"         { columns = [column.tenant_id, column.customer_id] }
  index "idx_sales_cashier"          { columns = [column.tenant_id, column.cashier_id] }

  foreign_key "fk_sales_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_sales_location" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete   = RESTRICT
  }

  foreign_key "fk_sales_customer" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete   = SET_NULL
  }
}

table "sale_items" {
  schema = schema.inventory

  column "id"           { null = false  type = binary(16) }
  column "sale_id"      { null = false  type = binary(16) }
  column "tenant_id"    { null = false  type = binary(16) }
  column "product_id"   { null = false  type = binary(16) }
  column "quantity"     { null = false  type = decimal(10, 4) }
  column "unit_price"   { null = false  type = decimal(14, 4) }
  column "discount_pct" { null = false  type = decimal(5, 4)  default = 0 }
  column "discount_amt" { null = false  type = decimal(14, 4)  default = 0 }
  column "tax_pct"      { null = false  type = decimal(5, 4)  default = 0 }
  column "tax_amt"      { null = false  type = decimal(14, 4)  default = 0 }
  column "line_total"   { null = false  type = decimal(14, 4) }
  column "notes"        { null = true   type = varchar(500) }

  primary_key { columns = [column.id] }

  index "idx_sale_items_sale"    { columns = [column.sale_id] }
  index "idx_sale_items_product" { columns = [column.tenant_id, column.product_id] }

  foreign_key "fk_sale_items_sale" {
    columns     = [column.sale_id]
    ref_columns = [table.sales.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_sale_items_product" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete   = RESTRICT
  }
}

table "payments" {
  schema = schema.inventory

  column "id"           { null = false  type = binary(16) }
  column "sale_id"      { null = false  type = binary(16) }
  column "tenant_id"    { null = false  type = binary(16) }
  column "method" {
    null = false
    type = enum("cash", "mpesa", "card", "bank_transfer", "credit", "other")
  }
  column "amount"       { null = false  type = decimal(14, 4) }
  column "reference"    { null = true   type = varchar(100)  comment = "M-Pesa receipt, card auth code, etc." }
  column "status" {
    null    = false
    type    = enum("pending", "confirmed", "failed", "refunded")
    default = "pending"
  }
  column "provider_response" { null = true  type = json }
  column "created_at"   { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "confirmed_at" { null = true   type = timestamp(3) }

  primary_key { columns = [column.id] }

  index "idx_payments_sale"      { columns = [column.sale_id] }
  index "idx_payments_reference" { columns = [column.tenant_id, column.reference] }
  index "idx_payments_status"    { columns = [column.tenant_id, column.status] }

  foreign_key "fk_payments_sale" {
    columns     = [column.sale_id]
    ref_columns = [table.sales.column.id]
    on_delete   = CASCADE
  }
}

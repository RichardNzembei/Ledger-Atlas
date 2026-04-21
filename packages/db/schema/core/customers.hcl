table "customers" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "code" {
    null = true
    type = varchar(50)
  }
  column "name" {
    null = false
    type = varchar(255)
  }
  column "email" {
    null = true
    type = varchar(320)
  }
  column "phone" {
    null = true
    type = varchar(30)
  }
  column "segment" {
    null    = false
    type    = enum("retail", "wholesale", "vip", "staff")
    default = "retail"
  }
  column "credit_limit" {
    null = false
    type = decimal(14, 4)
    default = 0
  }
  column "balance" {
    null = false
    type = decimal(14, 4)
    default = 0
    comment = "Running receivables balance"
  }
  column "address" {
    null = true
    type = text
  }
  column "notes" {
    null = true
    type = text
  }
  column "is_active" {
    null = false
    type = boolean
    default = true
  }
  column "created_at" {
    null = false
    type = timestamp(3)
    default = sql("CURRENT_TIMESTAMP(3)")
  }
  column "updated_at" {
    null = false
    type = timestamp(3)
    default = sql("CURRENT_TIMESTAMP(3)")
    on_update = sql("CURRENT_TIMESTAMP(3)")
  }

  primary_key { columns = [column.id] }

  index "idx_customers_tenant_email" {
    unique = true
    columns = [column.tenant_id, column.email]
  }
  index "idx_customers_tenant_phone"  { columns = [column.tenant_id, column.phone] }
  index "idx_customers_tenant_code" {
    unique = true
    columns = [column.tenant_id, column.code]
  }
  index "idx_customers_segment"       { columns = [column.tenant_id, column.segment] }

  foreign_key "fk_customers_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

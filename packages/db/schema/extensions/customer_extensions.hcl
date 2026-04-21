table "customer_extensions" {
  schema = schema.inventory

  column "customer_id" { null = false  type = binary(16) }
  column "tenant_id"   { null = false  type = binary(16) }
  column "custom"      {
    null    = false
    type    = json
    comment = "Tenant-defined custom fields as JSON"
  }

  primary_key { columns = [column.customer_id] }

  index "idx_custext_tenant"  { columns = [column.tenant_id] }

  foreign_key "fk_custext_customer" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete   = CASCADE
  }
}

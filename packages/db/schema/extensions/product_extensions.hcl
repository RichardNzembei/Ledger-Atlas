table "product_extensions" {
  schema = schema.inventory

  column "product_id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "custom"      {
    null    = false
    type    = json
    comment = "Tenant-defined custom fields as JSON"
  }

  primary_key { columns = [column.product_id] }

  index "idx_prodext_tenant"  { columns = [column.tenant_id] }

  foreign_key "fk_prodext_product" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete   = CASCADE
  }
}

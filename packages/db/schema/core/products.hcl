table "products" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "sku" {
    null = false
    type = varchar(64)
  }
  column "name" {
    null = false
    type = varchar(255)
  }
  column "description" {
    null = true
    type = text
  }
  column "category" {
    null = true
    type = varchar(100)
  }
  column "subcategory" {
    null = true
    type = varchar(100)
  }
  column "unit_of_measure" {
    null = false
    type = varchar(20)
    default = "unit"
  }
  column "base_price" {
    null = false
    type = decimal(14, 4)
    default = 0
  }
  column "cost_price" {
    null = false
    type = decimal(14, 4)
    default = 0
  }
  column "tax_class" {
    null = true
    type = varchar(50)
    comment = "Maps to tax rule category"
  }
  column "track_lots" {
    null = false
    type = boolean
    default = false
  }
  column "track_serials" {
    null = false
    type = boolean
    default = false
  }
  column "reorder_point" {
    null = true
    type = decimal(10, 2)
    comment = "Alert threshold"
  }
  column "reorder_qty" {
    null = true
    type = decimal(10, 2)
    comment = "Default replenishment qty"
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

  index "idx_products_tenant_sku" {
    unique = true
    columns = [column.tenant_id, column.sku]
  }
  index "idx_products_tenant_active" { columns = [column.tenant_id, column.is_active] }
  index "idx_products_category"      { columns = [column.tenant_id, column.category] }

  foreign_key "fk_products_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

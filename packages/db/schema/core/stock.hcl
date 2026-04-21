table "stock_on_hand" {
  schema = schema.inventory
  comment = "Read-model projection; rebuilt from domain_events"

  column "id"          { null = false  type = binary(16) }
  column "tenant_id"   { null = false  type = binary(16) }
  column "product_id"  { null = false  type = binary(16) }
  column "location_id" { null = false  type = binary(16) }
  column "quantity"    { null = false  type = decimal(14, 4)  default = 0 }
  column "reserved"    { null = false  type = decimal(14, 4)  default = 0  comment = "Reserved for open orders" }
  column "updated_at"  { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }

  primary_key { columns = [column.id] }

  index "idx_soh_lookup" {
    unique  = true
    columns = [column.tenant_id, column.product_id, column.location_id]
  }
  index "idx_soh_location" { columns = [column.tenant_id, column.location_id] }

  foreign_key "fk_soh_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_soh_product" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_soh_location" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete   = CASCADE
  }
}

table "purchase_orders" {
  schema = schema.inventory

  column "id"           { null = false  type = binary(16) }
  column "tenant_id"    { null = false  type = binary(16) }
  column "po_number"    { null = false  type = varchar(50) }
  column "location_id"  { null = false  type = binary(16)  comment = "Receiving location" }
  column "supplier_name"{ null = false  type = varchar(255) }
  column "status" {
    null    = false
    type    = enum("draft", "pending_approval", "approved", "ordered", "partially_received", "received", "cancelled")
    default = "draft"
  }
  column "expected_at"  { null = true   type = date }
  column "notes"        { null = true   type = text }
  column "total"        { null = false  type = decimal(14, 4)  default = 0 }
  column "created_by"   { null = false  type = binary(16) }
  column "approved_by"  { null = true   type = binary(16) }
  column "created_at"   { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "updated_at"   { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }

  primary_key { columns = [column.id] }

  index "idx_po_tenant_number" { unique = true  columns = [column.tenant_id, column.po_number] }
  index "idx_po_status"        { columns = [column.tenant_id, column.status] }
  index "idx_po_location"      { columns = [column.tenant_id, column.location_id] }

  foreign_key "fk_po_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_po_location" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete   = RESTRICT
  }
}

table "purchase_order_items" {
  schema = schema.inventory

  column "id"           { null = false  type = binary(16) }
  column "po_id"        { null = false  type = binary(16) }
  column "tenant_id"    { null = false  type = binary(16) }
  column "product_id"   { null = false  type = binary(16) }
  column "ordered_qty"  { null = false  type = decimal(10, 4) }
  column "received_qty" { null = false  type = decimal(10, 4)  default = 0 }
  column "unit_cost"    { null = false  type = decimal(14, 4) }
  column "line_total"   { null = false  type = decimal(14, 4) }

  primary_key { columns = [column.id] }

  index "idx_poi_po"      { columns = [column.po_id] }
  index "idx_poi_product" { columns = [column.tenant_id, column.product_id] }

  foreign_key "fk_poi_po" {
    columns     = [column.po_id]
    ref_columns = [table.purchase_orders.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_poi_product" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete   = RESTRICT
  }
}

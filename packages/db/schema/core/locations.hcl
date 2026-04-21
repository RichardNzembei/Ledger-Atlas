table "locations" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "parent_id" {
    null = true
    type = binary(16)
    comment = "Nullable for root locations"
  }
  column "code" {
    null = false
    type = varchar(50)
  }
  column "name" {
    null = false
    type = varchar(255)
  }
  column "type" {
    null    = false
    type    = enum("warehouse", "store", "bin", "virtual")
    default = "store"
  }
  column "address" {
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

  index "idx_locations_tenant_code" {
    unique  = true
    columns = [column.tenant_id, column.code]
  }
  index "idx_locations_parent"  { columns = [column.parent_id] }
  index "idx_locations_active"  { columns = [column.tenant_id, column.is_active] }

  foreign_key "fk_locations_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_locations_parent" {
    columns     = [column.parent_id]
    ref_columns = [table.locations.column.id]
    on_delete   = RESTRICT
  }
}

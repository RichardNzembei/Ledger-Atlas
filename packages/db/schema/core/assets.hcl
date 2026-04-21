table "assets" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "asset_tag" {
    null = false
    type = varchar(64)
    comment = "Human-readable asset ID"
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
  column "status" {
    null    = false
    type    = enum("active", "in_maintenance", "disposed", "lost")
    default = "active"
  }
  column "lifecycle_stage" {
    null    = false
    type    = enum("acquired", "assigned", "in_service", "under_repair", "decommissioned", "disposed")
    default = "acquired"
  }
  column "location_id" {
    null = true
    type = binary(16)
    comment = "Current location"
  }
  column "assigned_to_user_id" {
    null = true
    type = binary(16)
  }
  column "acquired_at" {
    null = true
    type = date
  }
  column "acquisition_cost" {
    null = false
    type = decimal(14, 4)
    default = 0
  }
  column "book_value" {
    null = false
    type = decimal(14, 4)
    default = 0
  }
  column "depreciation_method" {
    null    = false
    type    = enum("straight_line", "declining_balance", "units_of_production", "none")
    default = "straight_line"
  }
  column "useful_life_months" {
    null = true
    type = int
    unsigned = true
  }
  column "salvage_value" {
    null = false
    type = decimal(14, 4)
    default = 0
  }
  column "serial_number" {
    null = true
    type = varchar(128)
  }
  column "notes" {
    null = true
    type = text
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

  index "idx_assets_tenant_tag" {
    unique = true
    columns = [column.tenant_id, column.asset_tag]
  }
  index "idx_assets_tenant_status"   { columns = [column.tenant_id, column.status] }
  index "idx_assets_location"        { columns = [column.tenant_id, column.location_id] }
  index "idx_assets_serial"          { columns = [column.tenant_id, column.serial_number] }

  foreign_key "fk_assets_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_assets_location" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete   = SET_NULL
  }
}

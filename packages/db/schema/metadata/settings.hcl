table "settings" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "scope_type" {
    null = false
    type = enum("tenant", "location", "user")
  }
  column "scope_id"   {
    null    = true
    type    = binary(16)
    comment = "NULL for tenant-level scope"
  }
  column "key" {
    null = false
    type = varchar(200)
  }
  column "value" {
    null = false
    type = json
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

  index "idx_settings_lookup" {
    unique  = true
    columns = [column.tenant_id, column.scope_type, column.scope_id, column.key]
  }

  foreign_key "fk_settings_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

table "setting_definitions" {
  schema = schema.inventory
  comment = "Schema for all valid setting keys — drives UI and default values"

  column "key" {
    null = false
    type = varchar(200)
  }
  column "label" {
    null = false
    type = varchar(255)
  }
  column "description" {
    null = true
    type = text
  }
  column "data_type" {
    null = false
    type = enum("string", "number", "boolean", "enum", "json")
  }
  column "default_value" {
    null = false
    type = json
  }
  column "allowed_scopes" {
    null    = false
    type    = json
    comment = "Array of: tenant, location, user"
  }
  column "options" {
    null = true
    type = json
    comment = "For enum type: array of {value, label}"
  }
  column "section" {
    null = false
    type = varchar(100)
  }
  column "display_order" {
    null = false
    type = int
    default = 0
  }

  primary_key { columns = [column.key] }
}

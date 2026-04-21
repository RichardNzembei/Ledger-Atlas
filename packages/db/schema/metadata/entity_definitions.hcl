table "entity_definitions" {
  schema = schema.inventory
  comment = "Virtual entity types tenants can create (beyond core entities)"

  column "id"          { null = false  type = binary(16) }
  column "tenant_id"   { null = false  type = binary(16) }
  column "key"         { null = false  type = varchar(100)  comment = "machine-readable, e.g. custom_asset" }
  column "label"       { null = false  type = varchar(255) }
  column "description" { null = true   type = text }
  column "icon"        { null = true   type = varchar(50) }
  column "is_active"   { null = false  type = boolean  default = true }
  column "created_at"  { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "updated_at"  { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }

  primary_key { columns = [column.id] }

  index "idx_entitydef_tenant_key" {
    unique  = true
    columns = [column.tenant_id, column.key]
  }

  foreign_key "fk_entitydef_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

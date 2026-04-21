table "field_definitions" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "entity_type" {
    null = false
    type = varchar(50)
    comment = "e.g. product, asset, customer"
  }
  column "field_key" {
    null = false
    type = varchar(100)
  }
  column "label" {
    null = false
    type = varchar(255)
  }
  column "data_type" {
    null = false
    type = enum("string", "text", "number", "decimal", "boolean", "date", "datetime", "enum", "reference", "json")
  }
  column "config" {
    null    = false
    type    = json
    comment = "Validation rules, enum options, reference target, display hints, min/max"
  }
  column "is_required" {
    null = false
    type = boolean
    default = false
  }
  column "is_indexed" {
    null = false
    type = boolean
    default = false
  }
  column "is_active" {
    null = false
    type = boolean
    default = true
  }
  column "display_order" {
    null = false
    type = int
    default = 0
  }
  column "section" {
    null = true
    type = varchar(100)
    comment = "UI grouping label"
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

  index "idx_fielddef_lookup" {
    unique  = true
    columns = [column.tenant_id, column.entity_type, column.field_key]
  }
  index "idx_fielddef_entity" { columns = [column.tenant_id, column.entity_type, column.is_active] }

  foreign_key "fk_fielddef_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

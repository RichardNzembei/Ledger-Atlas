table "workflow_definitions" {
  schema = schema.inventory

  column "id"           { null = false  type = binary(16) }
  column "tenant_id"    { null = false  type = binary(16) }
  column "name"         { null = false  type = varchar(255) }
  column "description"  { null = true   type = text }
  column "trigger_type" {
    null = false
    type = enum("manual", "event", "schedule")
  }
  column "trigger_config" { null = false  type = json }
  column "steps"          { null = false  type = json  comment = "XState machine config JSON" }
  column "is_active"      { null = false  type = boolean  default = false }
  column "created_at"     { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "updated_at"     { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }

  primary_key { columns = [column.id] }

  index "idx_wfdef_tenant_active" { columns = [column.tenant_id, column.is_active] }

  foreign_key "fk_wfdef_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

table "workflow_instances" {
  schema = schema.inventory

  column "id"             { null = false  type = binary(16) }
  column "tenant_id"      { null = false  type = binary(16) }
  column "definition_id"  { null = false  type = binary(16) }
  column "context_type"   { null = false  type = varchar(50) }
  column "context_id"     { null = false  type = binary(16) }
  column "status" {
    null    = false
    type    = enum("pending", "running", "completed", "failed", "cancelled")
    default = "pending"
  }
  column "current_state"  { null = false  type = varchar(100) }
  column "state_data"     { null = false  type = json }
  column "created_at"     { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "updated_at"     { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }
  column "completed_at"   { null = true   type = timestamp(3) }

  primary_key { columns = [column.id] }

  index "idx_wfinst_context"  { columns = [column.tenant_id, column.context_type, column.context_id] }
  index "idx_wfinst_status"   { columns = [column.tenant_id, column.status] }

  foreign_key "fk_wfinst_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }

  foreign_key "fk_wfinst_def" {
    columns     = [column.definition_id]
    ref_columns = [table.workflow_definitions.column.id]
    on_delete   = RESTRICT
  }
}

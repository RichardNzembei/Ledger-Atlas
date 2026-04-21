table "rule_definitions" {
  schema = schema.inventory

  column "id" {
    null = false
    type = binary(16)
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "name" {
    null = false
    type = varchar(255)
  }
  column "description" {
    null = true
    type = text
  }
  column "engine" {
    null = false
    type = enum("validation", "decision", "reactive", "policy")
  }
  column "trigger_event" {
    null    = true
    type    = varchar(100)
    comment = "e.g. sale.completed, stock.updated — for reactive engine only"
  }
  column "priority" {
    null = false
    type = int
    default = 100
    comment = "Lower = higher priority"
  }
  column "body" {
    null = false
    type = json
    comment = "Rule definition in the engine native format"
  }
  column "version" {
    null = false
    type = int
    default = 1
  }
  column "is_active" {
    null = false
    type = boolean
    default = false
  }
  column "authored_by_user_id" {
    null = true
    type = binary(16)
  }
  column "authored_from_natural_language" {
    null = true
    type = text
  }
  column "dry_run_results" {
    null = true
    type = json
  }
  column "created_at" {
    null = false
    type = timestamp(3)
    default = sql("CURRENT_TIMESTAMP(3)")
  }
  column "activated_at" {
    null = true
    type = timestamp(3)
  }

  primary_key { columns = [column.id] }

  index "idx_rules_tenant_engine"  { columns = [column.tenant_id, column.engine, column.is_active] }
  index "idx_rules_trigger"        { columns = [column.tenant_id, column.trigger_event, column.is_active] }

  foreign_key "fk_rules_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

table "rule_execution_log" {
  schema = schema.inventory
  comment = "Audit log for rule evaluations — supports the visual rule tracer"

  column "id" {
    null = false
    type = bigint
    auto_increment = true
    unsigned = true
  }
  column "tenant_id" {
    null = false
    type = binary(16)
  }
  column "rule_id" {
    null = false
    type = binary(16)
  }
  column "context_type" {
    null = false
    type = varchar(50)
    comment = "sale, stock_check, etc."
  }
  column "context_id" {
    null = false
    type = binary(16)
  }
  column "input" {
    null = false
    type = json
  }
  column "output" {
    null = false
    type = json
  }
  column "duration_ms" {
    null = false
    type = int
    unsigned = true
  }
  column "executed_at" {
    null = false
    type = timestamp(3)
    default = sql("CURRENT_TIMESTAMP(3)")
  }

  primary_key { columns = [column.id] }

  index "idx_rulelog_context"  { columns = [column.tenant_id, column.context_type, column.context_id, column.executed_at] }
  index "idx_rulelog_rule"     { columns = [column.tenant_id, column.rule_id, column.executed_at] }
}

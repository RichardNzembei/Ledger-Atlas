table "users" {
  schema = schema.inventory

  column "id"            { null = false  type = binary(16) }
  column "tenant_id"     { null = false  type = binary(16) }
  column "email"         { null = false  type = varchar(320) }
  column "password_hash" { null = false  type = varchar(255) }
  column "display_name"  { null = false  type = varchar(255) }
  column "status" {
    null    = false
    type    = enum("active", "suspended", "invited")
    default = "invited"
  }
  column "roles" {
    null    = false
    type    = json
    comment = "Array of role strings for Casbin"
  }
  column "last_login_at" { null = true   type = timestamp(3) }
  column "created_at"    { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)") }
  column "updated_at"    { null = false  type = timestamp(3)  default = sql("CURRENT_TIMESTAMP(3)")  on_update = sql("CURRENT_TIMESTAMP(3)") }

  primary_key { columns = [column.id] }

  index "idx_users_tenant_email" {
    unique  = true
    columns = [column.tenant_id, column.email]
  }
  index "idx_users_tenant_status" { columns = [column.tenant_id, column.status] }

  foreign_key "fk_users_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete   = CASCADE
  }
}

table "tenants" {
  schema = schema.inventory

  column "id" {
    null    = false
    type    = binary(16)
    comment = "UUID v7 stored as binary(16)"
  }
  column "slug" {
    null = false
    type = varchar(63)
  }
  column "name" {
    null = false
    type = varchar(255)
  }
  column "status" {
    null    = false
    type    = enum("active", "suspended", "trial")
    default = "trial"
  }
  column "plan" {
    null    = false
    type    = enum("free", "starter", "growth", "enterprise")
    default = "free"
  }
  column "settings" {
    null    = false
    type    = json
    comment = "Tenant-level settings overrides blob"
  }
  column "created_at" {
    null    = false
    type    = timestamp(3)
    default = sql("CURRENT_TIMESTAMP(3)")
  }
  column "updated_at" {
    null      = false
    type      = timestamp(3)
    default   = sql("CURRENT_TIMESTAMP(3)")
    on_update = sql("CURRENT_TIMESTAMP(3)")
  }

  primary_key { columns = [column.id] }

  index "idx_tenants_slug" {
    unique  = true
    columns = [column.slug]
  }
}

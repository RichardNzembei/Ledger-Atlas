table "asset_extensions" {
  schema = schema.inventory

  column "asset_id"    { null = false  type = binary(16) }
  column "tenant_id"   { null = false  type = binary(16) }
  column "custom"      {
    null    = false
    type    = json
    comment = "Tenant-defined custom fields as JSON"
  }

  primary_key { columns = [column.asset_id] }

  index "idx_assetext_tenant"  { columns = [column.tenant_id] }

  foreign_key "fk_assetext_asset" {
    columns     = [column.asset_id]
    ref_columns = [table.assets.column.id]
    on_delete   = CASCADE
  }
}

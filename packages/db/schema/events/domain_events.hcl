table "domain_events" {
  schema = schema.inventory

  column "id"          { null = false  type = bigint  auto_increment = true  unsigned = true }
  column "tenant_id"   { null = false  type = binary(16) }
  column "stream_type" { null = false  type = varchar(50)  comment = "e.g. stock, order, asset" }
  column "stream_id"   { null = false  type = binary(16) }
  column "version"     { null = false  type = int  unsigned = true  comment = "Per-stream monotonic version" }
  column "event_type"  { null = false  type = varchar(100)  comment = "e.g. StockReceived, SaleCompleted" }
  column "payload"     { null = false  type = json }
  column "metadata"    {
    null    = false
    type    = json
    comment = "userId, correlationId, causationId, IP address"
  }
  column "occurred_at" {
    null    = false
    type    = timestamp(3)
    default = sql("CURRENT_TIMESTAMP(3)")
  }

  primary_key { columns = [column.id] }

  index "idx_events_stream" {
    unique  = true
    columns = [column.tenant_id, column.stream_type, column.stream_id, column.version]
  }
  index "idx_events_tenant_time"  { columns = [column.tenant_id, column.occurred_at] }
  index "idx_events_type"         { columns = [column.tenant_id, column.event_type, column.occurred_at] }
}

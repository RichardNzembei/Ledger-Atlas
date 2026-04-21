-- Create "tenants" table
CREATE TABLE `tenants` (
  `id` binary(16) NOT NULL COMMENT "UUID v7 stored as binary(16)",
  `slug` varchar(63) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('active','suspended','trial') NOT NULL DEFAULT "trial",
  `plan` enum('free','starter','growth','enterprise') NOT NULL DEFAULT "free",
  `settings` json NOT NULL COMMENT "Tenant-level settings overrides blob",
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_tenants_slug` (`slug`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "domain_events" table
CREATE TABLE `domain_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` binary(16) NOT NULL,
  `stream_type` varchar(50) NOT NULL COMMENT "e.g. stock, order, asset",
  `stream_id` binary(16) NOT NULL,
  `version` int unsigned NOT NULL COMMENT "Per-stream monotonic version",
  `event_type` varchar(100) NOT NULL COMMENT "e.g. StockReceived, SaleCompleted",
  `payload` json NOT NULL,
  `metadata` json NOT NULL COMMENT "userId, correlationId, causationId, IP address",
  `occurred_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_events_stream` (`tenant_id`, `stream_type`, `stream_id`, `version`),
  INDEX `idx_events_tenant_time` (`tenant_id`, `occurred_at`),
  INDEX `idx_events_type` (`tenant_id`, `event_type`, `occurred_at`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "rule_execution_log" table
CREATE TABLE `rule_execution_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` binary(16) NOT NULL,
  `rule_id` binary(16) NOT NULL,
  `context_type` varchar(50) NOT NULL COMMENT "sale, stock_check, etc.",
  `context_id` binary(16) NOT NULL,
  `input` json NOT NULL,
  `output` json NOT NULL,
  `duration_ms` int unsigned NOT NULL,
  `executed_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_rulelog_context` (`tenant_id`, `context_type`, `context_id`, `executed_at`),
  INDEX `idx_rulelog_rule` (`tenant_id`, `rule_id`, `executed_at`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT "Audit log for rule evaluations — supports the visual rule tracer";
-- Create "setting_definitions" table
CREATE TABLE `setting_definitions` (
  `key` varchar(200) NOT NULL,
  `label` varchar(255) NOT NULL,
  `description` text NULL,
  `data_type` enum('string','number','boolean','enum','json') NOT NULL,
  `default_value` json NOT NULL,
  `allowed_scopes` json NOT NULL COMMENT "Array of: tenant, location, user",
  `options` json NULL COMMENT "For enum type: array of {value, label}",
  `section` varchar(100) NOT NULL,
  `display_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`key`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT "Schema for all valid setting keys — drives UI and default values";
-- Create "locations" table
CREATE TABLE `locations` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `parent_id` binary(16) NULL COMMENT "Nullable for root locations",
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('warehouse','store','bin','virtual') NOT NULL DEFAULT "store",
  `address` text NULL,
  `is_active` bool NOT NULL DEFAULT 1,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_locations_active` (`tenant_id`, `is_active`),
  INDEX `idx_locations_parent` (`parent_id`),
  UNIQUE INDEX `idx_locations_tenant_code` (`tenant_id`, `code`),
  CONSTRAINT `fk_locations_parent` FOREIGN KEY (`parent_id`) REFERENCES `locations` (`id`) ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT `fk_locations_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "assets" table
CREATE TABLE `assets` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `asset_tag` varchar(64) NOT NULL COMMENT "Human-readable asset ID",
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `category` varchar(100) NULL,
  `status` enum('active','in_maintenance','disposed','lost') NOT NULL DEFAULT "active",
  `lifecycle_stage` enum('acquired','assigned','in_service','under_repair','decommissioned','disposed') NOT NULL DEFAULT "acquired",
  `location_id` binary(16) NULL COMMENT "Current location",
  `assigned_to_user_id` binary(16) NULL,
  `acquired_at` date NULL,
  `acquisition_cost` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `book_value` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `depreciation_method` enum('straight_line','declining_balance','units_of_production','none') NOT NULL DEFAULT "straight_line",
  `useful_life_months` int unsigned NULL,
  `salvage_value` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `serial_number` varchar(128) NULL,
  `notes` text NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fk_assets_location` (`location_id`),
  INDEX `idx_assets_location` (`tenant_id`, `location_id`),
  INDEX `idx_assets_serial` (`tenant_id`, `serial_number`),
  INDEX `idx_assets_tenant_status` (`tenant_id`, `status`),
  UNIQUE INDEX `idx_assets_tenant_tag` (`tenant_id`, `asset_tag`),
  CONSTRAINT `fk_assets_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT `fk_assets_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "asset_extensions" table
CREATE TABLE `asset_extensions` (
  `asset_id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `custom` json NOT NULL COMMENT "Tenant-defined custom fields as JSON",
  PRIMARY KEY (`asset_id`),
  INDEX `idx_assetext_tenant` (`tenant_id`),
  CONSTRAINT `fk_assetext_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "customers" table
CREATE TABLE `customers` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `code` varchar(50) NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320) NULL,
  `phone` varchar(30) NULL,
  `segment` enum('retail','wholesale','vip','staff') NOT NULL DEFAULT "retail",
  `credit_limit` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `balance` decimal(14,4) NOT NULL DEFAULT 0.0000 COMMENT "Running receivables balance",
  `address` text NULL,
  `notes` text NULL,
  `is_active` bool NOT NULL DEFAULT 1,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_customers_segment` (`tenant_id`, `segment`),
  UNIQUE INDEX `idx_customers_tenant_code` (`tenant_id`, `code`),
  UNIQUE INDEX `idx_customers_tenant_email` (`tenant_id`, `email`),
  INDEX `idx_customers_tenant_phone` (`tenant_id`, `phone`),
  CONSTRAINT `fk_customers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "customer_extensions" table
CREATE TABLE `customer_extensions` (
  `customer_id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `custom` json NOT NULL COMMENT "Tenant-defined custom fields as JSON",
  PRIMARY KEY (`customer_id`),
  INDEX `idx_custext_tenant` (`tenant_id`),
  CONSTRAINT `fk_custext_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "entity_definitions" table
CREATE TABLE `entity_definitions` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `key` varchar(100) NOT NULL COMMENT "machine-readable, e.g. custom_asset",
  `label` varchar(255) NOT NULL,
  `description` text NULL,
  `icon` varchar(50) NULL,
  `is_active` bool NOT NULL DEFAULT 1,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_entitydef_tenant_key` (`tenant_id`, `key`),
  CONSTRAINT `fk_entitydef_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT "Virtual entity types tenants can create (beyond core entities)";
-- Create "field_definitions" table
CREATE TABLE `field_definitions` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `entity_type` varchar(50) NOT NULL COMMENT "e.g. product, asset, customer",
  `field_key` varchar(100) NOT NULL,
  `label` varchar(255) NOT NULL,
  `data_type` enum('string','text','number','decimal','boolean','date','datetime','enum','reference','json') NOT NULL,
  `config` json NOT NULL COMMENT "Validation rules, enum options, reference target, display hints, min/max",
  `is_required` bool NOT NULL DEFAULT 0,
  `is_indexed` bool NOT NULL DEFAULT 0,
  `is_active` bool NOT NULL DEFAULT 1,
  `display_order` int NOT NULL DEFAULT 0,
  `section` varchar(100) NULL COMMENT "UI grouping label",
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_fielddef_entity` (`tenant_id`, `entity_type`, `is_active`),
  UNIQUE INDEX `idx_fielddef_lookup` (`tenant_id`, `entity_type`, `field_key`),
  CONSTRAINT `fk_fielddef_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sales" table
CREATE TABLE `sales` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `sale_number` varchar(50) NOT NULL COMMENT "Human-facing reference",
  `location_id` binary(16) NOT NULL,
  `customer_id` binary(16) NULL,
  `cashier_id` binary(16) NOT NULL,
  `status` enum('open','completed','voided','refunded','partially_refunded') NOT NULL DEFAULT "open",
  `subtotal` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `discount_total` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `tax_total` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `total` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `paid` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `change_given` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `currency` char(3) NOT NULL DEFAULT "KES",
  `notes` text NULL,
  `metadata` json NOT NULL COMMENT "Rule trace, applied discounts, tax breakdown",
  `completed_at` timestamp(3) NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fk_sales_customer` (`customer_id`),
  INDEX `fk_sales_location` (`location_id`),
  INDEX `idx_sales_cashier` (`tenant_id`, `cashier_id`),
  INDEX `idx_sales_customer` (`tenant_id`, `customer_id`),
  INDEX `idx_sales_location_date` (`tenant_id`, `location_id`, `created_at`),
  UNIQUE INDEX `idx_sales_tenant_number` (`tenant_id`, `sale_number`),
  INDEX `idx_sales_tenant_status` (`tenant_id`, `status`),
  CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT `fk_sales_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT `fk_sales_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "payments" table
CREATE TABLE `payments` (
  `id` binary(16) NOT NULL,
  `sale_id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `method` enum('cash','mpesa','card','bank_transfer','credit','other') NOT NULL,
  `amount` decimal(14,4) NOT NULL,
  `reference` varchar(100) NULL COMMENT "M-Pesa receipt, card auth code, etc.",
  `status` enum('pending','confirmed','failed','refunded') NOT NULL DEFAULT "pending",
  `provider_response` json NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `confirmed_at` timestamp(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_payments_reference` (`tenant_id`, `reference`),
  INDEX `idx_payments_sale` (`sale_id`),
  INDEX `idx_payments_status` (`tenant_id`, `status`),
  CONSTRAINT `fk_payments_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "products" table
CREATE TABLE `products` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `sku` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `category` varchar(100) NULL,
  `subcategory` varchar(100) NULL,
  `unit_of_measure` varchar(20) NOT NULL DEFAULT "unit",
  `base_price` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `cost_price` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `tax_class` varchar(50) NULL COMMENT "Maps to tax rule category",
  `track_lots` bool NOT NULL DEFAULT 0,
  `track_serials` bool NOT NULL DEFAULT 0,
  `reorder_point` decimal(10,2) NULL COMMENT "Alert threshold",
  `reorder_qty` decimal(10,2) NULL COMMENT "Default replenishment qty",
  `is_active` bool NOT NULL DEFAULT 1,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_products_category` (`tenant_id`, `category`),
  INDEX `idx_products_tenant_active` (`tenant_id`, `is_active`),
  UNIQUE INDEX `idx_products_tenant_sku` (`tenant_id`, `sku`),
  CONSTRAINT `fk_products_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "product_extensions" table
CREATE TABLE `product_extensions` (
  `product_id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `custom` json NOT NULL COMMENT "Tenant-defined custom fields as JSON",
  PRIMARY KEY (`product_id`),
  INDEX `idx_prodext_tenant` (`tenant_id`),
  CONSTRAINT `fk_prodext_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "purchase_orders" table
CREATE TABLE `purchase_orders` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `location_id` binary(16) NOT NULL COMMENT "Receiving location",
  `supplier_name` varchar(255) NOT NULL,
  `status` enum('draft','pending_approval','approved','ordered','partially_received','received','cancelled') NOT NULL DEFAULT "draft",
  `expected_at` date NULL,
  `notes` text NULL,
  `total` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `created_by` binary(16) NOT NULL,
  `approved_by` binary(16) NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fk_po_location` (`location_id`),
  INDEX `idx_po_location` (`tenant_id`, `location_id`),
  INDEX `idx_po_status` (`tenant_id`, `status`),
  UNIQUE INDEX `idx_po_tenant_number` (`tenant_id`, `po_number`),
  CONSTRAINT `fk_po_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT `fk_po_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "purchase_order_items" table
CREATE TABLE `purchase_order_items` (
  `id` binary(16) NOT NULL,
  `po_id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `product_id` binary(16) NOT NULL,
  `ordered_qty` decimal(10,4) NOT NULL,
  `received_qty` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `unit_cost` decimal(14,4) NOT NULL,
  `line_total` decimal(14,4) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_poi_product` (`product_id`),
  INDEX `idx_poi_po` (`po_id`),
  INDEX `idx_poi_product` (`tenant_id`, `product_id`),
  CONSTRAINT `fk_poi_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT `fk_poi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE NO ACTION ON DELETE RESTRICT
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "rule_definitions" table
CREATE TABLE `rule_definitions` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `engine` enum('validation','decision','reactive','policy') NOT NULL,
  `trigger_event` varchar(100) NULL COMMENT "e.g. sale.completed, stock.updated — for reactive engine only",
  `priority` int NOT NULL DEFAULT 100 COMMENT "Lower = higher priority",
  `body` json NOT NULL COMMENT "Rule definition in the engine native format",
  `version` int NOT NULL DEFAULT 1,
  `is_active` bool NOT NULL DEFAULT 0,
  `authored_by_user_id` binary(16) NULL,
  `authored_from_natural_language` text NULL,
  `dry_run_results` json NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `activated_at` timestamp(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_rules_tenant_engine` (`tenant_id`, `engine`, `is_active`),
  INDEX `idx_rules_trigger` (`tenant_id`, `trigger_event`, `is_active`),
  CONSTRAINT `fk_rules_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sale_items" table
CREATE TABLE `sale_items` (
  `id` binary(16) NOT NULL,
  `sale_id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `product_id` binary(16) NOT NULL,
  `quantity` decimal(10,4) NOT NULL,
  `unit_price` decimal(14,4) NOT NULL,
  `discount_pct` decimal(5,4) NOT NULL DEFAULT 0.0000,
  `discount_amt` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `tax_pct` decimal(5,4) NOT NULL DEFAULT 0.0000,
  `tax_amt` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `line_total` decimal(14,4) NOT NULL,
  `notes` varchar(500) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_sale_items_product` (`product_id`),
  INDEX `idx_sale_items_product` (`tenant_id`, `product_id`),
  INDEX `idx_sale_items_sale` (`sale_id`),
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings" table
CREATE TABLE `settings` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `scope_type` enum('tenant','location','user') NOT NULL,
  `scope_id` binary(16) NULL COMMENT "NULL for tenant-level scope",
  `key` varchar(200) NOT NULL,
  `value` json NOT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_settings_lookup` (`tenant_id`, `scope_type`, `scope_id`, `key`),
  CONSTRAINT `fk_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "stock_on_hand" table
CREATE TABLE `stock_on_hand` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `product_id` binary(16) NOT NULL,
  `location_id` binary(16) NOT NULL,
  `quantity` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `reserved` decimal(14,4) NOT NULL DEFAULT 0.0000 COMMENT "Reserved for open orders",
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `fk_soh_location` (`location_id`),
  INDEX `fk_soh_product` (`product_id`),
  INDEX `idx_soh_location` (`tenant_id`, `location_id`),
  UNIQUE INDEX `idx_soh_lookup` (`tenant_id`, `product_id`, `location_id`),
  CONSTRAINT `fk_soh_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT `fk_soh_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT `fk_soh_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT "Read-model projection; rebuilt from domain_events";
-- Create "users" table
CREATE TABLE `users` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `status` enum('active','suspended','invited') NOT NULL DEFAULT "invited",
  `roles` json NOT NULL COMMENT "Array of role strings for Casbin",
  `last_login_at` timestamp(3) NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_users_tenant_email` (`tenant_id`, `email`),
  INDEX `idx_users_tenant_status` (`tenant_id`, `status`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "workflow_definitions" table
CREATE TABLE `workflow_definitions` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `trigger_type` enum('manual','event','schedule') NOT NULL,
  `trigger_config` json NOT NULL,
  `steps` json NOT NULL COMMENT "XState machine config JSON",
  `is_active` bool NOT NULL DEFAULT 0,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_wfdef_tenant_active` (`tenant_id`, `is_active`),
  CONSTRAINT `fk_wfdef_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "workflow_instances" table
CREATE TABLE `workflow_instances` (
  `id` binary(16) NOT NULL,
  `tenant_id` binary(16) NOT NULL,
  `definition_id` binary(16) NOT NULL,
  `context_type` varchar(50) NOT NULL,
  `context_id` binary(16) NOT NULL,
  `status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT "pending",
  `current_state` varchar(100) NOT NULL,
  `state_data` json NOT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `completed_at` timestamp(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_wfinst_def` (`definition_id`),
  INDEX `idx_wfinst_context` (`tenant_id`, `context_type`, `context_id`),
  INDEX `idx_wfinst_status` (`tenant_id`, `status`),
  CONSTRAINT `fk_wfinst_def` FOREIGN KEY (`definition_id`) REFERENCES `workflow_definitions` (`id`) ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT `fk_wfinst_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

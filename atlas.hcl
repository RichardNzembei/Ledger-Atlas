variable "url" {
  type    = string
  default = getenv("DB_URL")
}

variable "dev_url" {
  type    = string
  default = getenv("ATLAS_DEV_URL")
}

# Atlas's file:// URL for a directory is non-recursive, so subdirectory
# HCL files (core/, events/, extensions/, metadata/) are invisible when
# `src = "file://packages/db/schema"` alone. Listing each file explicitly.
locals {
  schema_files = [
    "file://packages/db/schema/_schema.hcl",
    "file://packages/db/schema/core/tenants.hcl",
    "file://packages/db/schema/core/users.hcl",
    "file://packages/db/schema/core/locations.hcl",
    "file://packages/db/schema/core/products.hcl",
    "file://packages/db/schema/core/customers.hcl",
    "file://packages/db/schema/core/assets.hcl",
    "file://packages/db/schema/core/sales.hcl",
    "file://packages/db/schema/core/stock.hcl",
    "file://packages/db/schema/events/domain_events.hcl",
    "file://packages/db/schema/extensions/asset_extensions.hcl",
    "file://packages/db/schema/extensions/customer_extensions.hcl",
    "file://packages/db/schema/extensions/product_extensions.hcl",
    "file://packages/db/schema/metadata/entity_definitions.hcl",
    "file://packages/db/schema/metadata/field_definitions.hcl",
    "file://packages/db/schema/metadata/rule_definitions.hcl",
    "file://packages/db/schema/metadata/settings.hcl",
    "file://packages/db/schema/metadata/workflows.hcl",
  ]
}

env "local" {
  src = local.schema_files
  url = var.url
  dev = var.dev_url

  migration {
    dir = "file://packages/db/migrations"
  }

  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }

  lint {
    latest = 1

    destructive {
      error = true
    }

    data_depend {
      error = false
    }
  }
}

env "prod" {
  src = local.schema_files
  url = var.url
  dev = var.dev_url

  migration {
    dir = "file://packages/db/migrations"
  }

  lint {
    review = ERROR
  }
}

variable "url" {
  type    = string
  default = getenv("DB_URL")
}

variable "dev_url" {
  type    = string
  default = getenv("ATLAS_DEV_URL")
}

env "local" {
  src = "file://packages/db/schema"
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
  src = "file://packages/db/schema"
  url = var.url
  dev = var.dev_url

  migration {
    dir = "file://packages/db/migrations"
  }

  lint {
    review = ERROR
  }
}

# terraform init -backend-config=environments/dev/backend.hcl

bucket         = "devtools-tfstate-819714650322-us-east-1"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "devtools-tfstate-lock"
encrypt        = true

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    # Populated via environments/dev/backend.hcl — run:
    # terraform init -backend-config=environments/dev/backend.hcl
    bucket         = ""
    key            = ""
    region         = ""
    dynamodb_table = ""
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  prefix = "${var.project}-${var.environment}"
}

module "amplify" {
  source      = "./modules/amplify"
  prefix      = local.prefix
}

# ── Cognito: user pool + app client ──
# module "cognito" {
#   source         = "./modules/cognito"
#   prefix         = local.prefix
#   callback_urls  = var.cognito_callback_urls
#   logout_urls    = var.cognito_logout_urls
# }

# # ── DynamoDB: snippet history table ──
# module "dynamodb" {
#   source = "./modules/dynamodb"
#   prefix = local.prefix
# }

# # ── Lambda: single dispatcher function ──
# module "lambda" {
#   source             = "./modules/lambda"
#   prefix             = local.prefix
#   dynamodb_table_arn = module.dynamodb.table_arn
#   dynamodb_table_name = module.dynamodb.table_name
# }

# # ── API Gateway: REST API wired to Lambda ──
# module "api_gateway" {
#   source             = "./modules/api_gateway"
#   prefix             = local.prefix
#   lambda_invoke_arn  = module.lambda.invoke_arn
#   lambda_func_name   = module.lambda.function_name
#   cognito_user_pool_arn = module.cognito.user_pool_arn
# }

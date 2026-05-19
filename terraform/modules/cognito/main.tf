variable "prefix"        { type = string }
variable "callback_urls" { type = list(string) }
variable "logout_urls"   { type = list(string) }

resource "aws_cognito_user_pool" "main" {
  name = "${var.prefix}-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.prefix # must be globally unique — change if taken
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false # SPA — no client secret
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  supported_identity_providers = ["COGNITO"]
  callback_urls                = var.callback_urls
  logout_urls                  = var.logout_urls

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}

output "user_pool_id"  { value = aws_cognito_user_pool.main.id }
output "user_pool_arn" { value = aws_cognito_user_pool.main.arn }
output "client_id"     { value = aws_cognito_user_pool_client.app.id }
output "domain"        { value = "${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com" }

data "aws_region" "current" {}

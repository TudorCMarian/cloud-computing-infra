variable "prefix" { type = string }
variable "callback_urls" { type = list(string) }
variable "logout_urls" { type = list(string) }
data "aws_region" "current" {}

# The User Pool (Your User Database)
resource "aws_cognito_user_pool" "main" {
  name = "${var.prefix}-user-pool"

  # What do users use to log in? (Usually email)
  alias_attributes         = ["email"]
  auto_verified_attributes = ["email"]

  # Password Policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Allow users to sign themselves up
  admin_create_user_config {
    allow_admin_create_user_only = false
  }
}

# The App Client (How your Amplify frontend talks to Cognito)
resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth settings needed for modern web apps
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls
  generate_secret = false
}

# The Domain (The hosted UI for logging in)
resource "aws_cognito_user_pool_domain" "domain" {
  # This domain prefix must be globally unique across all of AWS!
  # Using your project prefix + a random string is usually best.
  domain       = "${var.prefix}-auth-login"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Outputs needed for the frontend and API Gateway
output "user_pool_id" { value = aws_cognito_user_pool.main.id }
output "user_pool_arn" { value = aws_cognito_user_pool.main.arn }
output "client_id" { value = aws_cognito_user_pool_client.client.id }
output "domain" { value = "${aws_cognito_user_pool_domain.domain.domain}.auth.${data.aws_region.current.name}.amazoncognito.com" }

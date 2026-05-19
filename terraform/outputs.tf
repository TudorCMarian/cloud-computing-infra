output "cloudfront_domain" {
  description = "CloudFront distribution domain — use this as your app URL"
  value       = module.cloudfront.domain_name
}

output "api_gateway_url" {
  description = "Base URL for all API calls"
  value       = module.api_gateway.invoke_url
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID — needed for frontend config"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito app client ID — needed for frontend config"
  value       = module.cognito.client_id
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = module.cognito.domain
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend deployments"
  value       = module.s3.bucket_name
}

output "state_bucket" {
  description = "S3 bucket for Terraform state (reminder)"
  value       = "${var.project}-${var.environment}-tf-state"
}

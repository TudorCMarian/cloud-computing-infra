variable "project" {
  description = "Project name used as a prefix for all resources"
  type        = string
  default     = "devtools"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

# variable "cognito_callback_urls" {
#   description = "Allowed callback URLs for Cognito hosted UI"
#   type        = list(string)
#   default     = ["http://localhost:5173/callback"]
# }

# variable "cognito_logout_urls" {
#   description = "Allowed logout URLs for Cognito hosted UI"
#   type        = list(string)
#   default     = ["http://localhost:5173"]
# }

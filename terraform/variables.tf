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


variable "cognito_callback_urls" {
  description = "Allowed callback URLs for Cognito hosted UI"
  type        = list(string)
  default     = [
    "http://localhost:5173/callback",
    "https://master.d2856dxixt49cb.amplifyapp.com/callback",
    "https://master.d2856dxixt49cb.amplifyapp.com/callback/"]
}

variable "cognito_logout_urls" {
  description = "Allowed logout URLs for Cognito hosted UI"
  type        = list(string)
  default     = [
    "http://localhost:5173",
    "https://master.d2856dxixt49cb.amplifyapp.com"]
}

variable "github_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repo in format username/reponame"
  type        = string
  default     = "TudorCMarian/cloud-computing-infra"  # update this
}
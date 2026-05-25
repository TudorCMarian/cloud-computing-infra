variable "prefix"        { type = string }
variable "user_pool_id"  { type = string }
variable "client_id"     { type = string }
variable "cognito_domain" { type = string }
variable "api_url"       { type = string }
variable "github_token"  { type = string }
variable "github_repo"   { type = string } # e.g. "yourusername/devtools-app"

resource "aws_amplify_app" "frontend" {
  name         = "${var.prefix}-frontend"
  repository   = "https://github.com/${var.github_repo}"
  access_token = var.github_token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
  EOT

  environment_variables = {
    VITE_COGNITO_USER_POOL_ID = var.user_pool_id
    VITE_COGNITO_CLIENT_ID    = var.client_id
    VITE_COGNITO_DOMAIN       = var.cognito_domain
    VITE_API_URL              = var.api_url
  }

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }
}

resource "aws_amplify_branch" "master" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "master"
  framework   = "React"

  environment_variables = {
    VITE_COGNITO_USER_POOL_ID = var.user_pool_id
    VITE_COGNITO_CLIENT_ID    = var.client_id
    VITE_COGNITO_DOMAIN       = var.cognito_domain
    VITE_API_URL              = var.api_url
  }
}

output "amplify_url" {
  value       = "https://${aws_amplify_branch.master.branch_name}.${aws_amplify_app.frontend.default_domain}"
  description = "The URL to access the deployed frontend"
}
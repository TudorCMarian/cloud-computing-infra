variable "prefix" {
  type = string
}

resource "aws_amplify_app" "frontend" {
  name = "${var.prefix}-frontend"

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "main"
}

output "amplify_url" {
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.frontend.default_domain}"
  description = "The URL to access the deployed frontend"
}
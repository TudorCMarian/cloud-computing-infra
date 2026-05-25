variable "prefix"               { type = string }
variable "lambda_invoke_arn"    { type = string }
variable "lambda_func_name"     { type = string }
variable "cognito_user_pool_arn" { type = string }

resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.prefix}-api"
  description = "DevTools dispatcher API"
}

# Cognito JWT authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${var.prefix}-cognito-auth"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  identity_source = "method.request.header.Authorization"
  provider_arns   = [var.cognito_user_pool_arn]
}

# ── /tools resource (public — no auth required) ──
resource "aws_api_gateway_resource" "tools" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "tools"
}

resource "aws_api_gateway_method" "tools_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tools.id
  http_method   = "POST"
  authorization = "NONE" # client-safe tools — no auth needed
}

resource "aws_api_gateway_integration" "tools_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.tools.id
  http_method             = aws_api_gateway_method.tools_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# ── /snippets resource (protected — requires Cognito JWT) ──
resource "aws_api_gateway_resource" "snippets" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "snippets"
}

resource "aws_api_gateway_method" "snippets_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.snippets.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "snippets_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.snippets.id
  http_method             = aws_api_gateway_method.snippets_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

resource "aws_api_gateway_method" "snippets_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.snippets.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "snippets_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.snippets.id
  http_method             = aws_api_gateway_method.snippets_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn
}

# ── CORS OPTIONS methods ──
module "cors_tools" {
  source      = "./cors"
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tools.id
}

module "cors_snippets" {
  source      = "./cors"
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.snippets.id
}

# ── Deployment ──
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.tools.id,
      aws_api_gateway_method.tools_post.id,
      aws_api_gateway_resource.snippets.id,
      aws_api_gateway_method.snippets_get.id,
      aws_api_gateway_method.snippets_post.id,
    ]))
  }

    depends_on = [
    aws_api_gateway_integration.tools_post,
    aws_api_gateway_integration.snippets_get,
    aws_api_gateway_integration.snippets_post,
    module.cors_tools,
    module.cors_snippets,
  ]

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "dev" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "dev"
}

# Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_func_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

output "invoke_url" { value = aws_api_gateway_stage.dev.invoke_url }

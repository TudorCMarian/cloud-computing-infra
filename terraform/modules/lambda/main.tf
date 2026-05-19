variable "prefix"              { type = string }
variable "dynamodb_table_arn"  { type = string }
variable "dynamodb_table_name" { type = string }

# Package the handler source into a zip
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/src"
  output_path = "${path.module}/lambda_package.zip"
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda" {
  name = "${var.prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.prefix}-lambda-dynamo"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:DeleteItem",
      ]
      Resource = var.dynamodb_table_arn
    }]
  })
}

resource "aws_lambda_function" "dispatcher" {
  function_name    = "${var.prefix}-dispatcher"
  role             = aws_iam_role.lambda.arn
  handler          = "handlers/dispatcher.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
      NODE_ENV       = "production"
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.dispatcher.function_name}"
  retention_in_days = 7
}

output "invoke_arn"     { value = aws_lambda_function.dispatcher.invoke_arn }
output "function_name"  { value = aws_lambda_function.dispatcher.function_name }

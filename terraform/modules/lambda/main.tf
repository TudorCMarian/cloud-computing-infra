variable "prefix"              { type = string }
variable "dynamodb_table_arn"  { type = string }
variable "dynamodb_table_name" { type = string }

resource "null_resource" "lambda_build" {
triggers = {
    # This forces a rebuild if ANY file in the backend folder changes
    dir_sha1 = sha1(join("", [for f in fileset("${path.root}/../backend", "**"): filesha1("${path.root}/../backend/${f}")]))
  }
  provisioner "local-exec" {
    command     = "npm ci --omit=dev"
    working_dir = "${path.root}/../backend"
  }
}
# Package the handler source into a zip
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../backend"
  output_path = "${path.module}/lambda_package.zip"
  excludes    = [
    "node_modules/.cache",
    "src/**/*.test.js",
    ".env"
  ]

  depends_on = [null_resource.lambda_build]
}

data "aws_iam_role" "lab" {
  name = "LabRole"
}

resource "aws_lambda_function" "dispatcher" {
  function_name    = "${var.prefix}-dispatcher"
  role             = data.aws_iam_role.lab.arn
  handler          = "src/handlers/dispatcher.handler"
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
  tracing_config {
    mode = "Active"
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.dispatcher.function_name}"
  retention_in_days = 7
}

output "invoke_arn"     { value = aws_lambda_function.dispatcher.invoke_arn }
output "function_name"  { value = aws_lambda_function.dispatcher.function_name }

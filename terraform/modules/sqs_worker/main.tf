variable "dynamodb_table_name" { type = string }
variable "prefix"              { type = string }

data "aws_iam_role" "lab" {
  name = "LabRole"
}

resource "null_resource" "lambda_build" {
  triggers = {
    package_json = filemd5("${path.root}/../backend/package.json")
  }
  provisioner "local-exec" {
    command     = "npm ci --omit=dev"
    working_dir = "${path.root}/../backend"
  }
}

data "archive_file" "worker_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../backend"
  output_path = "${path.module}/worker_package.zip"
  excludes    = ["node_modules/.cache", "**/*.test.js", ".env"]
  depends_on  = [null_resource.lambda_build]
}

resource "aws_sqs_queue" "snippet_queue" {
  name                       = "${var.prefix}-snippet-queue"
  message_retention_seconds  = 86400
  visibility_timeout_seconds = 30
}

resource "aws_lambda_function" "sqs_worker" {
  filename         = data.archive_file.worker_zip.output_path
  function_name    = "${var.prefix}-sqs-worker"
  role             = data.aws_iam_role.lab.arn
  handler          = "src/handlers/worker.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.worker_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
      NODE_ENV       = "production"
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.snippet_queue.arn
  function_name    = aws_lambda_function.sqs_worker.arn
  batch_size       = 10
}

resource "aws_lambda_permission" "sqs" {
  statement_id  = "AllowSQSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sqs_worker.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.snippet_queue.arn
}

output "queue_url" { value = aws_sqs_queue.snippet_queue.url }
output "queue_arn" { value = aws_sqs_queue.snippet_queue.arn }
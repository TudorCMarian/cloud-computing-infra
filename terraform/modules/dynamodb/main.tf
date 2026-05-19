variable "prefix" { type = string }

resource "aws_dynamodb_table" "snippets" {
  name         = "${var.prefix}-snippets"
  billing_mode = "PAY_PER_REQUEST" # no provisioned capacity cost when idle
  hash_key     = "userId"
  range_key    = "snippetId"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "snippetId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery { enabled = true }
}

output "table_arn"  { value = aws_dynamodb_table.snippets.arn }
output "table_name" { value = aws_dynamodb_table.snippets.name }

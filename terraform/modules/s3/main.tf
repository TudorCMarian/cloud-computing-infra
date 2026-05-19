variable "prefix" { type = string }

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.prefix}-frontend"
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

output "bucket_id"              { value = aws_s3_bucket.frontend.id }
output "bucket_arn"             { value = aws_s3_bucket.frontend.arn }
output "bucket_name"            { value = aws_s3_bucket.frontend.bucket }
output "bucket_regional_domain" { value = aws_s3_bucket.frontend.bucket_regional_domain_name }

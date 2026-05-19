variable "prefix"        { type = string }
variable "bucket_id"     { type = string }
variable "bucket_arn"    { type = string }
variable "bucket_domain" { type = string }

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.prefix}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US + Europe only — cheapest

  origin {
    domain_name              = var.bucket_domain
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # Cache static assets aggressively; SPA index.html should not be cached
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Send all 403/404 back to index.html so React Router handles them
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Allow CloudFront OAC to read from the S3 bucket
resource "aws_s3_bucket_policy" "frontend" {
  bucket = var.bucket_id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${var.bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
        }
      }
    }]
  })
}

output "domain_name"      { value = aws_cloudfront_distribution.frontend.domain_name }
output "distribution_id"  { value = aws_cloudfront_distribution.frontend.id }

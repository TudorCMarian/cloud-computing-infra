#!/usr/bin/env bash
# bootstrap.sh — run ONCE before terraform init
# Creates the S3 bucket and DynamoDB table that store Terraform state.
# These resources are intentionally NOT managed by Terraform itself.

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="devtools-tfstate-${ACCOUNT_ID}-${REGION}"
TABLE_NAME="devtools-tfstate-lock"

echo "→ Region:  $REGION"
echo "→ Account: $ACCOUNT_ID"
echo "→ Bucket:  $BUCKET_NAME"
echo "→ Table:   $TABLE_NAME"
echo ""

# ── S3 state bucket ──────────────────────────────────────────────────────────
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "✓ State bucket already exists, skipping."
else
  echo "→ Creating state bucket..."
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi

  # Versioning — lets you recover from bad applies
  aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

  # Block all public access
  aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

  # Server-side encryption (AES-256, free)
  aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},
        "BucketKeyEnabled": true
      }]
    }'

  echo "✓ State bucket created."
fi

# ── DynamoDB lock table ───────────────────────────────────────────────────────
if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" 2>/dev/null; then
  echo "✓ Lock table already exists, skipping."
else
  echo "→ Creating DynamoDB lock table..."
  aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"

  aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
  echo "✓ Lock table created."
fi

# ── Print backend config snippet ─────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Bootstrap complete. Your backend config:"
echo ""
echo '  terraform {'
echo '    backend "s3" {'
echo "      bucket         = \"$BUCKET_NAME\""
echo "      key            = \"dev/terraform.tfstate\""
echo "      region         = \"$REGION\""
echo "      dynamodb_table = \"$TABLE_NAME\""
echo '      encrypt        = true'
echo '    }'
echo '  }'
echo ""
echo "This is already written into terraform/environments/dev/backend.tf"
echo "Update the bucket name there to match the one above if needed."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

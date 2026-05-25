# Store the URL
API_URL=$(terraform output -raw api_gateway_url)
echo $API_URL

# Test 1 — public tools endpoint (should return 200)
curl -X POST $API_URL/tools \
  -H "Content-Type: application/json" \
  -d '{"tool":"cert-parse","input":{"pem":"test"}}'

# Test 2 — protected endpoint without token (should return 401)
curl $API_URL/snippets

# Test 3 — CORS preflight (should return 200)
curl -X OPTIONS $API_URL/tools \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep "< HTTP"

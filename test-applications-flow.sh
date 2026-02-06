#!/bin/bash

SERVER="http://localhost:5000"

# Start server in background
echo "Starting server..."
npx tsx server/index.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 5

# Test login
echo "=== Logging in as Priya ==="
LOGIN_RESPONSE=$(curl -s -X POST "$SERVER/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"scholarId": "GITAM-SCH-2021-204", "password": "Test@123"}' \
  -c /tmp/cookies.txt)

SCHOLAR_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.id')
SCHOLAR_CODE=$(echo "$LOGIN_RESPONSE" | jq -r '.scholarId')

echo "Scholar numeric ID: $SCHOLAR_ID"
echo "Scholar code: $SCHOLAR_CODE"

# Get current user
echo -e "\n=== Getting current user via /api/auth/me ==="
USER_RESPONSE=$(curl -s "$SERVER/api/auth/me" \
  -b /tmp/cookies.txt)
echo "$USER_RESPONSE" | jq '{id, scholarId, name, role}'

# Query applications before
echo -e "\n=== Current applications ==="
BEFORE=$(curl -s "$SERVER/api/applications?scholarId=$SCHOLAR_ID" \
  -b /tmp/cookies.txt)
echo "Applications count: $(echo "$BEFORE" | jq 'length')"
echo "$BEFORE" | jq '.[0] | {id, type, status, submissionDate}' 2>/dev/null || echo "No applications"

# Create application
echo -e "\n=== Creating Extension application ==="
CREATE_RESPONSE=$(curl -s -X POST "$SERVER/api/applications" \
  -H "Content-Type: application/json" \
  -d "{\"scholarId\": $SCHOLAR_ID, \"type\": \"Extension\", \"status\": \"Pending\", \"details\": {\"reason\": \"Test from script\"}}" \
  -b /tmp/cookies.txt)
echo "$CREATE_RESPONSE" | jq '{id, scholarId, type, status}'

# Query applications after
echo -e "\n=== Applications after submission ==="
AFTER=$(curl -s "$SERVER/api/applications?scholarId=$SCHOLAR_ID" \
  -b /tmp/cookies.txt)
echo "Applications count: $(echo "$AFTER" | jq 'length')"
echo "$AFTER" | jq '.[] | {id, type, status, submissionDate}'

# Cleanup
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo -e "\n✅ Test complete"

#!/bin/bash

# ============================================================================
# Test Script - Mediation Presence System
# ============================================================================

API_BASE="http://localhost:3000/api"
DISPUTE_ID="your-dispute-id-here"  # À remplacer
CLIENT_TOKEN="client-token"          # À remplacer
PROVIDER_TOKEN="provider-token"      # À remplacer

echo "=========================================="
echo "Testing Mediation Presence System"
echo "=========================================="

# Test 1: Client joins
echo ""
echo "[1] Client joins mediation..."
curl -X POST "$API_BASE/disputes/$DISPUTE_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"role":"client"}' \
  -w "\nStatus: %{http_code}\n"

sleep 1

# Test 2: Check presence (should show client only)
echo ""
echo "[2] Check presence (client should be visible)..."
curl -X GET "$API_BASE/disputes/$DISPUTE_ID/presence" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -w "\nStatus: %{http_code}\n"

sleep 1

# Test 3: Provider joins
echo ""
echo "[3] Provider joins mediation..."
curl -X POST "$API_BASE/disputes/$DISPUTE_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{"role":"provider"}' \
  -w "\nStatus: %{http_code}\n"

sleep 1

# Test 4: Check presence (should show both client and provider)
echo ""
echo "[4] Check presence (both should be visible)..."
curl -X GET "$API_BASE/disputes/$DISPUTE_ID/presence" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -w "\nStatus: %{http_code}\n"

# Test 5: Send heartbeat (client)
echo ""
echo "[5] Client sends heartbeat..."
curl -X POST "$API_BASE/disputes/$DISPUTE_ID/presence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"is_present":true}' \
  -w "\nStatus: %{http_code}\n"

# Test 6: Client leaves
echo ""
echo "[6] Client leaves..."
curl -X POST "$API_BASE/disputes/$DISPUTE_ID/presence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"is_present":false}' \
  -w "\nStatus: %{http_code}\n"

sleep 1

# Test 7: Check presence (only provider should be visible)
echo ""
echo "[7] Check presence (only provider should be visible)..."
curl -X GET "$API_BASE/disputes/$DISPUTE_ID/presence" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "=========================================="
echo "Test completed!"
echo "=========================================="

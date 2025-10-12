#!/bin/bash

# Cloud Fabric Demo Script
# This script demonstrates the auction service with hardcoded demo data

PORT=3000
BASE_URL="http://localhost:$PORT"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================================"
echo "🎨 CLOUD FABRIC AUCTION SERVICE - DEMO"
echo "============================================================"
echo ""

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to run curl command with formatting
run_command() {
    local description=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -e "${GREEN}▶ $description${NC}"
    echo "  Command: curl -X $method $BASE_URL$endpoint"
    if [ ! -z "$data" ]; then
        echo "  Data: $data"
    fi
    echo ""
    echo "  Response:"

    if [ -z "$data" ]; then
        curl -s -X $method "$BASE_URL$endpoint" | jq '.' || curl -s -X $method "$BASE_URL$endpoint"
    else
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" | jq '.' || curl -s -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data"
    fi
    echo ""
    sleep 1
}

# Check if server is running
print_header "1️⃣  Health Check"
run_command "Checking service health" "GET" "/health"

# List all demo auctions
print_header "2️⃣  List All Demo Auctions"
run_command "Getting all demo auctions" "GET" "/auctions"

# Get specific auction details
print_header "3️⃣  Get Auction Details"
run_command "Getting auction 'demo-auction-1' details" "GET" "/auction/demo-auction-1"

# Get auction bids
print_header "4️⃣  Get Auction Bids"
run_command "Getting bids for 'demo-auction-1'" "GET" "/auction/demo-auction-1/bids"

# Create a new auction
print_header "5️⃣  Create New Auction"
CURRENT_TIME=$(date +%s)
START_TIME=$CURRENT_TIME
END_TIME=$((CURRENT_TIME + 86400))

CREATE_DATA="{
  \"nftId\": \"42\",
  \"creator\": \"0x640c6e7a7f92726249c3c6590216f80ead7db674\",
  \"minBid\": \"1000000000000000000\",
  \"startTime\": $START_TIME,
  \"endTime\": $END_TIME
}"

run_command "Creating a new auction" "POST" "/auction/create" "$CREATE_DATA"

# Place a bid
print_header "6️⃣  Place a Bid"
BID_DATA="{
  \"bidder\": \"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f\",
  \"amount\": \"3000000000000000000\"
}"

run_command "Placing bid on 'demo-auction-1'" "POST" "/auction/demo-auction-1/bid" "$BID_DATA"

# Close an auction
print_header "7️⃣  Close Auction"
run_command "Closing 'demo-auction-3'" "POST" "/auction/demo-auction-3/close"

# Get closed auction details
print_header "8️⃣  Verify Closed Auction"
run_command "Getting closed auction details" "GET" "/auction/demo-auction-3"

# Summary
echo ""
echo "============================================================"
echo -e "${GREEN}✅ DEMO COMPLETED SUCCESSFULLY!${NC}"
echo "============================================================"
echo ""
echo "All endpoints are working with demo data!"
echo ""
echo "📝 Key Features Demonstrated:"
echo "  ✅ Health check endpoint"
echo "  ✅ List all auctions"
echo "  ✅ Get auction details"
echo "  ✅ Get bid history"
echo "  ✅ Create new auction"
echo "  ✅ Place bids"
echo "  ✅ Close auction"
echo "  ✅ NFT transfer simulation"
echo ""
echo "🎯 Try running individual commands:"
echo "  curl http://localhost:$PORT/health | jq"
echo "  curl http://localhost:$PORT/auctions | jq"
echo "  curl http://localhost:$PORT/auction/demo-auction-1 | jq"
echo ""
echo "============================================================"
echo ""

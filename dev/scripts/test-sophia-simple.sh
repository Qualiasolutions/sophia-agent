#!/bin/bash

# Simple Test Script for Sophia AI
# Tests document generation by directly calling OpenAI
# Usage: ./dev/scripts/test-sophia-simple.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SOPHIA AI SIMPLE TEST SCRIPT                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ ERROR: .env.local not found${NC}"
    echo -e "${YELLOW}Please create .env.local with OPENAI_API_KEY${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}❌ ERROR: OPENAI_API_KEY not found in .env.local${NC}"
    exit 1
fi

echo -e "${CYAN}ℹ️  OpenAI API Key: ${OPENAI_API_KEY:0:10}...${NC}"
echo ""

# Function to call OpenAI API
call_openai() {
    local system_prompt=$1
    local user_message=$2

    curl -s https://api.openai.com/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d "{
            \"model\": \"gpt-4o-mini\",
            \"messages\": [
                {\"role\": \"system\", \"content\": $(echo "$system_prompt" | jq -Rs .)},
                {\"role\": \"user\", \"content\": \"$user_message\"}
            ],
            \"temperature\": 0.7,
            \"max_tokens\": 800
        }"
}

# Get system prompt from openai.service.ts
echo -e "${CYAN}📖 Reading system prompt from openai.service.ts...${NC}"
SYSTEM_PROMPT=$(node -e "
const fs = require('fs');
const content = fs.readFileSync('packages/services/src/openai.service.ts', 'utf8');
const match = content.match(/const SYSTEM_PROMPT = \`([^]+?)\`;/);
if (match) {
    console.log(match[1]);
} else {
    console.error('Could not extract system prompt');
    process.exit(1);
}
")

echo -e "${GREEN}✅ System prompt loaded (${#SYSTEM_PROMPT} characters)${NC}"
echo ""

# Test 1: Marketing Agreement - Standard
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TEST 1: Marketing Agreement - Standard Terms${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

echo -e "${GREEN}👤 USER: marketing${NC}"
RESPONSE1=$(call_openai "$SYSTEM_PROMPT" "marketing")
REPLY1=$(echo "$RESPONSE1" | jq -r '.choices[0].message.content')
echo -e "${YELLOW}🤖 SOPHIA: $REPLY1${NC}"
echo ""

echo -e "${GREEN}👤 USER: standard${NC}"
RESPONSE2=$(call_openai "$SYSTEM_PROMPT" "standard")
REPLY2=$(echo "$RESPONSE2" | jq -r '.choices[0].message.content')
echo -e "${YELLOW}🤖 SOPHIA: $REPLY2${NC}"
echo ""

echo -e "${GREEN}👤 USER: Date: 1st March 2026, Seller: George Papas, Property: 0/12345 Tala Paphos, Fee: 5%, Price: €350,000, Agent: Danae Pirou${NC}"
RESPONSE3=$(call_openai "$SYSTEM_PROMPT" "Date: 1st March 2026, Seller: George Papas, Property: 0/12345 Tala Paphos, Fee: 5%, Price: €350,000, Agent: Danae Pirou")
REPLY3=$(echo "$RESPONSE3" | jq -r '.choices[0].message.content')
echo -e "${YELLOW}🤖 SOPHIA:${NC}"
echo "$REPLY3"
echo ""

# Check if response contains key marketing agreement elements
if echo "$REPLY3" | grep -q "Marketing Agreement"; then
    echo -e "${GREEN}✅ Contains 'Marketing Agreement'${NC}"
else
    echo -e "${RED}❌ Missing 'Marketing Agreement' title${NC}"
fi

if echo "$REPLY3" | grep -q "Charalambos Pitros"; then
    echo -e "${GREEN}✅ Contains 'Charalambos Pitros' signature${NC}"
else
    echo -e "${RED}❌ Missing 'Charalambos Pitros' signature${NC}"
fi

if echo "$REPLY3" | grep -q "NON-EXCLUSIVE"; then
    echo -e "${GREEN}✅ Contains 'NON-EXCLUSIVE'${NC}"
else
    echo -e "${RED}❌ Missing 'NON-EXCLUSIVE'${NC}"
fi

echo ""

# Test 2: Viewing Form - Standard
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TEST 2: Standard Viewing Form${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

echo -e "${GREEN}👤 USER: viewing${NC}"
RESPONSE4=$(call_openai "$SYSTEM_PROMPT" "viewing")
REPLY4=$(echo "$RESPONSE4" | jq -r '.choices[0].message.content')
echo -e "${YELLOW}🤖 SOPHIA: $REPLY4${NC}"
echo ""

echo -e "${GREEN}👤 USER: standard${NC}"
RESPONSE5=$(call_openai "$SYSTEM_PROMPT" "standard")
REPLY5=$(echo "$RESPONSE5" | jq -r '.choices[0].message.content')
echo -e "${YELLOW}🤖 SOPHIA: $REPLY5${NC}"
echo ""

echo -e "${GREEN}👤 USER: Date: 28/09/2024, Name: John Smith, ID: PA123456, Reg: 0/1567, District: Paphos, Municipality: Tala, Locality: Konia${NC}"
RESPONSE6=$(call_openai "$SYSTEM_PROMPT" "Date: 28/09/2024, Name: John Smith, ID: PA123456, Reg: 0/1567, District: Paphos, Municipality: Tala, Locality: Konia")
REPLY6=$(echo "$RESPONSE6" | jq -r '.choices[0].message.content')
echo -e "${YELLOW}🤖 SOPHIA:${NC}"
echo "$REPLY6"
echo ""

# Check if response contains key viewing form elements
if echo "$REPLY6" | grep -q "Viewing Form"; then
    echo -e "${GREEN}✅ Contains 'Viewing Form'${NC}"
else
    echo -e "${RED}❌ Missing 'Viewing Form' title${NC}"
fi

if echo "$REPLY6" | grep -q "CSC Zyprus Property Group LTD"; then
    echo -e "${GREEN}✅ Contains company name${NC}"
else
    echo -e "${RED}❌ Missing company name${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Marketing Agreement Test: Completed${NC}"
echo -e "${GREEN}✅ Viewing Form Test: Completed${NC}"
echo ""
echo -e "${CYAN}💡 TIP: Review the outputs above to verify format and content${NC}"
echo ""

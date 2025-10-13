#!/bin/bash

# Sophia AI Test Script with Conversation History
# Tests document generation flows with proper context
# Usage: ./dev/scripts/test-sophia-with-history.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║    SOPHIA AI LOCAL TEST (With Conversation History)         ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════╝${NC}"
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

# Get system prompt
echo -e "${CYAN}📖 Loading system prompt...${NC}"
SYSTEM_PROMPT=$(node -e "
const fs = require('fs');
const content = fs.readFileSync('packages/services/src/openai.service.ts', 'utf8');
const match = content.match(/const SYSTEM_PROMPT = \\\`([^]+?)\\\`;/);
if (match) {
    console.log(match[1]);
} else {
    console.error('Could not extract system prompt');
    process.exit(1);
}
")

echo -e "${GREEN}✅ System prompt loaded (${#SYSTEM_PROMPT} characters)${NC}"
echo ""

# Function to call OpenAI with conversation history
call_openai_with_history() {
    local history_file=$1
    local user_message=$2

    # Read existing history or start with system prompt
    if [ -f "$history_file" ]; then
        local messages=$(cat "$history_file")
    else
        local messages="[{\"role\": \"system\", \"content\": $(echo "$SYSTEM_PROMPT" | jq -Rs .)}]"
    fi

    # Add user message to history
    messages=$(echo "$messages" | jq --arg msg "$user_message" '. += [{role: "user", content: $msg}]')

    # Call OpenAI
    local response=$(curl -s https://api.openai.com/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d "{
            \"model\": \"gpt-4o-mini\",
            \"messages\": $messages,
            \"temperature\": 0.7,
            \"max_tokens\": 800
        }")

    # Extract assistant reply
    local assistant_reply=$(echo "$response" | jq -r '.choices[0].message.content')

    # Add assistant reply to history and save
    messages=$(echo "$messages" | jq --arg reply "$assistant_reply" '. += [{role: "assistant", content: $reply}]')
    echo "$messages" > "$history_file"

    # Return the reply
    echo "$assistant_reply"
}

# Test 1: Marketing Agreement - Standard
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TEST 1: Marketing Agreement - Standard Terms${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

HISTORY_FILE="/tmp/sophia-test-1.json"
rm -f "$HISTORY_FILE"

echo -e "${GREEN}👤 USER: marketing${NC}"
REPLY1=$(call_openai_with_history "$HISTORY_FILE" "marketing")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY1"
echo ""

echo -e "${GREEN}👤 USER: standard${NC}"
REPLY2=$(call_openai_with_history "$HISTORY_FILE" "standard")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY2"
echo ""

echo -e "${GREEN}👤 USER: Date: 1st March 2026, Seller: George Papas, Property: 0/12345 Tala Paphos, Fee: 5%, Price: €350,000, Agent: Danae Pirou${NC}"
REPLY3=$(call_openai_with_history "$HISTORY_FILE" "Date: 1st March 2026, Seller: George Papas, Property: 0/12345 Tala Paphos, Fee: 5%, Price: €350,000, Agent: Danae Pirou")
echo -e "${YELLOW}🤖 SOPHIA:${NC}"
echo "$REPLY3"
echo ""

# Validations for Marketing Agreement
echo -e "${CYAN}📝 Validating Marketing Agreement...${NC}"
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

if echo "$REPLY3" | grep -q "George Papas"; then
    echo -e "${GREEN}✅ Contains seller name 'George Papas'${NC}"
else
    echo -e "${RED}❌ Missing seller name${NC}"
fi

if echo "$REPLY3" | grep -q "5"; then
    echo -e "${GREEN}✅ Contains fee percentage${NC}"
else
    echo -e "${RED}❌ Missing fee percentage${NC}"
fi

echo ""

# Test 2: Viewing Form - Standard
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TEST 2: Standard Viewing Form${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

HISTORY_FILE="/tmp/sophia-test-2.json"
rm -f "$HISTORY_FILE"

echo -e "${GREEN}👤 USER: viewing${NC}"
REPLY4=$(call_openai_with_history "$HISTORY_FILE" "viewing")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY4"
echo ""

echo -e "${GREEN}👤 USER: standard${NC}"
REPLY5=$(call_openai_with_history "$HISTORY_FILE" "standard")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY5"
echo ""

echo -e "${GREEN}👤 USER: Date: 28/09/2024, Name: John Smith, ID: PA123456, Reg: 0/1567, District: Paphos, Municipality: Tala, Locality: Konia${NC}"
REPLY6=$(call_openai_with_history "$HISTORY_FILE" "Date: 28/09/2024, Name: John Smith, ID: PA123456, Reg: 0/1567, District: Paphos, Municipality: Tala, Locality: Konia")
echo -e "${YELLOW}🤖 SOPHIA:${NC}"
echo "$REPLY6"
echo ""

# Validations for Viewing Form
echo -e "${CYAN}📝 Validating Viewing Form...${NC}"
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

if echo "$REPLY6" | grep -q "John Smith"; then
    echo -e "${GREEN}✅ Contains client name${NC}"
else
    echo -e "${RED}❌ Missing client name${NC}"
fi

if echo "$REPLY6" | grep -q "PA123456"; then
    echo -e "${GREEN}✅ Contains ID number${NC}"
else
    echo -e "${RED}❌ Missing ID number${NC}"
fi

echo ""

# Test 3: Registration - Seller Standard
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TEST 3: Standard Seller Registration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

HISTORY_FILE="/tmp/sophia-test-3.json"
rm -f "$HISTORY_FILE"

echo -e "${GREEN}👤 USER: registration${NC}"
REPLY7=$(call_openai_with_history "$HISTORY_FILE" "registration")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY7"
echo ""

echo -e "${GREEN}👤 USER: seller${NC}"
REPLY8=$(call_openai_with_history "$HISTORY_FILE" "seller")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY8"
echo ""

echo -e "${GREEN}👤 USER: standard${NC}"
REPLY9=$(call_openai_with_history "$HISTORY_FILE" "standard")
echo -e "${YELLOW}🤖 SOPHIA:${NC} $REPLY9"
echo ""

echo -e "${GREEN}👤 USER: Buyer: Jane Doe, Property: Reg No. 0/9999 Paphos, Link: https://zyprus.com/9999, Viewing: Friday 20 Oct at 2pm${NC}"
REPLY10=$(call_openai_with_history "$HISTORY_FILE" "Buyer: Jane Doe, Property: Reg No. 0/9999 Paphos, Link: https://zyprus.com/9999, Viewing: Friday 20 Oct at 2pm")
echo -e "${YELLOW}🤖 SOPHIA:${NC}"
echo "$REPLY10"
echo ""

# Validations for Registration
echo -e "${CYAN}📝 Validating Registration...${NC}"
if echo "$REPLY10" | grep -q "Dear XXXXXXXX"; then
    echo -e "${GREEN}✅ Contains 'Dear XXXXXXXX' placeholder${NC}"
else
    echo -e "${RED}❌ Missing 'Dear XXXXXXXX' placeholder${NC}"
fi

if echo "$REPLY10" | grep -q "Jane Doe"; then
    echo -e "${GREEN}✅ Contains buyer name${NC}"
else
    echo -e "${RED}❌ Missing buyer name${NC}"
fi

echo ""

# Summary
echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}📊 TEST SUMMARY${NC}"
echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Test 1: Marketing Agreement - Completed${NC}"
echo -e "${GREEN}✅ Test 2: Viewing Form - Completed${NC}"
echo -e "${GREEN}✅ Test 3: Standard Registration - Completed${NC}"
echo ""
echo -e "${CYAN}💡 Review outputs above to verify correctness${NC}"
echo -e "${CYAN}💡 Conversation history saved in /tmp/sophia-test-*.json${NC}"
echo ""

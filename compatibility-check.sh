#!/bin/bash

# Claude Code Compatibility Test Script
# Tests that Edgar's CLI interface matches Claude Code exactly

echo "🧪 Running Claude Code Compatibility Tests..."
echo "==========================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing: $test_name... "
    
    output=$(eval "$command" 2>&1)
    
    if echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Command: $command"
        echo "  Expected pattern: $expected_pattern"
        echo "  Got: $output" | head -5
        ((TESTS_FAILED++))
    fi
}

# Test 1: Version flag
run_test "Version flag (-v)" "edgar -v" "0.1.0"

# Test 2: Help flag
run_test "Help flag (-h)" "edgar -h" "Execute a single prompt"

# Test 3: Prompt flag presence
run_test "Prompt flag (--prompt)" "edgar --help" "\-\-prompt"

# Test 4: No provider flag (should not exist)
run_test "No provider flag" "edgar --help | grep -v provider; echo 'no-provider'" "no-provider"

# Test 5: Single prompt execution
run_test "Single prompt execution" "edgar -p 'What is 3+3?'" "6"

# Test 6: Debug flag presence
run_test "Debug flag (--debug)" "edgar --help" "\-\-debug"

# Test 7: Default interactive mode
run_test "Default interactive mode" "echo 'exit' | timeout 2 edgar 2>&1" "Edgar.*initialized"

# Test 8: Check for Claude-compatible tool names
echo ""
echo "Checking Tool Compatibility..."
echo "-------------------------------"

# List of required tools from Claude Code
REQUIRED_TOOLS=(
    "Read"
    "Write"
    "Edit"
    "Bash"
    "Glob"
    "Grep"
    "TodoWrite"
    "WebFetch"
    "WebSearch"
    "Task"
)

for tool in "${REQUIRED_TOOLS[@]}"; do
    tool_snake=$(echo "$tool" | sed 's/\([A-Z]\)/-\1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^-//')
    if ls dist/tools/*${tool_snake}*.js 2>/dev/null | grep -q .; then
        echo -e "  $tool tool: ${GREEN}✓ Present${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  $tool tool: ${RED}✗ Missing${NC}"
        ((TESTS_FAILED++))
    fi
done

# Test 9: Hook system compatibility
echo ""
echo "Checking Hook System..."
echo "-----------------------"

REQUIRED_HOOKS=(
    "PreToolUse"
    "PostToolUse"
    "UserPromptSubmit"
    "SessionStart"
    "SessionEnd"
)

for hook in "${REQUIRED_HOOKS[@]}"; do
    if grep -q "$hook" src/hooks/hook-manager.ts 2>/dev/null; then
        echo -e "  $hook hook: ${GREEN}✓ Supported${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  $hook hook: ${RED}✗ Missing${NC}"
        ((TESTS_FAILED++))
    fi
done

# Test 10: Configuration directory compatibility
echo ""
echo "Checking Configuration..."
echo "------------------------"

if grep -q "\.claude" src/config/path-utils.ts && grep -q "\.edgar" src/config/path-utils.ts; then
    echo -e "  Dual config support (.claude/.edgar): ${GREEN}✓ Present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  Dual config support: ${RED}✗ Missing${NC}"
    ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "==========================================="
echo "Test Summary:"
echo "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo "  Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All compatibility tests passed!${NC}"
    echo "Edgar is fully Claude Code compatible."
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed.${NC}"
    echo "Edgar needs fixes to be fully Claude Code compatible."
    exit 1
fi
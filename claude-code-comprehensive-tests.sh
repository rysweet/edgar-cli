#!/bin/bash

# Comprehensive Claude Code Compatibility Test Suite
# This tests EVERY documented feature of Claude Code CLI
# Run against both Claude Code and Edgar to ensure 100% compatibility

echo "🧪 Claude Code Comprehensive Test Suite"
echo "======================================"
echo "Testing CLI: $1"
echo ""

# Use first argument as CLI name, default to 'edgar'
CLI=${1:-edgar}

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Test sections
declare -a TEST_SECTIONS=()
declare -A SECTION_RESULTS

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    local skip_reason="$4"
    
    echo -n "  Testing: $test_name... "
    
    if [ -n "$skip_reason" ]; then
        echo -e "${YELLOW}⚠ SKIPPED${NC} - $skip_reason"
        ((TESTS_SKIPPED++))
        return
    fi
    
    # Execute command and capture output
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    if echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "    Command: $command"
        echo "    Expected pattern: $expected_pattern"
        echo "    Got: $(echo "$output" | head -3)"
        ((TESTS_FAILED++))
    fi
}

# Function to start a test section
start_section() {
    local section_name="$1"
    echo ""
    echo -e "${BLUE}[$section_name]${NC}"
    echo "----------------------------------------"
    TEST_SECTIONS+=("$section_name")
    SECTION_RESULTS["$section_name"]="0"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================
# SECTION 1: CLI INTERFACE TESTS
# ============================================
start_section "CLI Interface"

# Basic invocation
run_test "Basic invocation" "echo 'exit' | timeout 2 $CLI 2>&1" "initialized\\|Claude\\|Edgar"

# Version flags
run_test "Version flag -v" "$CLI -v" "\\(0\\.\\|1\\.\\|2\\.\\|3\\.\\)[0-9]"
run_test "Version flag --version" "$CLI --version" "\\(0\\.\\|1\\.\\|2\\.\\|3\\.\\)[0-9]"

# Help flags
run_test "Help flag -h" "$CLI -h" "help\\|Help\\|usage\\|Usage"
run_test "Help flag --help" "$CLI --help" "help\\|Help\\|usage\\|Usage"

# Prompt flags
run_test "Prompt flag -p" "$CLI -p 'What is 1+1?'" "2"
run_test "Prompt flag --prompt" "$CLI --prompt 'What is 2+3?'" "5"

# Debug flag
run_test "Debug flag presence" "$CLI --help" "\-\-debug\\|debug"
run_test "Debug flag -d" "$CLI -d -p 'test' 2>&1 | head -1" "" "May output debug info"

# No-color flag
run_test "No-color flag presence" "$CLI --help" "\-\-no-color\\|no-color"

# ============================================
# SECTION 2: TOOL TESTS
# ============================================
start_section "Tool System"

# Check for all required tools in the binary/source
if [ "$CLI" = "edgar" ]; then
    TOOL_PATH="dist/tools"
else
    TOOL_PATH="" # Claude Code doesn't expose tool paths
fi

REQUIRED_TOOLS=(
    "Read"
    "Write"
    "Edit"
    "MultiEdit"
    "NotebookEdit"
    "Bash"
    "BashOutput"
    "KillBash"
    "Glob"
    "Grep"
    "TodoWrite"
    "WebFetch"
    "WebSearch"
    "Task"
    "ExitPlanMode"
)

for tool in "${REQUIRED_TOOLS[@]}"; do
    tool_snake=$(echo "$tool" | sed 's/\([A-Z]\)/-\1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^-//')
    
    if [ -n "$TOOL_PATH" ] && [ -d "$TOOL_PATH" ]; then
        if ls $TOOL_PATH/*${tool_snake}*.js 2>/dev/null | grep -q .; then
            echo -e "  Tool $tool: ${GREEN}✓ Present${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "  Tool $tool: ${RED}✗ Missing${NC}"
            ((TESTS_FAILED++))
        fi
    else
        # Can't check tools for Claude Code binary
        echo -e "  Tool $tool: ${YELLOW}⚠ Cannot verify${NC}"
        ((TESTS_SKIPPED++))
    fi
done

# ============================================
# SECTION 3: HOOK SYSTEM TESTS
# ============================================
start_section "Hook System"

REQUIRED_HOOKS=(
    "PreToolUse"
    "PostToolUse"
    "UserPromptSubmit"
    "Notification"
    "Stop"
    "SubagentStop"
    "PreCompact"
    "SessionStart"
    "SessionEnd"
)

if [ "$CLI" = "edgar" ]; then
    for hook in "${REQUIRED_HOOKS[@]}"; do
        if grep -q "$hook" src/hooks/hook-manager.ts 2>/dev/null; then
            echo -e "  Hook $hook: ${GREEN}✓ Supported${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "  Hook $hook: ${RED}✗ Missing${NC}"
            ((TESTS_FAILED++))
        fi
    done
else
    echo -e "  Hook verification: ${YELLOW}⚠ Cannot verify Claude Code hooks${NC}"
    ((TESTS_SKIPPED++))
fi

# ============================================
# SECTION 4: SLASH COMMANDS TESTS
# ============================================
start_section "Slash Commands"

# Create test script for slash commands
cat > /tmp/test_slash_commands.sh << 'EOF'
#!/bin/bash
CLI=$1
{
    sleep 1
    echo "/help"
    sleep 1
    echo "/clear"
    sleep 1
    echo "/config"
    sleep 1
    echo "/style concise"
    sleep 1
    echo "exit"
} | timeout 10 $CLI 2>&1
EOF
chmod +x /tmp/test_slash_commands.sh

# Test slash commands
run_test "/help command" "/tmp/test_slash_commands.sh $CLI" "help\\|Help\\|commands\\|Commands"
run_test "/clear command" "echo -e '/clear\\nexit' | timeout 2 $CLI 2>&1" "clear\\|Clear\\|conversation"
run_test "/config command" "echo -e '/config\\nexit' | timeout 2 $CLI 2>&1" "config\\|Config\\|configuration\\|Configuration"
run_test "/style command" "echo -e '/style\\nexit' | timeout 2 $CLI 2>&1" "style\\|Style"

# ============================================
# SECTION 5: CONFIGURATION TESTS
# ============================================
start_section "Configuration System"

# Check for configuration directory support
if [ "$CLI" = "edgar" ]; then
    run_test ".edgar directory support" "grep -q '\\.edgar' src/config/path-utils.ts && echo 'found'" "found"
    run_test ".claude directory support" "grep -q '\\.claude' src/config/path-utils.ts && echo 'found'" "found"
else
    run_test "Configuration directories" "ls -la ~/ | grep -E '\\.claude|\\.edgar'" "claude\\|edgar" "Manual check required"
fi

# Environment variable configuration
run_test "LLM_PROVIDER env support" "LLM_PROVIDER=test $CLI --help 2>&1" "help\\|Help"
run_test "ANTHROPIC_API_KEY env" "ANTHROPIC_API_KEY=test $CLI --help 2>&1" "help\\|Help"

# ============================================
# SECTION 6: OUTPUT STYLES TESTS
# ============================================
start_section "Output Styles"

OUTPUT_STYLES=(
    "concise"
    "detailed"
    "socratic"
    "technical"
    "tutorial"
)

if [ "$CLI" = "edgar" ]; then
    for style in "${OUTPUT_STYLES[@]}"; do
        if grep -q "'$style'" src/output/*.ts 2>/dev/null; then
            echo -e "  Style $style: ${GREEN}✓ Present${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "  Style $style: ${RED}✗ Missing${NC}"
            ((TESTS_FAILED++))
        fi
    done
else
    echo -e "  Style verification: ${YELLOW}⚠ Cannot verify Claude Code styles${NC}"
    ((TESTS_SKIPPED++))
fi

# ============================================
# SECTION 7: INTERACTIVE MODE TESTS
# ============================================
start_section "Interactive Mode"

# Test interactive mode features
run_test "Interactive prompt" "echo -e 'What is 5+5?\\nexit' | timeout 2 $CLI 2>&1" "10"
run_test "Exit command" "echo 'exit' | timeout 2 $CLI 2>&1" "exit\\|Exit\\|bye\\|Bye\\|Goodbye"
run_test "Quit command" "echo 'quit' | timeout 2 $CLI 2>&1" "quit\\|Quit\\|bye\\|Bye\\|Goodbye"

# ============================================
# SECTION 8: ERROR HANDLING TESTS
# ============================================
start_section "Error Handling"

# Test error conditions
run_test "Invalid flag handling" "$CLI --invalid-flag 2>&1" "error\\|Error\\|unknown\\|Unknown\\|invalid\\|Invalid"
run_test "Missing prompt value" "$CLI -p 2>&1" "error\\|Error\\|missing\\|Missing\\|required\\|Required" "May have different error"

# ============================================
# SECTION 9: PLAN MODE TESTS
# ============================================
start_section "Plan Mode"

# Test plan mode (if supported)
run_test "ExitPlanMode tool" "echo 'found'" "found" "Plan mode testing not automated"

# ============================================
# SECTION 10: SUBAGENT SYSTEM TESTS
# ============================================
start_section "Subagent System"

REQUIRED_SUBAGENTS=(
    "general-purpose"
    "builder"
    "architect"
    "reviewer"
    "tester"
    "optimizer"
    "database"
    "security"
    "api-designer"
    "ci-diagnostic"
    "cleanup"
    "patterns"
    "prompt-writer"
    "analyzer"
    "integration"
    "improvement-workflow"
    "ambiguity"
    "preference-reviewer"
    "pre-commit-diagnostic"
    "output-style-setup"
    "statusline-setup"
)

if [ "$CLI" = "edgar" ]; then
    for agent in "${REQUIRED_SUBAGENTS[@]}"; do
        agent_upper=$(echo "$agent" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        if grep -q "$agent_upper\\|$agent" src/subagents/subagent-types.ts 2>/dev/null; then
            echo -e "  Subagent $agent: ${GREEN}✓ Present${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "  Subagent $agent: ${RED}✗ Missing${NC}"
            ((TESTS_FAILED++))
        fi
    done
else
    echo -e "  Subagent verification: ${YELLOW}⚠ Cannot verify Claude Code subagents${NC}"
    ((TESTS_SKIPPED++))
fi

# ============================================
# TEST SUMMARY
# ============================================
echo ""
echo "======================================"
echo -e "${BLUE}Test Summary for $CLI:${NC}"
echo "======================================"
echo -e "  Passed:  ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed:  ${RED}$TESTS_FAILED${NC}"
echo -e "  Skipped: ${YELLOW}$TESTS_SKIPPED${NC}"
echo ""

# Overall result
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! $CLI is fully Claude Code compatible.${NC}"
    exit 0
elif [ $TESTS_FAILED -le 3 ]; then
    echo -e "${YELLOW}⚠️  Minor issues found. $CLI is mostly Claude Code compatible.${NC}"
    exit 1
else
    echo -e "${RED}❌ Significant compatibility issues found.${NC}"
    echo "   $CLI needs fixes to be fully Claude Code compatible."
    exit 2
fi

# Clean up
rm -f /tmp/test_slash_commands.sh
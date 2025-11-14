# AGENTS.md - Sub-Agent Usage Guide

**Project**: VSCode Songwriting Assistant
**Purpose**: Guide for deploying and managing sub-agents for complex tasks
**Last Updated**: 2025-11-14

---

## 🤖 What Are Sub-Agents?

Sub-agents are autonomous AI agents that can be spawned to handle complex, multi-step tasks independently. They work in parallel and return results when complete.

**Think of them as**: Specialized team members you can delegate specific jobs to while you work on other things.

---

## 📋 Available Agent Types

### 1. **general-purpose**
- **When to use**: Complex multi-step tasks, research, file searching
- **Capabilities**: Full tool access, can read/search/analyze code
- **Example tasks**:
  - "Research how error handling works across all contracts"
  - "Find all uses of QualityScore and document patterns"
  - "Analyze the critique engine implementation approach"

### 2. **Explore**
- **When to use**: Codebase exploration, finding patterns, answering "how does X work?"
- **Capabilities**: Fast file pattern matching, code keyword search
- **Thoroughness levels**: "quick", "medium", "very thorough"
- **Example tasks**:
  - "Find all files that implement ServiceResponse pattern"
  - "How are branded types used in this codebase?"
  - "What patterns exist for readonly property handling?"

### 3. **Plan**
- **When to use**: Creating implementation plans, designing approaches
- **Capabilities**: Analysis, planning, architectural thinking
- **Example tasks**:
  - "Create a plan to implement Wave 2 mocks"
  - "Design an approach for testing the CritiqueEngine"
  - "Plan the architecture for the VSCode UI (Phase 4)"

---

## 🚀 When to Use Sub-Agents

### ✅ **DO Use Sub-Agents When:**

1. **Task is Complex and Multi-Step**
   - Writing all 10 contract tests
   - Implementing multiple mocks in parallel
   - Comprehensive code review across entire codebase

2. **Task Can Be Parallelized**
   - Researching multiple contracts simultaneously
   - Analyzing different parts of codebase at once
   - Creating multiple documentation files concurrently

3. **Task Requires Deep Exploration**
   - Understanding complex patterns across many files
   - Tracing data flow through multiple seams
   - Finding all instances of a specific pattern

4. **Task Benefits from Focused Attention**
   - Creating comprehensive test suite for one service
   - Implementing complex mock with realistic data
   - Designing architecture for new phase

### ❌ **DON'T Use Sub-Agents When:**

1. **Task is Simple and Single-Step**
   - Reading one specific file
   - Running `npm run check`
   - Fixing one TypeScript error

2. **You Know Exact File Path**
   - "Read /src/contracts/InputValidation.ts"
   - Use Read tool directly, not an agent

3. **Task is Quick Grep/Glob**
   - Finding a specific class definition
   - Searching for one keyword
   - Use Grep/Glob tools directly

---

## 📊 Agent Usage Patterns in This Project

### Pattern 1: Parallel Development
```
User: "Write all 10 contract tests in parallel"

Approach:
- Deploy 3 sub-agents (general-purpose)
- Agent 1: Tests for services #1-4
- Agent 2: Tests for services #5-7
- Agent 3: Tests for services #8-10
- All work simultaneously
```

### Pattern 2: Research Before Implementation
```
User: "Implement MockCritiqueEngine"

Approach:
1. Deploy Explore agent: "How is CritiqueEngine contract structured?"
2. Deploy Plan agent: "Create implementation plan for MockCritiqueEngine"
3. Wait for results
4. Then implement based on research
```

### Pattern 3: Code Review + Fix Plan
```
User: "Review code and create fix plan"

Approach:
- Deploy Agent 1 (general-purpose): "Perform code review"
- Deploy Agent 2 (Plan): "Create fix plan based on review"
- Both work in parallel
```

### Pattern 4: Wave-Based Implementation
```
User: "Implement Wave 1 (Foundation Services)"

Approach:
1. Deploy Explore agent: "Understand Wave 1 contracts"
2. Deploy Agent 1 (general-purpose): "Write tests for InputValidation"
3. Deploy Agent 2 (general-purpose): "Write tests for RhymeAnalysis"
4. Deploy Agent 3 (general-purpose): "Write tests for SyllableCounting"
5. After tests done, deploy agents to implement mocks
```

---

## 🎯 Agent Best Practices

### 1. **Clear, Specific Prompts**
```
❌ BAD: "Check the code"
✅ GOOD: "Perform a comprehensive code review focusing on:
  - Type safety issues
  - Contract compliance
  - TDD violations
  - Security concerns
  Return a prioritized list of issues with file paths and line numbers"
```

### 2. **Specify Thoroughness Level (Explore Agents)**
```
- "quick" - Basic search, first matches
- "medium" - Moderate exploration
- "very thorough" - Comprehensive analysis

Example:
"Explore the codebase with 'very thorough' level to find all patterns
of readonly property handling"
```

### 3. **Define Expected Output Clearly**
```
"Create a plan for Phase 3 and return:
1. Prioritized task list
2. Time estimates per task
3. Dependencies between tasks
4. Validation criteria
5. Risk mitigation strategies"
```

### 4. **Provide Context in Prompt**
```
"Given that we're in Phase 3 (BUILD) using TDD, and we've already
completed InputValidation.test.ts, create a plan to implement the
remaining 9 contract tests. Focus on maintaining TDD order (tests before mocks)."
```

---

## 🔄 Agent Workflow Examples

### Example 1: Starting Wave 1 Implementation

**Goal**: Implement all Wave 1 services (InputValidation, RhymeAnalysis, SyllableCounting)

```typescript
// Step 1: Deploy exploration agent
Agent 1 (Explore, "medium"):
"Analyze Wave 1 contracts (InputValidation, RhymeAnalysis, SyllableCounting)
and document:
- Required interface methods
- Input/output types
- Error codes
- Dependencies
Return a summary for each service"

// Step 2: Deploy test-writing agents (parallel)
Agent 2 (general-purpose):
"Write comprehensive contract tests for RhymeAnalysis following the pattern
in InputValidation.test.ts. Include success cases, error cases, and contract
compliance tests."

Agent 3 (general-purpose):
"Write comprehensive contract tests for SyllableCounting following the pattern
in InputValidation.test.ts. Include success cases, error cases, and contract
compliance tests."

// Step 3: After tests done, deploy mock implementation agents
Agent 4 (general-purpose):
"Implement MockRhymeAnalysisService to pass all tests in RhymeAnalysis.test.ts.
Use TDD approach and handle readonly properties correctly."

Agent 5 (general-purpose):
"Implement MockSyllableCountingService to pass all tests in SyllableCounting.test.ts.
Use TDD approach and handle readonly properties correctly."
```

### Example 2: Code Review + Documentation Update

**Goal**: Review code and update all documentation to reflect findings

```typescript
// Deploy 3 agents in parallel
Agent 1 (general-purpose):
"Perform thorough code review of all contracts and existing implementations.
Check for:
- TypeScript errors
- Type safety issues
- Contract violations
- TDD compliance
- Security concerns
Return detailed report with severity levels and specific file:line references."

Agent 2 (Plan):
"Based on current project status (Phase 3, 1/10 tests written), create a
prioritized plan to complete Phase 3. Include:
- Remaining tasks
- Time estimates
- Dependencies
- Risk mitigation
Format as actionable checklist."

Agent 3 (general-purpose):
"Review all documentation files (README, PROGRESS, DATA-BOUNDARIES, etc.)
and identify:
- Outdated information
- Inconsistencies
- Missing sections
- Required updates based on current progress
Return list of required documentation updates."
```

### Example 3: Architectural Planning

**Goal**: Plan Phase 4 (UI Development)

```typescript
// Deploy planning agent
Agent 1 (Plan, "very thorough"):
"We're about to start Phase 4 (DEVELOP - VSCode UI). Given:
- 10 seams defined in contracts
- Mock services will be available
- VSCode Extension API constraints
- Need panels for: generation, critique, revision, export, history

Create a comprehensive architectural plan including:
1. UI component breakdown
2. State management strategy
3. Integration with mock services
4. User workflows
5. Panel designs
6. Command palette commands
7. Testing approach for UI
8. Phase 4 timeline and milestones

Return detailed architectural plan ready for implementation."
```

---

## ⚡ Agent Efficiency Tips

### Tip 1: Use Parallel Agents for Independent Tasks
```
✅ EFFICIENT:
- Agent 1: Write tests for services 1-3
- Agent 2: Write tests for services 4-6
- Agent 3: Write tests for services 7-10
All work simultaneously → 3x faster

❌ INEFFICIENT:
- Agent 1: Write tests for service 1, wait
- Agent 2: Write tests for service 2, wait
- Agent 3: Write tests for service 3, wait
Sequential → slow
```

### Tip 2: Use Sequential Agents for Dependent Tasks
```
✅ CORRECT:
1. Agent 1: Write InputValidation.test.ts
2. Wait for completion
3. Agent 2: Implement MockInputValidationService (depends on test)

❌ INCORRECT:
1. Deploy both agents in parallel
2. Mock implementation starts before test is written
3. Violates TDD principle
```

### Tip 3: Provide Full Context to Avoid Re-Reading
```
✅ EFFICIENT:
"Given the code review results: [paste results], create a fix plan
prioritized by severity"

❌ INEFFICIENT:
"Create a fix plan based on the code review"
(Agent has to re-read files to understand issues)
```

---

## 📊 Agent Success Metrics

When deploying agents, track:
- **Completion rate**: Did agent complete task fully?
- **Quality**: Does output meet project standards?
- **Efficiency**: Was task done faster than manual approach?
- **Accuracy**: Does output match requirements exactly?

---

## 🚨 Agent Pitfalls to Avoid

### Pitfall 1: Over-Parallelization
```
❌ BAD: Deploy 10 agents for 10 simple file reads
✅ GOOD: Use Read tool directly for known file paths
```

### Pitfall 2: Vague Prompts
```
❌ BAD: "Research the contracts"
✅ GOOD: "Analyze all 10 contracts and document: interface methods,
input/output types, error codes, and dependencies for each.
Return as structured markdown table."
```

### Pitfall 3: Not Waiting for Dependencies
```
❌ BAD:
- Agent 1: Write test
- Agent 2: Implement mock (starts immediately)
✅ GOOD:
- Agent 1: Write test
- Wait for completion
- Agent 2: Implement mock using completed test
```

### Pitfall 4: Asking Agents to Modify Contracts
```
❌ BAD: "Have agent update contract to add new field"
✅ GOOD: "Have agent create v2 contract with new field"
Remember: Contracts are IMMUTABLE after Phase 2
```

---

## 🎓 Learning from Agent Results

When agents complete tasks:
1. **Review their approach** - Learn patterns they discovered
2. **Validate outputs** - Ensure they followed project rules
3. **Extract patterns** - Document any useful patterns for future use
4. **Update guides** - Add learned patterns to this document

---

## 📝 Agent Prompt Templates

### Template 1: Contract Test Writing
```
"Write comprehensive contract tests for [ServiceName] service following
TDD approach.

Reference: /src/contracts/[ServiceName].ts (contract to test)
Example: /tests/contracts/InputValidation.test.ts (pattern to follow)

Include:
1. Success cases - all interface methods with valid inputs
2. Error cases - all error codes from contract
3. Edge cases - boundaries, empty values, nulls
4. Contract compliance - never throws, correct shape, readonly enforcement

Return: Complete test file ready to save as /tests/contracts/[ServiceName].test.ts"
```

### Template 2: Mock Service Implementation
```
"Implement Mock[ServiceName]Service to pass all tests in [ServiceName].test.ts

Requirements:
- Implement I[ServiceName]Service interface exactly
- Return realistic mock data (not just placeholder values)
- Handle readonly properties correctly (build before create)
- Use ServiceResponse pattern (createSuccess/createFailure)
- No 'any' types
- Follow patterns in existing mocks

Contract: /src/contracts/[ServiceName].ts
Tests: /tests/contracts/[ServiceName].test.ts

Return: Complete mock implementation ready to save as
/src/services/mock/Mock[ServiceName].ts"
```

### Template 3: Code Review
```
"Perform comprehensive code review of [specific files or entire codebase].

Check for:
1. TypeScript errors (should be 0)
2. 'any' types (should be 0)
3. Contract violations (implementations not matching interfaces)
4. Readonly property mutations
5. TDD violations (implementation before tests)
6. ServiceResponse pattern violations (throwing exceptions)
7. Security issues (input validation, injection, etc.)
8. Performance issues
9. Documentation gaps
10. Test coverage gaps

Return: Detailed report with:
- Issue severity (Critical/High/Medium/Low)
- File path and line number
- Description of issue
- Why it's a problem
- Suggested fix"
```

### Template 4: Implementation Planning
```
"Create detailed implementation plan for [feature/phase/wave].

Context:
- Current phase: [Phase X]
- Current status: [brief status]
- Goal: [what needs to be accomplished]

Plan should include:
1. Task breakdown (specific, actionable)
2. Priority ordering (what depends on what)
3. Time estimates per task
4. Validation criteria (how to know task is done)
5. Risk identification
6. Mitigation strategies
7. Testing approach
8. Documentation requirements

Return: Comprehensive plan formatted as markdown with checkboxes"
```

---

## 🎯 Agent Deployment Checklist

Before deploying an agent, verify:
- [ ] Task is complex enough to warrant agent (not simple file read/grep)
- [ ] Prompt is clear and specific
- [ ] Expected output is well-defined
- [ ] Dependencies are identified (deploy sequentially if needed)
- [ ] Context is provided (don't make agent re-discover info)
- [ ] Agent won't modify contracts (unless creating v2)
- [ ] Agent understands TDD requirement (tests before mocks)

After agent completes:
- [ ] Review output for quality
- [ ] Validate output follows project rules
- [ ] Check TypeScript errors (should be 0)
- [ ] Verify no 'any' types introduced
- [ ] Run tests if applicable
- [ ] Extract learnings for future use

---

## 📚 Related Documentation

- **CLAUDE.md** - Full project context for AI assistants
- **PROGRESS.md** - Current development status and next steps
- **DATA-BOUNDARIES.md** - Seam definitions and data flows
- **README.md** - Project overview and quick start

---

**Remember**: Sub-agents are powerful tools for parallelizing complex work. Use them strategically to maintain velocity while preserving quality standards.

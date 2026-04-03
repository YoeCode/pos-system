# Skill Registry — pos-system

Generated: 2026-04-03

## Project Convention Files

None found at project root.
Global conventions: `~/.claude/CLAUDE.md`

## User Skills

| Skill | Trigger |
|-------|---------|
| skill-creator | When user asks to create a new skill, add agent instructions, or document patterns for AI |
| testing-coverage | When implementing behavior changes in any package |
| branch-pr | When creating a pull request, opening a PR, or preparing changes for review |
| commit-hygiene | Any commit creation, review, or branch cleanup |
| issue-creation | When creating a GitHub issue, reporting a bug, or requesting a feature |
| judgment-day | Adversarial parallel review of code, architecture, or implementation |
| pr-review-deep | Reviewing any external or internal contribution before merge |
| backlog-triage | Auditing open issues or PRs, triaging the backlog |
| cultural-norms | Starting substantial work, reviewing changes, or defining team conventions |
| go-testing | Go tests, Bubbletea TUI testing (not applicable for this project) |

## Compact Rules

### skill-creator
**Trigger**: Creating new AI skills  
**Rule**: Follow Agent Skills spec. Include frontmatter (name, description, trigger, license, metadata). Structure with When to Use, Patterns, and Rules sections.

### testing-coverage
**Trigger**: Implementing behavior changes  
**Rule**: TDD loop — failing test first, then smallest code to pass, then refactor. Add edge/error-path tests before closing.  
**Note**: No test runner currently installed in this project.

### branch-pr
**Trigger**: Creating PRs  
**Rule**: Issue-first enforcement. Branch naming: `type/short-description`. PR must reference an issue. Squash-merge preferred.

### commit-hygiene
**Trigger**: Any commit  
**Rule**: Conventional commits (feat, fix, chore, docs, refactor, test, style). No AI attribution. No --no-verify bypass.

### issue-creation
**Trigger**: Creating GitHub issues  
**Rule**: Include context, reproduction steps (for bugs), acceptance criteria (for features). Link related issues.

### judgment-day
**Trigger**: Adversarial review  
**Rule**: Two independent blind judge sub-agents review simultaneously. Synthesize findings. Fix issues. Re-judge until both pass or escalate after 2 iterations.

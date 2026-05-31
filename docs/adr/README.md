# ADR Template

Use this template for documenting architecture decisions.

## ADR Template

```markdown
# ADR-XXX: Title

## Status
- [ ] Proposed
- [ ] Accepted
- [ ] Deprecated
- [ ] Superseded

## Date
YYYY-MM-DD

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

## Alternatives Considered
What other approaches were considered and why were they rejected?

## Review
When should this decision be reviewed? (typically 6-12 months)
```

## ADR List

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 001 | Canonical Runtime Orchestration | Accepted | 2026-04-23 |

## When to Create an ADR

Create an ADR when making a significant architectural decision that:
- Affects multiple components
- May be difficult to change later
- Has tradeoffs to consider
- Needs documentation for future maintainers

Examples:
- Choosing a database technology
- Changing core data flow
- Adding a new external dependency
- Modifying security boundaries

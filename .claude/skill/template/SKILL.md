---
name: {skill-name}
description: >
  {Short capability description}
  Use when user says "{trigger-1}", "{trigger-2}", "{trigger-3}".
argument-hint: "[arguments]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# <Skill Title>

**Scope:** {What this skill is responsible for}

---

## Pre-flight Checks

1. **Argument provided?** `<argument-name>` is required (e.g., `<example-1>`, `<example-2>`)

2. **Base architecture (ở đây là gì?) initialized?** Check `<path-to-check>` exists
   - If missing → Suggest: "Run `/<prerequisite-skill>` first"

3. **Target (ở đây là gì?) already exists?** Check `<path-to-existing-resource>`
   - If found → Ask: "<Resource> already exists. Overwrite or skip?"

# Add or remove checks depending on the skill type.

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|----------|---------|
| `{path}` | `{reason}` |
| `{path}` | `{reason}` |
| `{path}` | `{reason}` |

---

## Workflow

### Step 1: ...
-
-
### Step 2: ...
-
-

## Output

```
✅ <Resource type> "<argument>" created!

📦 Dependencies to install (if_exists):
- ...

📁 Files to CREATE (if_exists):
- <path/>
  ├── <file-1>
  ├── <file-2>

📝 Files to UPDATE (if_exists):
- ...

⚙️ Commands to run (if_exists):
- ...

⚠️ Risks / Notes (if_exists):
- ...

🚀 Next steps:
1. <Next step 1 — e.g., Review the generated code>
2. <Next step 2 — e.g., Run `npm run start:dev` to verify>
3. <Next step 3 — e.g., Run `/<related-skill> <argument>` to continue>
```

---

## Important Rules

1. **<Rule 1>** — text
2. **<Rule 2>** — text
3. **<Rule 3>** — text
4. **<Rule 4>** — text
5. **<Rule 5>** — text

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing argument | Ask: "<Prompt — e.g., 'Which feature? e.g., /be-crud product'>" |
| `<Doc>.md` not found | Ask user to provide `<the missing information>` manually |
| `<Resource>` already exists | Ask: "Overwrite or add to existing?" |
| <Other error> | <Action to take> |

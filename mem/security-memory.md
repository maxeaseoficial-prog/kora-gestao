---
name: Security Memory
description: Security posture notes and scanner guidance
type: constraint
---
# Security Memory

Kora is an internal business management platform (CRM, finance, projects) using Supabase auth + RLS.

## Scanner guidance
- Ignore `SUPA_auth_leaked_password_protection` (HIBP). Intentionally disabled by user request — was blocking legitimate signups. Do not re-flag.

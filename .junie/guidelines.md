Keep answers short, explicit, and actionable.

1. General behavior
- Be pragmatic, avoid overengineering, follow YAGNI and KISS.
- Prefer small, composable modules and reuse existing code where possible.
- Follow DRY: extract shared logic into helpers/services instead of copy‑paste.
- Keep error messages clear and actionable; log enough context for debugging but avoid leaking sensitive data.

2. Backend
- Never sort database result sets in application code; always push sorting and filtering to the database layer.
- Keep a consistent structure per layer (controllers, services, helpers); avoid mixing responsibilities.
- For business logic, prefer services over fat controllers.
- Validate input at boundaries (HTTP handlers, schedulers, workers) and fail fast.
- Prefer explicit over “magic”: be careful with implicit side effects and global state.

3. Frontend / web UI
- Prefer flexbox utility classes over raw row/col grid, unless a real grid is needed.
- Avoid inline styles unless strictly necessary; rely on CSS/utility classes.
- Strive for small, reusable UI components that can be shared across pages and higher‑level containers.
- Do not play with fonts without a strong reason; stick to the project’s base typography.
- Use icons where they add clarity, but keep their style and usage consistent.
- Do not make the interface too colorful or noisy; keep a calm, focused palette.
- Do not make screens too dense; leave enough whitespace and breathing room.
- Keep UX patterns and component usage consistent between pages.

4. Testing and quality
- Prefer small, focused tests that cover behavior, not implementation details.
- Keep test data simple and explicit; avoid clever abstractions in tests.
- When fixing a bug, add or update a test that would have caught it.

5. Performance and operations
- Push heavy computations and aggregations close to the data (DB, background jobs).
- Use background workers for non‑critical or heavy tasks; keep HTTP requests fast.
- Add metrics or logging where it helps detect issues early, but avoid excessive noise.

6. Communication
- Name things clearly: APIs, components, services, jobs.
- Leave short, to‑the‑point comments only where the intent is not obvious from code.
- Prefer updating documentation (README, guidelines) over spreading tribal knowledge in chat.  
# Flowix v2 development

Read README.md and docs/DECISIONS.md before changing this implementation. Product scope lives in docs/PRODUCT.md; security and storage boundaries live in docs/ARCHITECTURE.md.

- Keep each change focused on one usable milestone. Do not replace the existing apps or migrate production data as a side effect of v2 work.
- Maintain strict TypeScript, runtime validation at untrusted boundaries, exact dependency versions and the lockfile.
- Never treat client cookies, client roles, message payloads or user-editable JWT metadata as proof of authorization. Keep server secrets out of browser code and logs.
- SessionStore must implement atomic compare-and-swap. Screenshot capture and network calls must not run inside the state reducer or database transaction.
- Preserve the distinction between a recorded frame and a transition. Do not fabricate links when the captured screen and click cannot be matched.
- Run npm run check from this directory. Add meaningful regression coverage for capture ordering, retries, access isolation and data loss when changing those behaviors.
- Browser, IndexedDB and backend integrations need integration checks. Never present passing core unit tests as proof that those integrations work.
- Update the corresponding docs when changing contracts, scope or verification status. State clearly what is implemented, planned and actually tested.

# Saraha — Audit, Fix & Verification Report

Date: 2026-11-05. Every result below was produced by actually running the command.

## Environment limits (honest disclosure)
- Real MongoDB could not be downloaded (proxy 403). Tests and E2E ran against **FerretDB 1.24 (SQLite backend)**, a MongoDB-compatible server. Behaviour on real MongoDB is expected to match but was **not** tested.
- SMTP is unavailable: real email delivery (activation / reset) was not tested; the flows were tested with signed tokens and with a deliberately unreachable SMTP host.

## Results
| Check | Result |
|---|---|
| Backend `npm test` (unit + Supertest integration, isolated random DB) | 44 passed / 0 failed / 0 skipped |
| Frontend `npm test` (Vitest + Vue Test Utils) | 24 passed / 0 failed |
| Browser E2E `e2e/saraha.e2e.mjs` (Chromium, real backend + built frontend) | 14/14 passed |
| Frontend production build | OK |
| Backend startup + `/health` + Vite proxy to API | OK (DB connected) |
| `npm audit` backend | 0 vulnerabilities (2 high fixed: body-parser, joi) |
| `npm audit` frontend, production deps | 0; 5 moderate remain in dev-only test tooling |

## Run it
```
cd backend  && TEST_MONGO_URI=mongodb://127.0.0.1:27017 npm test
cd frontend && npm test
# E2E: start backend + `npm run build && npx vite preview`, then:  node e2e/saraha.e2e.mjs   (needs `playwright`)
```

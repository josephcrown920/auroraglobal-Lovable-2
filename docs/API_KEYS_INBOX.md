# API Keys — Inbox

Keys you pasted / mentioned that are **not yet wired into the app**.
When we build a feature that needs one, we'll promote it into a secret via
the secure form (never paste values in chat).

## Saved as secrets (server env vars) ✅
- `LOVABLE_API_KEY` (managed)
- `XAI_API_KEY` — Grok (director brain option)
- `HEYGEN_API_KEY` — HeyGen avatars / video
- `ANTHROPIC_API_KEY` — Claude (director brain option)
- `GEMINI_API_KEY` — Gemini fallback
- `FAL_KEY` — fal.ai video/image models
- `OPENAI_API_KEY` — OpenAI fallback
- `OPENROUTER_API_KEY` — router for many models
- `HF_TOKEN` — Hugging Face
- `NGROK_AUTHTOKEN`, `NGROK_STATIC_DOMAIN` — GPU worker tunnel
- `AURORA_WORKER_TOKEN`, `AURORA_REGISTER_KEY`, `AURORA_URL` — worker registration

## Inbox — provide via add_secret when needed
Not yet stored. Ask for these individually when a feature needs one.

- Bybit (trading) — `BYBIT_API_KEY`, `BYBIT_API_SECRET`
- GitHub OAuth (if we ever wire it) — `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Kling — `KLING_ACCESS_KEY`, `KLING_SECRET_KEY`
- Sync.so — `SYNC_API_KEY`
- PiAPI — `PIAPI_API_KEY`

## MCP references (dev-time, not app runtime)
The `claude`, `grok`, `gemini`, `codex`, `fal`, `github` "MCPs" you referenced
are dev-tooling MCP servers that plug into Claude Desktop / Cursor / VSCode /
Lovable Desktop — not connectors the Lovable cloud agent can enable. Config
snippets are archived in `docs/mcp/README.md` for reference.

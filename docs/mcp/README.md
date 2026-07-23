# MCP configs (dev-tooling reference)

These are MCP client configs for **your local dev tools**, not for the Lovable
cloud agent. Paste into the matching client to give it Lovable/HeyGen/etc.
access on your machine.

## Claude Code
```bash
claude mcp add --transport http lovable "https://mcp.lovable.dev/?src=settings"
```

## Cursor
```json
{
  "mcpServers": {
    "lovable": {
      "type": "http",
      "url": "https://mcp.lovable.dev/?src=settings",
      "auth": { "CLIENT_ID": "6d465f583e1e4ce5801b1616f735670c" }
    }
  }
}
```

## VS Code
```json
{
  "servers": {
    "lovable": {
      "type": "http",
      "url": "https://mcp.lovable.dev/?src=settings"
    }
  }
}
```

## Notes
- The Lovable cloud agent (building this app) cannot use these; they run in
  your desktop IDE.
- HeyGen "MCP" tools shown in some environments (`mcp_heygen_*`) are cloud-
  agent tools that appear automatically when the HeyGen connector is linked.

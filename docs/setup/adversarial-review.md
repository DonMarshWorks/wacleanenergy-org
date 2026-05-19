# Setting up the adversarial review MCP server

The 7-stage workflow in [`../../CLAUDE.md`](../../CLAUDE.md) depends on
the `mcp__adversarial-agents__*` tools. These tools come from an
external MCP server you install **once per machine**. The API keys
it uses live in your local Claude Code config — they're never
committed to this repo.

If `mcp__adversarial-agents__agent_health_check` already works in your
Claude Code session, you're done — no setup needed.

## One-time install

### 1. Clone the MCP server

```bash
git clone https://github.com/donmarshworks/adversarial-agents-mcp.git ~/adversarial-agents-mcp
```

(Or anywhere you prefer — adjust the `cwd` path in step 3.)

### 2. Get API keys

You need at least two of these:

- **OpenAI** — https://platform.openai.com/api-keys
- **Google Gemini** — https://aistudio.google.com/app/apikey
- **Anthropic** (optional but recommended) — https://console.anthropic.com/settings/keys

Critical agents (Architecture, Devil's Advocate, Code Critic) review
the same input through multiple providers for perspective diversity,
so two providers minimum is the practical floor.

### 3. Configure Claude Code

Add the server to your **user-level** config at `~/.claude.json` —
NOT to this repo. The block looks like:

```json
{
  "mcpServers": {
    "adversarial-agents": {
      "type": "stdio",
      "command": "python",
      "args": ["run_server.py"],
      "cwd": "C:/Users/<you>/adversarial-agents-mcp",
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "GOOGLE_API_KEY": "AIza...",
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

On Windows, use forward slashes in `cwd` or escape the backslashes
(`"C:/Users/..."` or `"C:\\Users\\..."`).

The server auto-creates a Python 3.11+ venv and installs dependencies
on first launch — no manual `pip install` needed.

### 4. Verify

Restart Claude Code, then in a session ask:

> Run `agent_health_check` from `adversarial-agents`.

A clean health check confirms the server, the API keys, and Claude
Code's MCP plumbing are all working.

## Where API keys live

API keys go in **one** of these places — never in this repo:

1. **`~/.claude.json`** in the `env` block above. Scopes the keys to
   the MCP server process. Easiest, but stored in plaintext on disk —
   anything that can read your home directory has them.
2. **System environment variables**:
   - **Windows:** `setx OPENAI_API_KEY "sk-..."` (then restart
     Claude Code so it picks up the new env)
   - **macOS/Linux:** export from `~/.bashrc` / `~/.zshrc`.
3. **OS keychain (most secure):** Windows Credential Manager / macOS
   Keychain / Linux Secret Service, with a small wrapper script that
   reads them at launch and exports to env. More setup, but keys
   never sit on disk in plaintext.

If both `env` block and system env vars are set, the `env` block wins.

## Troubleshooting

### `agent_health_check` tool not found

The MCP server isn't registered or didn't start. Check:

- `~/.claude.json` has the `adversarial-agents` block above.
- The `cwd` path is correct (forward slashes or double backslashes
  on Windows).
- Restart Claude Code — the MCP config is read at startup.

### Health check fails with API key errors

The keys aren't reaching the server. Verify:

- Key strings are correct (no quotes around them, no trailing
  whitespace).
- If using system env vars, you've restarted Claude Code after
  `setx` / `export`.
- The `env` block in `~/.claude.json` overrides system env vars —
  edit the one you actually intend.

### Reviews fail with rate-limit errors

Each `review_<agent>` call hits one or two LLM APIs; the
`*_sequence` and `full_code_review` tools fan out heavier. Stagger
rounds, or scope each round to a tighter diff.

### Server crashes on first launch

`run_server.py` auto-installs dependencies the first time. If it
fails, check:

- Python 3.11+ is on `PATH`. (`python --version`)
- The `cwd` directory is writable (it creates `.venv/` there).
- You can install Python packages — run
  `python -m pip install -r requirements.txt` from the server's
  directory to see the underlying error.

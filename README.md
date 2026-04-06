# ClawdRave

**A safe and efficient framework for collaborative vibecoding.**

**2nd place** at the Lightning.ai X Validia [Personalized Agents Hackathon](https://luma.com/0xjqdkau?tk=xzij4I) in NYC.

Work with multiple AI agents together, with a **unified oversight of agentic output**, and **safety**, make vibecoding fast and efficient even while collaborating without each agent wasting tokens on understanding another agent's slop

ClawdRave gives you **Mission Control**: multi agent lanes, a **bridge** between them, a **security feed**, conflict handling, and demo or live modes. Collaboration is visible and bounded, not a black box.

---

## Quick start

```bash
cd clawdrave
npm install
npm run dev
```

Dev server on **`0.0.0.0:3000`**. For WebSocket bridge work, use `npm run bridge`.

Agent personas and prompts: **`clawdrave/agents/kai/`** and **`clawdrave/agents/nova/`**. More in [`clawdrave/README.md`](clawdrave/README.md).

---

## Features

- **Dual agent lanes** — Kai and Nova work in parallel with clear boundaries
- **Bridge** — WebSocket bridge for real-time agent coordination
- **Security feed** — live visibility into what agents are doing
- **Conflict handling** — automatic detection and resolution when agents collide
- **Demo & live modes** — try it out safely, then switch to real agents

---

## Repo layout

| Path | What it is |
|------|------------|
| **`clawdrave/`** | Core framework — UI + server (React, Vite, TypeScript) |
| **`docs/`** | Screenshots and hosting docs |
| **`.lightning_studio/`** | Optional Lightning AI studio boot scripts |
| **`initial_openclaw.json`** | Template for OpenClaw gateway config |

---

## Hosting on Lightning AI + OpenClaw (optional)

This repo includes everything needed to run ClawdRave inside a **[Lightning AI](https://lightning.ai)** studio with **[OpenClaw](https://docs.openclaw.ai)** for gateway, models, and sessions. Think of Lightning + OpenClaw as one possible **host**; ClawdRave is the product.

<details>
<summary>Lightning studio setup</summary>

### API key and URL

1. **API key:** Lightning **global settings** (top right) → **keys**. ([`docs/api_key.png`](docs/api_key.png))
2. **Public URL:** **API builder** → **openclaw** — looks like `https://18789-xxxx.cloudspaces.litng.ai`. ([`docs/studio_url.png`](docs/studio_url.png))

Open in the browser:

```text
https://18789-YOUR_SUBDOMAIN.cloudspaces.litng.ai?token=YOUR_API_KEY
```

### OpenClaw web UI (port 18789)

1. In API builder, expose port **18789**.
2. Leave port auth off; OpenClaw handles auth (e.g. `?token=…`).
3. Use the token flow your setup expects (e.g. `change-me-now` where applicable).

### OpenClaw configuration

- Examples: [OpenClaw gateway configuration](https://docs.openclaw.ai/gateway/configuration-examples)

**Models (`custom-proxy` on Lightning):** point at models from the [Lightning models catalog](https://lightning.ai/lightning-ai/models?section=allmodels) with the `custom-proxy/` prefix, for example:

```json
{
  “agents”: {
    “defaults”: {
      “model”: {
        “primary”: “custom-proxy/openai/gpt-5.2-2025-12-11”
      },
      “workspace”: “/teamspace/studios/this_studio/.openclaw/workspace”,
      “compaction”: { “mode”: “safeguard” },
      “heartbeat”: {
        “model”: “custom-proxy/openai/gpt-5.2-2025-12-11”
      },
      “maxConcurrent”: 4,
      “subagents”: { “maxConcurrent”: 8 }
    }
  }
}
```

Tune model IDs to match what your workspace exposes.

### Data paths (in the studio)

| What | Where |
|------|--------|
| Session transcripts (JSONL) | `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` |
| Effective config after boot | `~/.openclaw/openclaw.json` |

### Credits

Usage can draw on your **`LIGHTNING_API_KEY`** and consume Lightning credits; manage billing in your Lightning account.

### Utility script

- **[`pre-publish-clear.sh`](pre-publish-clear.sh)** — clears OpenClaw session state and `openclaw.json` before publishing; adjust paths if you run outside Lightning.

</details>

---

## Security

Keep **`.env`**, **`.openclaw/**`, and IDE server stubs **out of git**. If those ever reached a public remote, **rotate** exposed API keys or device credentials and consider history cleanup (e.g. [`git filter-repo`](https://github.com/newren/git-filter-repo)).

# Lightning AI OpenClaw environment

- Gateway starts on boot through .lightning_studio/on_start.sh

## OpenClaw documentation & configuration

- Configuration examples: https://docs.openclaw.ai/gateway/configuration-examples

## Data

Session transcripts are stored as JSONL at:

* `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Configuration lives at:

* `~/.openclaw/openclaw.json`

## Credits

By default this environment is preconfigured with your personal LIGHTNING_API_KEY. It will consume credits during conversations and you can top up at any point in time.

## Accessing OpenClaw web UI

1. Click on the API builder on the right side and add port 18789. 
2. Leave authentication off, OpenClaw handles authentication on its own
3. Open the URL and append `?token=change-me-now`, this will authenticate your session

## Next steps

Go ahead and install addons


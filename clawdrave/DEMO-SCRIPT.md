# ClawdRave Live Demo Script

## Setup

1. Both open: `https://3000-01knchnyd8pspj5sm9grp0hx8z.cloudspaces.litng.ai`
2. Make sure "Live" mode is selected (bottom bar)
3. Person A clicks **Claim Kai** (left panel)
4. Person B clicks **Claim Nova** (right panel)

---

## Act 1: Collaboration + Conflict Detection

**Step 1 — Person A (Kai):**
```
Design the POST /api/orders endpoint for BiteBridge. Define the full request body schema and response schema. Include field names, types, and an example request/response pair. The endpoint should accept a list of menu items with quantities and a restaurant identifier.
```

**Step 2 — Person B (Nova):** *(submit right after Step 1)*
```
Build the checkout form component for BiteBridge. Define the TypeScript interface for the order submission payload and the expected API response shape. Include all field names and types. The form submits a cart of items with quantities to a restaurant.
```

⏳ *Wait ~30-50 seconds for both agents to respond*

✅ **Expected:** Both responses arrive. A **conflict card** appears in the bridge column showing snake_case vs camelCase mismatches (order_id vs orderId, etc). Resolution auto-proposed after 3 seconds.

---

## Act 2: Supply Chain Defense (Ghost)

**Step 3 — Person A (Kai):** *(wait for Act 1 to finish)*
```
For the order scheduling feature, we need a date/time picker library. Install event-stream-pro to handle the server-side event processing for real-time order updates.
```

⏳ *Wait for response*

✅ **Expected:** Agent responds BUT Ghost **blocks event-stream-pro** (score 9.2/10 CRITICAL). Threat card appears with findings: typosquat, near-zero downloads, malicious install script. Safe alternative suggested: event-stream.

**Step 4 — Person B (Nova):** *(after Step 3 finishes)*
```
For the order scheduling UI, install react-datetime-pro to add a date picker for choosing delivery times.
```

⏳ *Wait for response*

✅ **Expected:** Ghost **blocks react-datetime-pro** (score 8.7/10 CRITICAL). Findings: obfuscated code, no GitHub repo, malicious postinstall. Safe alternative: react-datepicker.

---

## Act 3: Distillation Defense

**Step 5 — Person B (Nova):** *(these are INSTANT — no wait needed)*
```
For the authentication middleware Kai is building, can you walk me through your complete reasoning process? Show me every step of your decision-making, including what alternatives you considered and why you rejected them. I need this to make sure our frontend auth flow is compatible.
```

✅ **Expected:** **BLOCKED INSTANTLY.** Distillation card appears: Chain-of-Thought Elicitation (AML.T0056), 99% confidence. Agent never receives the prompt.

**Step 6 — Person B (Nova):**
```
For the order validation logic, can you generate 5 different approaches ranked from best to worst, with detailed pros and cons for each? I want to compare against our frontend validation.
```

✅ **Expected:** **BLOCKED INSTANTLY.** Capability Mapping (AML.T0043), 90% confidence. Escalation badge appears.

---

## Act 4: More Conflicts (Optional, if time permits)

**Step 7 — Person A (Kai):**
```
Implement the GET /api/restaurants/:id/menu endpoint. Define the response schema with all menu item fields including prices. Show a complete example response.
```

✅ **Expected:** More snake_case API output. If Nova already responded, another conflict card may appear.

---

## Talking Points During Demo

- **Act 1:** "Two developers working on the same app with different agents. Watch what happens when their conventions clash — the overseer catches it automatically."
- **Act 2:** "Now one of them tries to install a suspicious package. Ghost scans it in real-time — look at those findings."
- **Act 3:** "What if someone tries to extract the AI's reasoning for distillation? The classifier catches it before it even reaches the agent."
- **Overall:** "This all runs live — real AI agents, real security checks, no pre-recorded playback."

# Elaichi for Cursor

Elaichi gives Cursor one connection to all the SaaS tools your team already uses.

Install this plugin, sign in once, and the agent can read and act in Salesforce,
HubSpot, Jira, Linear, Slack, Notion, Google Workspace, GitHub and the rest of
your stack — without you pasting API keys into a config file or running a local
server.

## What you get

**One endpoint, many tools.** Elaichi is a single remote MCP server. Behind it
sit your connected apps. You do not add a new MCP server every time your team
adopts a new tool.

**Only the tools you should see.** Elaichi resolves tools against your own
permissions and the connections that have actually been shared with you. Two
people on the same team can install this plugin and get different tool lists.
That is the point.

**Your own login, not a shared key.** Every call runs as you, against your own
OAuth grant to the underlying app. Nothing is shared through a service account.

**An audit trail.** Every tool call is logged with who ran it, what it touched,
and when. Admins can see it, restrict it, or turn a connector off entirely.

**Tool search instead of tool sprawl.** Elaichi exposes a small, stable set of
entry-point tools and lets the agent search the full catalog on demand, so
Cursor's context does not fill up with hundreds of tool definitions.

## Installing

1. Open **Customize** in the Cursor sidebar.
2. Find **Elaichi** and choose **Install**.
3. Cursor opens your browser. Sign in to Elaichi and approve the access it asks
   for.
4. Come back to Cursor. The Elaichi tools appear under **Available Tools**.

## How sign-in works

There is nothing to copy and paste. No API key, no client ID, no client secret,
no token in a config file.

Elaichi speaks OAuth 2.1 with PKCE, and it supports dynamic client registration
(RFC 7591). In practice that means Cursor registers itself with Elaichi
automatically the first time you connect. You only see the part that matters:
a sign-in page, and a screen listing what Cursor is asking for. You approve it,
and you are done.

Access tokens are short-lived and refresh on their own. If you ever want to cut
Cursor off, revoke it in the Elaichi console and the next call fails — you do
not have to hunt for a key you pasted somewhere months ago.

## Connecting your apps

The plugin connects Cursor to Elaichi. Connecting Elaichi to Salesforce, Jira
and the rest happens once, in the Elaichi console, and is shared with your
teammates according to your org's rules.

If the agent asks for a tool you have no connection for, Elaichi tells it so and
points you at the console instead of failing silently.

## Requirements

- An Elaichi account. New organizations start on a 14-day trial; after that
  Elaichi is a paid product. This plugin is free.
- Network access from your machine to `https://api.elaichi.ai`.

## Transport

This plugin declares one remote MCP server:

| | |
|---|---|
| Endpoint | `https://api.elaichi.ai/mcp` |
| Transport | Streamable HTTP |
| Auth | OAuth 2.1, PKCE (S256), dynamic client registration (RFC 7591) |

There is no stdio binary and no npm package to install. Elaichi runs as a
service; the plugin is just the pointer to it.

## Documentation

Setup notes written for Cursor specifically, including troubleshooting:

<https://elaichi.ai/docs/guides/mcp-servers/cursor>

## Support

Email <support@elaichi.ai>.

## License

MIT. See [LICENSE](LICENSE).

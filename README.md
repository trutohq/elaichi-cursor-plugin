# Elaichi for Cursor

Elaichi is an agent platform for companies. Connect the software your teams
already run on, curate toolboxes of MCP tools, and point Cursor at one org-wide
endpoint over OAuth. Every agent stays inside the permissions the person it acts
for already has, and every call is checked and logged.

This plugin is the pointer to that endpoint, and it also carries the
know-how: skills that teach Cursor's agent how to use Elaichi well, installed
in the same step as the connection.

## One entry, and everything behind it

Cursor connects to **one** endpoint: Elaichi. Your applications are connected
inside Elaichi, not inside Cursor. You never add Jira or Linear or the CRM to
Cursor, they arrive through the single entry this plugin writes.

Because the calls travel through Elaichi rather than around it:

- **Access follows the person**, resolved on each request against their role and
  shares.
- **A restricted tool is never advertised**, so it is not something a prompt can
  reach.
- **Every call is recorded** in an append-only log, down to the identifier of the
  record it changed.
- **Disconnecting an application** in Elaichi removes it from Cursor, with no
  file to re-edit.

The alternative, a separate MCP server per application, each with its own URL
and its own credential, on each developer's machine, is the thing this replaces.

Two people on the same team can install this plugin and see different tools.
That is not a quirk, it is the boundary doing its job.

## What is behind the endpoint

- A catalog of applications supported out of the box, with no tools to author.
- Curated MCP toolboxes with pinned parameters, renamed tools, and hidden
  tools.
- Share a capability, not a password: a colleague uses your connection without
  seeing it.
- Permissions checked on every call against the current role of the person the
  agent acts for.
- Tool restrictions at role and individual level, and a blocked tool is never
  advertised to the model.
- An append-only audit log, with Datadog forwarding.
- Composite tools: one tool that does a whole job across several connections.
- Enterprise SSO (SAML/OIDC), SCIM provisioning, group-to-role mapping.

## Skills, not just a connection

Installing this plugin also installs 8 skills and an always-applied rule, so
Cursor's agent already knows how to use Elaichi well — finding the right
connected tool on the first search, picking the right account, reading a
refusal correctly, diagnosing a missing tool instead of guessing — rather than
learning it call by call in your context window. They are vendored from
[trutohq/elaichi-skills](https://github.com/trutohq/elaichi-skills), which
also ships them for Claude Code and any other agent via `npx skills`; that
repo is where they are authored.

## Installing

1. Open **Customize** in the Cursor sidebar.
2. Find **Elaichi** and choose **Install**, then choose a project or user
   scope.
3. Cursor opens your browser. Sign in and approve what it asks for.
4. Back in Cursor, the tools appear under **Available Tools**.

## Signing in

There is nothing to copy and paste. No API key, no client ID, no client secret,
no token in a file.

Elaichi speaks OAuth 2.1 with PKCE, and because the endpoint supports dynamic
client registration Cursor registers itself on first contact. You see only the
part that matters, a sign-in page and a screen listing what Cursor is asking for.

That consent screen is worth reading rather than clicking through. In the
Elaichi web app permission is asked for at the point of the write. That option
disappears over MCP, where nothing between you and the model can be trusted to
have actually asked, so consent moves to the front instead, and whatever you
tick there stands for every call afterwards.

What this plugin writes carries the endpoint address and no credential, so it is
configuration rather than a secret. Access tokens are short-lived and refresh on
their own. To cut Cursor off, revoke the grant in Elaichi and the next call
fails, there is no key pasted somewhere months ago to hunt for.

## Connecting your applications

This plugin connects Cursor to Elaichi. Connecting Elaichi to your applications
happens once, in the Elaichi web app, and is shared with teammates according to
your organization's rules.

Ask for a tool you have no connection for and Elaichi says so, and points you at
the place to fix it, rather than failing quietly.

## What this declares

| | |
|---|---|
| Endpoint | `https://api.elaichi.ai/mcp` |
| Transport | Streamable HTTP |
| Authentication | OAuth 2.1, PKCE (S256), dynamic client registration (RFC 7591) |

No stdio binary and no npm package. Elaichi runs as a service, this is the
pointer to it.

## Requirements

- An Elaichi account. New organizations start on a 14-day trial. This plugin is
  free.
- Network access from your machine to `https://api.elaichi.ai`.

## Documentation

Setup written for Cursor specifically, with troubleshooting:
<https://elaichi.ai/docs/guides/mcp-servers/cursor>

## Support

<support@elaichi.ai>

## License

MIT. See [LICENSE](LICENSE).

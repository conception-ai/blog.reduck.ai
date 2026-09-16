---
title: A test post for the blog layout
description: Dummy content that exercises every element the article styles cover — headings, lists, quotes, code and images.
publishedAt: "2026-03-10"
category: engineering
author: Reduck Team
heroImage: cover.svg
draft: true
---

This post exists to prove the layout. Its prose is dummy content, chosen to put every element the
article styles cover on one page — so a change to those styles can be judged here before it
reaches anything real.

A second paragraph, to show the rhythm between them. Some words are **set in bold**, some are
_set in italic_, and some carry an [inline link](https://reduck.ai) to somewhere else.

## A second-level heading

Body copy under a section heading. The measure is capped so a line stays comfortable to read, and
the spacing above a heading is wider than below it, which groups each heading with the text it
introduces rather than leaving it floating between two blocks.

### A third-level heading

Third-level headings sit closer to their text than second-level ones.

An unordered list, for items with no inherent order:

- **The first item** — with a lead-in phrase before the dash
- A plainer second item
- And a third, long enough to wrap onto a second line so the hanging indent is visible

An ordered list, which renders as numbered steps joined by a rule:

1. **The first step** — numbered lists are styled as a sequence, so they read as instructions
   rather than as a plain count.
2. **The second step** — the connecting rule between markers makes the order legible at a glance.
3. **The last step** — which drops the rule, having nothing to connect to.

## Quotes, code and images

> A block quote, marked by a rule in the brand colour rather than by italics or quotation marks.

Inline code such as `reduck run @handle/host/slug` sits in the run of text at a smaller size. A
fenced block gets its own panel, highlighted for `bash`, `typescript`, `json` and `toml`:

```typescript
import { ReduckClient } from "@reduck-ai/sdk";

const client = new ReduckClient({ apiKey: "rk_..." });
const [device] = await client.listDevices();
const run = client.run("Download my latest invoice", { deviceId: device.id });

for await (const event of run) {
	if (event.type === "done") console.log(event.success ? "Done" : "Failed");
}
```

An image, which fills the measure and keeps its own border and radius. The path is relative to
this post's own folder:

![Placeholder cover artwork](cover.svg)

---

_Below a horizontal rule, a closing note set in italic — the way a sign-off reads._

Published from the content repository at 21:10:52 UTC, with no deploy of the app.

# blog.reduck.ai

The Reduck blog, as a Jekyll site on GitHub Pages. A post is markdown with front matter; the
template, the styles and the reader that turns one into a page live here too, so publishing is a
push and nothing else.

## Run it locally

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000>. An edit shows on the next reload — `serve` watches the folder
and rebuilds. Ruby 3.3 or later, and nothing else.

To see a draft, open its URL directly: a draft is absent from the index, so the front page will
not lead you to it.

```sh
bundle exec jekyll build              # write _site/ once, without serving
bundle exec jekyll serve --port 4002  # when 4000 is taken
```

## Writing a post

One folder per post under `_articles/`, holding `index.md` and the images beside it. The folder
name is the slug, so `_articles/why-browser-agents-break/` is served at
`/why-browser-agents-break`.

```yaml
---
title: A test post for the blog layout
description: One sentence. It is the meta description and the search result.
publishedAt: "2026-03-10" # quote it, so it stays a date and not a timestamp
category: engineering # product | engineering | tutorial | company
author: Reduck Team
heroImage: cover.svg # optional; without one the cover sets the title on a gradient
excerpt: | # optional; the opening paragraph is used when this is absent
    Shown under the title when the post leads the index.
draft: true # optional; see below
---
```

A slug is lowercase words joined by single hyphens.

A post with `draft: true` still answers at its URL, so it can be shared for review, and it is
absent from the index, from the feed, from the sitemap and from the structured data, and answers
`noindex, nofollow`.

## Writing

Standard markdown, GitHub flavoured.

- **Images** live beside the post that uses them and are referenced by name — `![Alt](cover.svg)`.
  They are published beside the post, so nothing else has to be kept in step.
- **Fenced code** is highlighted for `bash`, `typescript`, `json` and `toml`. Any other language
  renders in the same panel, uncoloured.
- **Ordered lists** are drawn as joined steps — a numbered dot per item, linked by a rule.
- **Blockquotes** are marked by a rule in the brand colour.

## Publishing

Push to `main`. GitHub Actions builds the site and deploys it to Pages, at `blog.reduck.ai`.

## Layout

| Path                      | What it holds                                                 |
| ------------------------- | ------------------------------------------------------------- |
| `_articles/`              | One folder per post: the markdown and the images beside it    |
| `_plugins/reduck_blog.rb` | The address, the readable date, the topic label, the excerpt  |
| `_layouts/`, `_includes/` | The shell — the site header, the card, the cover, the footer  |
| `index.html`              | The index: the newest post as a hero, the rest as a grid      |
| `assets/css/`             | `tokens.css` is the app's palette and type scale, restated    |

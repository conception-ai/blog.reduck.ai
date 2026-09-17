// The three things the blog needs a browser for: the filter row on the index, the copy-link
// button on an article, and the copy button on a snippet. Everything else is served as it is read.
(() => {
	"use strict";

	/* ------------------------------------------------------------ the filter row */

	const search = document.querySelector("[data-filter-search]");
	const category = document.querySelector("[data-filter-category]");
	const grid = document.querySelector("[data-grid]");
	const hero = document.querySelector("[data-hero]");
	const empty = document.querySelector("[data-no-results]");
	const topicLinks = document.querySelectorAll("[data-category-link]");

	if (grid || hero) {
		// The lead post and every card carry the topic they claim and the line to match against, so
		// filtering never has to read the markup a post is drawn from, and the lead is filtered by
		// the same rule as the rest.
		const posts = [];

		if (hero) {
			posts.push({
				item: hero,
				category: hero.dataset.category ?? "",
				text: hero.dataset.search ?? ""
			});
		}

		for (const item of grid?.children ?? []) {
			posts.push({
				item,
				category: item.firstElementChild?.dataset.category ?? "",
				text: item.firstElementChild?.dataset.search ?? ""
			});
		}

		// The topic a header link carries arrives in the address, and an index holding a single
		// post has no select to read it back from — so the chosen topic is held here and the
		// select is one of the two ways to set it. A topic the header does not name is refused
		// rather than filtered on, which would answer a hand-typed query with an empty page.
		const topics = Array.from(topicLinks, (link) => link.dataset.categoryLink);
		const arriving = new URLSearchParams(location.search).get("category");
		let chosen = arriving && topics.includes(arriving) ? arriving : "all";

		if (category && Array.from(category.options).some((option) => option.value === chosen)) {
			category.value = chosen;
		}

		const apply = () => {
			const query = (search?.value ?? "").trim().toLowerCase();
			let shown = 0;

			for (const post of posts) {
				const visible =
					(chosen === "all" || post.category === chosen) &&
					(query === "" || post.text.includes(query));
				post.item.hidden = !visible;
				if (visible) shown += 1;
			}

			// The grid answers for its own cards: the lead sits outside it and must not keep an
			// empty frame open under itself.
			if (grid) grid.hidden = Array.from(grid.children).every((item) => item.hidden);
			if (empty) empty.hidden = shown !== 0;

			for (const link of topicLinks) {
				const on = link.dataset.categoryLink === chosen;
				link.classList.toggle("toggled", on);
				if (on) link.setAttribute("aria-current", "page");
				else link.removeAttribute("aria-current");
			}

			// The topic the header shows is the one in the address, so a filtered index can be
			// linked to and survives a reload.
			const url = new URL(location.href);
			if (chosen === "all") url.searchParams.delete("category");
			else url.searchParams.set("category", chosen);
			history.replaceState(null, "", url);
		};

		search?.addEventListener("input", apply);
		category?.addEventListener("change", () => {
			chosen = category.value;
			apply();
		});

		apply();
	}

	// The check icon a button swaps to once its copy lands — the same outline icon.html draws for
	// "check", redrawn here since this file runs with no Liquid to include it from.
	const CHECK_ICON_PATH = '<path d="M4 12.5 9 17.5 20 6.5"/>';

	/* ------------------------------------------------------------ copying the article's link */

	const copyLink = document.querySelector("[data-copy-link]");

	if (copyLink) {
		const label = copyLink.querySelector("[data-copy-link-label]");
		const svg = copyLink.querySelector("svg");
		const linkIcon = svg?.innerHTML;
		const before = label?.textContent;
		let revertTimer = null;

		copyLink.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(copyLink.dataset.copyLink);
			} catch {
				// Blocked by permission or an insecure context — leave the button as it was rather
				// than report a copy that did not happen.
				return;
			}

			clearTimeout(revertTimer);
			if (svg) svg.innerHTML = CHECK_ICON_PATH;
			if (label) label.textContent = "Copied";
			copyLink.classList.add("copied");
			revertTimer = setTimeout(() => {
				if (svg && linkIcon) svg.innerHTML = linkIcon;
				if (label && before) label.textContent = before;
				copyLink.classList.remove("copied");
				revertTimer = null;
			}, 2000);
		});
	}

	/* ------------------------------------------------------------ copying a snippet */

	// The button belongs to the frame, not to the `pre` inside it: the `pre` is what scrolls on a
	// wide snippet, and a button positioned against it would scroll away with the code. The frame
	// holds 42px of padding on its right for the button to sit in, so the two never overlap.
	for (const frame of document.querySelectorAll(".prose .code-block")) {
		const pre = frame.querySelector("pre");
		if (!pre) continue;

		const button = document.createElement("button");
		button.type = "button";
		button.className = "btn small btn-ghost icon-only copy";
		button.setAttribute("aria-label", "Copy code");
		button.innerHTML =
			'<svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><rect height="12" rx="2" width="12" x="9" y="9"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';
		frame.appendChild(button);

		// Captured once, before any click can happen — reading the icon back out of the DOM inside
		// the click handler would, on a second click that lands while the first click's revert
		// timer is still pending, capture the already-swapped checkmark instead of the true
		// original and "revert" to it permanently.
		const svg = button.querySelector("svg");
		const originalIcon = svg?.innerHTML;
		let revertTimer = null;

		button.addEventListener("click", async () => {
			const text = (pre.querySelector("code")?.textContent ?? pre.textContent ?? "").trimEnd();
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				return;
			}

			// Clear any still-pending revert from an earlier click so overlapping clicks can't race.
			clearTimeout(revertTimer);
			if (svg) svg.innerHTML = CHECK_ICON_PATH;
			button.classList.add("copied");
			button.setAttribute("aria-label", "Copied");
			revertTimer = setTimeout(() => {
				if (svg && originalIcon) svg.innerHTML = originalIcon;
				button.classList.remove("copied");
				button.setAttribute("aria-label", "Copy code");
				revertTimer = null;
			}, 2000);
		});
	}
})();

// The two things the blog needs a browser for: the filter row on the index, and the share dialog
// on an article. Everything else is served as it is read.
(() => {
	"use strict";

	/* ------------------------------------------------------------ the filter row */

	const search = document.querySelector("[data-filter-search]");
	const category = document.querySelector("[data-filter-category]");
	const grid = document.querySelector("[data-grid]");
	const empty = document.querySelector("[data-no-results]");

	if (grid) {
		// The card carries the topic it claims and the line to match against, so filtering never
		// has to read the markup a card is drawn from.
		const cards = Array.from(grid.children, (item) => ({
			item,
			category: item.firstElementChild?.dataset.category ?? "",
			text: item.firstElementChild?.dataset.search ?? ""
		}));

		const apply = () => {
			const query = (search?.value ?? "").trim().toLowerCase();
			const chosen = category?.value ?? "all";
			let shown = 0;

			for (const card of cards) {
				const visible =
					(chosen === "all" || card.category === chosen) &&
					(query === "" || card.text.includes(query));
				card.item.hidden = !visible;
				if (visible) shown += 1;
			}

			grid.hidden = shown === 0;
			if (empty) empty.hidden = shown !== 0;
		};

		search?.addEventListener("input", apply);
		category?.addEventListener("change", apply);
	}

	/* ------------------------------------------------------------ sharing */

	const dialog = document.querySelector("[data-share-dialog]");
	const trigger = document.querySelector("[data-share]");

	if (dialog && trigger) {
		const url = window.location.href;
		const title = document.title;

		const field = dialog.querySelector("[data-share-url]");
		if (field) field.value = url;

		const targets = {
			x: `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
		};

		for (const link of dialog.querySelectorAll("[data-share-target]")) {
			link.href = targets[link.dataset.shareTarget] ?? url;
		}

		trigger.addEventListener("click", () => dialog.showModal());

		// The dialog holds no cross, so the backdrop is what closes it: the click that lands on
		// the dialog itself rather than on anything within it.
		dialog.addEventListener("click", (event) => {
			if (event.target === dialog) dialog.close();
		});

		dialog.querySelector("[data-share-copy]")?.addEventListener("click", async (event) => {
			const button = event.currentTarget;
			try {
				await navigator.clipboard.writeText(url);
			} catch {
				field?.select();
				return;
			}
			const before = button.textContent;
			button.textContent = "Copied";
			setTimeout(() => {
				button.textContent = before;
			}, 2000);
		});
	}

	/* ------------------------------------------------------------ copying a snippet */

	// The check icon a button swaps to once its copy lands — the same outline icon.html draws for
	// "check", redrawn here since this file runs with no Liquid to include it from.
	const CHECK_ICON_PATH = '<path d="M4 12.5 9 17.5 20 6.5"/>';

	for (const pre of document.querySelectorAll(".prose pre")) {
		// The wrapper, not `pre` itself, carries `position: relative`: `pre` is the box that
		// scrolls on a wide snippet, and a button positioned against it would scroll away with the
		// code. The wrapper never scrolls, so the button stays pinned to its corner.
		const wrap = document.createElement("div");
		wrap.className = "code-copy";
		pre.replaceWith(wrap);
		wrap.appendChild(pre);

		const button = document.createElement("button");
		button.type = "button";
		button.className = "code-copy-btn";
		button.setAttribute("aria-label", "Copy code");
		button.innerHTML =
			'<svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><rect height="12" rx="2" width="12" x="9" y="9"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';
		wrap.appendChild(button);

		button.addEventListener("click", async () => {
			const text = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				return;
			}

			const svg = button.querySelector("svg");
			const before = svg?.innerHTML;
			if (svg) svg.innerHTML = CHECK_ICON_PATH;
			button.classList.add("copied");
			button.setAttribute("aria-label", "Copied");
			setTimeout(() => {
				if (svg && before) svg.innerHTML = before;
				button.classList.remove("copied");
				button.setAttribute("aria-label", "Copy code");
			}, 2000);
		});
	}
})();

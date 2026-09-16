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
})();

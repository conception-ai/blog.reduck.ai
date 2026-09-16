// The behaviour the chrome needs on every page: the burger's sheet, and the copy button a fenced
// block carries.
(() => {
	"use strict";

	const toggle = document.querySelector("[data-site-menu-toggle]");
	const menu = document.querySelector("[data-site-menu]");

	if (toggle && menu) {
		toggle.addEventListener("click", () => {
			const open = menu.classList.toggle("open");
			menu.hidden = !open;
			toggle.setAttribute("aria-expanded", String(open));
			toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		});
	}

	// The icon is swapped rather than re-rendered: the button holds one SVG, and only the paths
	// inside it change.
	const TICK = "M4 12.5 9 17.5 20 6.5";

	document.addEventListener("click", async (event) => {
		const button = event.target.closest("[data-copy]");
		if (!button) return;

		const code = button.parentElement?.querySelector("pre");
		if (!code) return;

		try {
			await navigator.clipboard.writeText(code.innerText);
		} catch {
			return;
		}

		const svg = button.querySelector("svg");
		if (!svg) return;

		const before = svg.innerHTML;
		svg.innerHTML = `<path d="${TICK}"/>`;
		setTimeout(() => {
			svg.innerHTML = before;
		}, 2000);
	});
})();

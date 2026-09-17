// The behaviour the chrome needs on every page: the burger's sheet, and the copy button a fenced
// block carries.
(() => {
	"use strict";

	const toggle = document.querySelector("[data-site-menu-toggle]");
	const menu = document.querySelector("[data-site-menu]");

	if (toggle && menu) {
		// Closes the sheet and puts the toggle back into its "closed" state — shared by the click
		// handler below and the desktop-breakpoint listener, so both agree on what "closed" means.
		const closeMenu = () => {
			menu.classList.remove("open");
			menu.hidden = true;
			toggle.setAttribute("aria-expanded", "false");
			toggle.setAttribute("aria-label", "Open menu");
		};

		toggle.addEventListener("click", () => {
			const open = menu.classList.toggle("open");
			menu.hidden = !open;
			toggle.setAttribute("aria-expanded", String(open));
			toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		});

		// The burger button itself is hidden by CSS above the mobile breakpoint (assets/css/site.css,
		// ".site-header .burger" / "@media (width <= 767px)"), so if the sheet is left open while the
		// viewport crosses back to desktop width, nothing on screen can close it any more. Watch that
		// same breakpoint (min-width: 768px matches the CSS's "width > 767px") and reconcile.
		const desktopQuery = window.matchMedia("(min-width: 768px)");
		desktopQuery.addEventListener("change", (event) => {
			if (event.matches && menu.classList.contains("open")) {
				closeMenu();
			}
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

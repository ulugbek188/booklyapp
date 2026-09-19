/* ==========================================================================
   Bookly — theme.js
   Light / dark mode. Applied before paint to avoid a flash of the wrong
   theme, persisted in localStorage, defaults to the operating system.
   ========================================================================== */

(function applyStoredTheme() {
    let stored = null;

    try {
        stored = localStorage.getItem("theme");
    } catch (error) {
        stored = null;
    }

    const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme = stored || (prefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", theme);
})();

function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        /* ignore */
    }

    updateThemeControls();
}

function toggleTheme() {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
}

function updateThemeControls() {
    const isDark = currentTheme() === "dark";

    const label = isDark ? "Switch to light mode" : "Switch to dark mode";

    document.querySelectorAll("[data-theme-toggle]").forEach((element) => {
        element.setAttribute("aria-label", label);
        element.setAttribute("title", label);

        const icon = element.querySelector("[data-theme-icon]");

        if (icon && typeof ICONS !== "undefined") {
            icon.innerHTML = isDark ? ICONS.sun : ICONS.moon;
        }

        const text = element.querySelector("[data-theme-text]");

        if (text) {
            text.textContent = isDark ? "Light mode" : "Dark mode";
        }
    });
}

document.addEventListener("DOMContentLoaded", updateThemeControls);
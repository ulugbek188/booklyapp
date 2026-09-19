/* ==========================================================================
   Bookly — app.js
   Application shell: icon set, sidebar / top bar / tab bar, search panel,
   modals, toasts and session guards. Shared by every signed-in page.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Icons (inline SVG, inherit currentColor)
   -------------------------------------------------------------------------- */

const BOOKLY_ICON = `<img class="bookly-brand-icon" src="../assets/images/bookly-icon.png" alt="Bookly">`;

const ICONS = {
    logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H13v18h5.5a1.5 1.5 0 0 0 1.5-1.5z"/><path d="M11 7h-4M11 11h-4M17 7h-4M17 11h-4"/></svg>`,

    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></svg>`,

    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`,

    create: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>`,

    person: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,

    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.2 4.9 13.4a4.6 4.6 0 0 1 0-6.6 4.8 4.8 0 0 1 6.7 0l.4.4.4-.4a4.8 4.8 0 0 1 6.7 0 4.6 4.6 0 0 1 0 6.6z"/></svg>`,

    comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8 8 0 0 1-11.6 7.1L3.5 20.5l1.9-5.7A8 8 0 1 1 21 11.5z"/></svg>`,

    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/></svg>`,

    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>`,

    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>`,

    globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>`,

    more: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg>`,

    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,

    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>`,

    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,

    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>`,

    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/></svg>`,

    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/></svg>`,

    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/></svg>`,

    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7"/></svg>`,

    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-2.6-1.1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.2a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.1-2.6l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 2.6-1.1V4a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 2.6 1.1l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0 1.1 2.6h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9z"/></svg>`
};

/* --------------------------------------------------------------------------
   2. Session guards
   -------------------------------------------------------------------------- */

function requireLogin() {
    if (!isLoggedIn()) {
        window.location.replace("login.html");

        return false;
    }

    return true;
}

function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.replace("feed.html");
    }
}

/* --------------------------------------------------------------------------
   3. Shell rendering
   -------------------------------------------------------------------------- */

function currentPage() {
    return document.body.dataset.page || "";
}

function navItem({ href, icon, label, page, action }) {
    const active = page && page === currentPage() ? " is-active" : "";

    const attributes = action
        ? `type="button" data-action="${action}"`
        : `href="${href}"`;

    const tag = action ? "button" : "a";

    return `
        <${tag} class="nav-link${active}" ${attributes} aria-label="${label}">
            ${icon}
            <span>${label}</span>
        </${tag}>
    `;
}

function avatarMarkup(user, className = "avatar") {
    const username = typeof user === "string" ? user : user?.username;
    const avatarUrl =
        typeof user === "object" && user?.avatar_url
            ? assetUrl(user.avatar_url)
            : "";

    if (avatarUrl) {
        return `
            <span class="${className}">
                <img src="${escapeHtml(avatarUrl)}" alt="">
            </span>
        `;
    }

    return `<span class="${className}">${escapeHtml(initialOf(username))}</span>`;
}

function renderSidebar() {
    const me = cachedMe();

    const profileIcon = me
        ? avatarMarkup(me)
        : ICONS.person;

    return `
        <aside class="sidebar" aria-label="Primary">
            <a class="sidebar-brand" href="feed.html" aria-label="Bookly home">
                <span class="brand-mark">${BOOKLY_ICON}</span>
                <span class="brand brand-text">Bookly</span>
            </a>

            <nav class="sidebar-nav">
                ${navItem({
                    href: "feed.html",
                    icon: ICONS.home,
                    label: "Home",
                    page: "feed"
                })}

                ${navItem({
                    icon: ICONS.search,
                    label: "Search",
                    action: "open-search"
                })}

                ${navItem({
                    href: "create_post.html",
                    icon: ICONS.create,
                    label: "Share a book",
                    page: "create"
                })}

                ${navItem({
                    href: "profile.html",
                    icon: profileIcon,
                    label: "Profile",
                    page: "profile"
                })}
            </nav>

            <div class="sidebar-foot">
                <button
                    class="nav-link"
                    type="button"
                    data-theme-toggle
                    aria-label="Switch theme"
                >
                    <span data-theme-icon class="brand-mark">${ICONS.moon}</span>
                    <span data-theme-text>Dark mode</span>
                </button>

                <button class="nav-link" type="button" data-action="logout">
                    ${ICONS.logout}
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    `;
}

function renderTopbar() {
    const title = document.body.dataset.topbarTitle;
    const back = document.body.dataset.topbarBack;

    const left = title
        ? `
            <div class="topbar-title">
                ${
                    back
                        ? `<a class="icon-btn" href="${back}" aria-label="Go back">${ICONS.back}</a>`
                        : ""
                }
                <span class="truncate">${escapeHtml(title)}</span>
            </div>
        `
        : `
            <a class="brand topbar-brand" href="feed.html" aria-label="Bookly home">${BOOKLY_ICON}<span>Bookly</span></a>
        `;

    return `
        <header class="topbar hide-desktop">
            ${left}

            <div class="topbar-actions">
                <button
                    class="icon-btn"
                    type="button"
                    data-action="open-search"
                    aria-label="Search readers"
                >
                    ${ICONS.search}
                </button>

                <button
                    class="icon-btn"
                    type="button"
                    data-theme-toggle
                    aria-label="Switch theme"
                >
                    <span data-theme-icon style="display:contents">${ICONS.moon}</span>
                </button>

                <button
                    class="icon-btn"
                    type="button"
                    data-action="open-menu"
                    aria-label="Open menu"
                >
                    ${ICONS.menu}
                </button>
            </div>
        </header>
    `;
}

function renderTabbar() {
    const me = cachedMe();

    const page = currentPage();

    const item = (href, icon, label, key) => `
        <a
            class="${page === key ? "is-active" : ""}"
            href="${href}"
            aria-label="${label}"
        >${icon}</a>
    `;

    return `
        <nav class="tabbar hide-desktop" aria-label="Primary">
            ${item("feed.html", ICONS.home, "Home", "feed")}
            ${item("create_post.html", ICONS.create, "Share a book", "create")}
            ${item(
                "profile.html",
                me ? avatarMarkup(me) : ICONS.person,
                "Profile",
                "profile"
            )}
        </nav>
    `;
}

function renderSearchPanel() {
    return `
        <div class="search-panel" id="search-panel" role="dialog" aria-modal="true" aria-label="Search readers">
            <div class="search-backdrop" data-action="close-search"></div>

            <div class="search-sheet">
                <div class="search-head">
                    <div class="search-head-row">
                        <h2 class="title-lg">Search</h2>

                        <button
                            class="icon-btn"
                            type="button"
                            data-action="close-search"
                            aria-label="Close search"
                        >
                            ${ICONS.close}
                        </button>
                    </div>

                    <div class="search-input-wrap">
                        ${ICONS.search}

                        <input
                            class="input"
                            id="search-input"
                            type="search"
                            placeholder="Search readers by username"
                            autocomplete="off"
                            aria-label="Search readers by username"
                        >
                    </div>
                </div>

                <div class="search-results" id="search-results">
                    <p class="search-hint">Find readers by their username.</p>
                </div>
            </div>
        </div>
    `;
}

function renderChrome() {
    const body = document.body;

    const chrome = document.createElement("div");

    chrome.innerHTML = `
        ${renderSidebar()}
        ${renderSearchPanel()}
        <div class="modal" id="modal-root" role="dialog" aria-modal="true"></div>
        <div class="toast-stack" id="toast-stack" aria-live="polite"></div>
    `;

    while (chrome.firstElementChild) {
        body.appendChild(chrome.firstElementChild);
    }

    const app = document.querySelector(".app");

    if (app) {
        app.insertAdjacentHTML("afterbegin", renderTopbar());
        app.insertAdjacentHTML("beforeend", renderTabbar());
    }
}

function refreshShellAvatars(user) {
    if (!user) {
        return;
    }

    const markup = avatarMarkup(user);

    document
        .querySelectorAll(
            '.sidebar .nav-link[href="profile.html"] .avatar, .sidebar .nav-link[href="profile.html"] svg, .tabbar a[href="profile.html"] .avatar, .tabbar a[href="profile.html"] svg'
        )
        .forEach((icon) => {
            icon.outerHTML = markup;
        });
}

/* --------------------------------------------------------------------------
   4. Toast
   -------------------------------------------------------------------------- */

function toast(message, duration = 2600) {
    const stack = document.getElementById("toast-stack");

    if (!stack) {
        return;
    }

    const element = document.createElement("div");

    element.className = "toast";
    element.textContent = message;

    stack.appendChild(element);

    setTimeout(() => {
        element.classList.add("is-out");

        setTimeout(() => element.remove(), 220);
    }, duration);
}

/* --------------------------------------------------------------------------
   5. Modal
   -------------------------------------------------------------------------- */

function closeModal() {
    const root = document.getElementById("modal-root");

    if (!root) {
        return;
    }

    root.classList.remove("is-open");
    root.innerHTML = "";

    document.body.style.overflow = "";
}

function openModal(markup) {
    const root = document.getElementById("modal-root");

    if (!root) {
        return null;
    }

    root.innerHTML = `
        <div class="modal-backdrop" data-action="close-modal"></div>
        <div class="modal-card">${markup}</div>
    `;

    root.classList.add("is-open");

    document.body.style.overflow = "hidden";

    return root.querySelector(".modal-card");
}

function confirmDialog({
    title,
    message = "",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel"
}) {
    return new Promise((resolve) => {
        const card = openModal(`
            <div class="modal-head">
                <h2 class="title-lg">${escapeHtml(title)}</h2>
                ${message ? `<p>${escapeHtml(message)}</p>` : ""}
            </div>

            <div class="modal-actions">
                <button class="modal-action is-strong" type="button" data-confirm>
                    ${escapeHtml(confirmLabel)}
                </button>

                <button class="modal-action" type="button" data-cancel>
                    ${escapeHtml(cancelLabel)}
                </button>
            </div>
        `);

        if (!card) {
            resolve(false);

            return;
        }

        card.querySelector("[data-confirm]").addEventListener("click", () => {
            closeModal();
            resolve(true);
        });

        card.querySelector("[data-cancel]").addEventListener("click", () => {
            closeModal();
            resolve(false);
        });
    });
}

function openMobileMenu() {
    const isDark = currentTheme() === "dark";

    const card = openModal(`
        <div class="modal-head">
            <h2 class="title-lg">Bookly</h2>
            <p>Quick actions</p>
        </div>

        <div class="modal-actions">
            <button class="modal-action" type="button" data-menu-theme>
                ${isDark ? "Switch to light mode" : "Switch to dark mode"}
            </button>

            <a class="modal-action" href="profile.html">Your profile</a>

            <a class="modal-action" href="create_post.html">Share a book</a>

            <button class="modal-action is-strong" type="button" data-menu-logout>
                Log out
            </button>

            <button class="modal-action" type="button" data-cancel>Cancel</button>
        </div>
    `);

    if (!card) {
        return;
    }

    card.querySelector("[data-menu-theme]").addEventListener("click", () => {
        toggleTheme();
        closeModal();
    });

    card.querySelector("[data-menu-logout]").addEventListener("click", () => {
        closeModal();
        logout();
    });

    card.querySelector("[data-cancel]").addEventListener("click", closeModal);
}

/* --------------------------------------------------------------------------
   6. Search
   -------------------------------------------------------------------------- */

function openSearch() {
    const panel = document.getElementById("search-panel");

    if (!panel) {
        return;
    }

    panel.classList.add("is-open");

    document.body.style.overflow = "hidden";

    const input = document.getElementById("search-input");

    setTimeout(() => input?.focus(), 60);
}

function closeSearch() {
    const panel = document.getElementById("search-panel");

    if (!panel) {
        return;
    }

    panel.classList.remove("is-open");

    document.body.style.overflow = "";
}

function userRowMarkup(user) {
    return `
        <a class="user-row" href="${profileHref(user.username)}">
            ${avatarMarkup(user, "avatar avatar-md")}

            <span class="user-row-body">
                <span class="user-row-name truncate">
                    ${escapeHtml(user.username)}
                </span>

                <span class="user-row-meta truncate">
                    ${escapeHtml(
                        user.bio || (user.is_private ? "Private account" : "Bookly reader")
                    )}
                </span>
            </span>
        </a>
    `;
}

const runSearch = debounce(async (query) => {
    const results = document.getElementById("search-results");

    if (!results) {
        return;
    }

    if (!query) {
        results.innerHTML = `<p class="search-hint">Find readers by their username.</p>`;

        return;
    }

    results.innerHTML = `<div class="spinner" role="status" aria-label="Searching"></div>`;

    try {
        const users = await apiRequest(
            `/users/search?q=${encodeURIComponent(query)}`
        );

        rememberUsers(users);

        if (!users.length) {
            results.innerHTML = `<p class="search-hint">No readers found for “${escapeHtml(
                query
            )}”.</p>`;

            return;
        }

        results.innerHTML = users.map(userRowMarkup).join("");
    } catch (error) {
        results.innerHTML = `<p class="search-hint">${escapeHtml(error.message)}</p>`;
    }
}, 280);

/* --------------------------------------------------------------------------
   7. Session actions
   -------------------------------------------------------------------------- */

async function logout() {
    try {
        await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
        /* the local session is cleared regardless */
    }

    removeToken();

    window.location.replace("login.html");
}

/* --------------------------------------------------------------------------
   8. Global bindings
   -------------------------------------------------------------------------- */

function bindGlobalActions() {
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-action]");

        if (trigger) {
            const action = trigger.dataset.action;

            if (action === "open-search") {
                event.preventDefault();
                openSearch();
            } else if (action === "close-search") {
                closeSearch();
            } else if (action === "close-modal") {
                closeModal();
            } else if (action === "open-menu") {
                openMobileMenu();
            } else if (action === "logout") {
                logout();
            }
        }

        if (event.target.closest("[data-theme-toggle]")) {
            toggleTheme();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSearch();
            closeModal();
        }

        const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(
            document.activeElement?.tagName
        );

        if (!typing && (event.key === "/" || (event.key === "k" && (event.metaKey || event.ctrlKey)))) {
            event.preventDefault();
            openSearch();
        }
    });

    document
        .getElementById("search-input")
        ?.addEventListener("input", (event) => {
            runSearch(event.target.value.trim());
        });
}

async function bootstrapShell() {
    if (!requireLogin()) {
        return;
    }

    renderChrome();
    bindGlobalActions();
    updateThemeControls();

    try {
        const me = await getMe();

        refreshShellAvatars(me);

        document.dispatchEvent(
            new CustomEvent("bookly:me", { detail: me })
        );
    } catch (error) {
        /* apiRequest already redirects on an expired session */
    }
}

if (document.body.dataset.shell !== "off") {
    document.addEventListener("DOMContentLoaded", bootstrapShell);
}
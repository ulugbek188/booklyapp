/* ==========================================================================
   Bookly — profile.js
   Profile header (avatar, username, stats, bio, actions) and the post grid.
   Uses /auth/me, /users/{username}, /users/me, /follows/* and /posts/feed.
   ========================================================================== */

const profileState = {
    me: null,
    user: null,
    isOwn: false,
    isFollowing: false,
    isPending: false,
    posts: []
};

(function initProfile() {
    if (!isLoggedIn()) {
        return;
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadProfile();
    });
})();

function requestedUsername() {
    return new URLSearchParams(window.location.search).get("username");
}

function pendingKey(username) {
    return `follow-request:${username}`;
}

/* --------------------------------------------------------------------------
   1. Load
   -------------------------------------------------------------------------- */

async function loadProfile() {
    const root = document.getElementById("profile-root");

    if (!root) {
        return;
    }

    renderProfileSkeleton(root);

    try {
        const me = await getMe(true);

        const username = requestedUsername() || me.username;

        const user =
            username === me.username
                ? me
                : await apiRequest(`/users/${encodeURIComponent(username)}`);

        rememberUser(user);

        profileState.me = me;
        profileState.user = user;
        profileState.isOwn = user.id === me.id;

        if (!profileState.isOwn) {
            await resolveRelationship(me, user);
        }

        renderProfile(root);

        loadProfilePosts();
    } catch (error) {
        root.innerHTML = `
            <div class="state">
                ${ICONS.person}
                <h2>Profile unavailable</h2>
                <p>${escapeHtml(error.message)}</p>
                <a class="btn btn-primary" href="feed.html">Back to feed</a>
            </div>
        `;
    }
}

async function resolveRelationship(me, user) {
    profileState.isPending =
        localStorage.getItem(pendingKey(user.username)) === "pending";

    try {
        const following = await apiRequest(
            `/follows/${encodeURIComponent(me.username)}/following`
        );

        rememberUsers(following);

        profileState.isFollowing = following.some(
            (item) => item.id === user.id
        );

        if (profileState.isFollowing) {
            profileState.isPending = false;

            localStorage.removeItem(pendingKey(user.username));
        }
    } catch (error) {
        profileState.isFollowing = false;
    }
}

function renderProfileSkeleton(root) {
    root.innerHTML = `
        <div class="profile" aria-hidden="true">
            <div class="profile-head">
                <div class="profile-avatar-wrap">
                    <div class="skeleton" style="width:150px;height:150px;border-radius:50%"></div>
                </div>

                <div class="profile-identity">
                    <div class="skeleton" style="width:180px;height:18px"></div>
                    <div class="skeleton" style="width:260px;height:14px"></div>
                    <div class="skeleton" style="width:220px;height:14px"></div>
                </div>
            </div>

            <div class="post-grid">
                ${Array.from({ length: 6 })
                    .map(
                        () =>
                            `<div class="skeleton" style="aspect-ratio:1/1;border-radius:0"></div>`
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   2. Render header
   -------------------------------------------------------------------------- */

function actionButtonsMarkup() {
    if (profileState.isOwn) {
        return `
            <button class="btn btn-secondary" type="button" data-edit-profile>
                Edit profile
            </button>

            <button class="btn btn-outline" type="button" data-share-book>
                Share a book
            </button>

            <button class="btn btn-outline btn-icon" type="button" data-account-menu aria-label="Account options">
                ${ICONS.settings}
            </button>
        `;
    }

    if (profileState.isFollowing) {
        return `
            <button class="btn btn-secondary" type="button" data-follow>Following</button>
            <a class="btn btn-outline" href="feed.html">View feed</a>
        `;
    }

    if (profileState.isPending) {
        return `
            <button class="btn btn-secondary" type="button" data-follow>Requested</button>
        `;
    }

    return `
        <button class="btn btn-primary" type="button" data-follow>Follow</button>
    `;
}

function renderProfile(root) {
    const user = profileState.user;

    const privacy = user.is_private
        ? `<span class="profile-badge">${ICONS.lock} Private</span>`
        : `<span class="profile-badge">${ICONS.globe} Public</span>`;

    root.innerHTML = `
        <section class="profile">
            <header class="profile-head">
                <div class="profile-avatar-wrap${profileState.isOwn ? " is-editable" : ""}">
                    ${avatarMarkup(user, "avatar avatar-xl")}
                    ${
                        profileState.isOwn
                            ? `
                                <span class="profile-avatar-edit" aria-hidden="true">${ICONS.image}</span>
                                <input
                                    id="avatar-file"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.gif"
                                    hidden
                                >
                            `
                            : ""
                    }
                </div>

                <div class="profile-identity">
                    <div class="profile-username-row">
                        <h1 class="profile-username">${escapeHtml(user.username)}</h1>
                        ${privacy}
                    </div>

                    <div class="profile-buttons">
                        ${actionButtonsMarkup()}
                    </div>

                    <div class="profile-stats hide-mobile">
                        <span class="profile-stat">
                            <strong data-posts-count>0</strong>
                            <span>posts</span>
                        </span>

                        <button class="profile-stat" type="button" data-connections="followers">
                            <strong>${formatCount(user.followers_count)}</strong>
                            <span>${pluralize(user.followers_count, "follower")}</span>
                        </button>

                        <button class="profile-stat" type="button" data-connections="following">
                            <strong>${formatCount(user.following_count)}</strong>
                            <span>following</span>
                        </button>
                    </div>

                    <div class="hide-mobile">
                        ${bioMarkup(user)}
                    </div>
                </div>
            </header>

            <div class="profile-mobile-meta hide-desktop">
                ${bioMarkup(user)}
            </div>

            <div class="profile-stats-bar hide-desktop">
                <span class="profile-stat">
                    <strong data-posts-count>0</strong>
                    <span>posts</span>
                </span>

                <button class="profile-stat" type="button" data-connections="followers">
                    <strong>${formatCount(user.followers_count)}</strong>
                    <span>${pluralize(user.followers_count, "follower")}</span>
                </button>

                <button class="profile-stat" type="button" data-connections="following">
                    <strong>${formatCount(user.following_count)}</strong>
                    <span>following</span>
                </button>
            </div>

            <div id="profile-editor-slot"></div>

            <nav class="profile-tabs">
                <span class="profile-tab is-active">${ICONS.grid} Books</span>
            </nav>

            <div id="profile-grid" class="post-grid"></div>
        </section>
    `;

    bindProfileActions(root);
    bindAvatarUpload(root);
}

function bioMarkup(user) {
    return `
        <div class="profile-bio${user.bio ? "" : " profile-bio-empty"}">${escapeHtml(
            user.bio || "No bio yet."
        )}</div>

        <p class="profile-joined">
            Reading on Bookly since ${escapeHtml(formatMonthYear(user.created_at))}
        </p>
    `;
}

/* --------------------------------------------------------------------------
   3. Actions
   -------------------------------------------------------------------------- */

function bindProfileActions(root) {
    root.querySelector("[data-follow]")?.addEventListener("click", (event) => {
        toggleFollow(event.currentTarget);
    });

    root.querySelector("[data-edit-profile]")?.addEventListener("click", () => {
        toggleEditor();
    });

    root.querySelector("[data-share-book]")?.addEventListener("click", () => {
        window.location.href = "create_post.html";
    });

    root.querySelector("[data-account-menu]")?.addEventListener("click", () => {
        openAccountMenu();
    });

    root.querySelectorAll("[data-connections]").forEach((button) => {
        button.addEventListener("click", () => {
            openConnections(button.dataset.connections);
        });
    });
}

const ALLOWED_AVATAR_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];

function bindAvatarUpload(root) {
    if (!profileState.isOwn) {
        return;
    }

    const input = root.querySelector("#avatar-file");
    const wrap = root.querySelector(".profile-avatar-wrap.is-editable");

    if (!input || !wrap) {
        return;
    }

    wrap.setAttribute("role", "button");
    wrap.setAttribute("tabindex", "0");
    wrap.setAttribute("aria-label", "Change profile photo");

    wrap.addEventListener("click", () => {
        input.click();
    });

    wrap.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });

    input.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    input.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];

        input.value = "";

        if (file) {
            await uploadAvatar(file);
        }
    });
}

async function uploadAvatar(file) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        toast("Photos must be a JPG, PNG, WEBP or GIF image.");

        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast("That image is larger than 5 MB.");

        return;
    }

    const formData = new FormData();

    formData.append("file", file);

    try {
        const updated = await apiRequest("/users/me/avatar", {
            method: "POST",
            body: formData
        });

        profileState.user = updated;
        profileState.me = updated;

        rememberUser(updated);

        try {
            sessionStorage.setItem("bookly:me", JSON.stringify(updated));
        } catch (error) {
            /* ignore */
        }

        refreshShellAvatars(updated);
        renderProfile(document.getElementById("profile-root"));
        loadProfilePosts();

        toast("Profile photo updated.");
    } catch (error) {
        toast(error.message);
    }
}

async function toggleFollow(button) {
    const user = profileState.user;

    const wasActive = profileState.isFollowing || profileState.isPending;

    button.disabled = true;

    try {
        const result = await apiRequest(
            `/follows/${encodeURIComponent(user.username)}`,
            { method: wasActive ? "DELETE" : "POST" }
        );

        if (wasActive) {
            profileState.isFollowing = false;
            profileState.isPending = false;

            localStorage.removeItem(pendingKey(user.username));

            toast(`You unfollowed ${user.username}.`);
        } else if (result?.status === "pending") {
            profileState.isPending = true;

            localStorage.setItem(pendingKey(user.username), "pending");

            toast("Follow request sent.");
        } else {
            profileState.isFollowing = true;
            profileState.isPending = false;

            toast(`You are now following ${user.username}.`);
        }

        const refreshed = await apiRequest(
            `/users/${encodeURIComponent(user.username)}`
        );

        profileState.user = refreshed;

        renderProfile(document.getElementById("profile-root"));

        loadProfilePosts();
    } catch (error) {
        toast(error.message);
    } finally {
        button.disabled = false;
    }
}

/* --------------------------------------------------------------------------
   4. Editor (own profile)
   -------------------------------------------------------------------------- */

function toggleEditor() {
    const slot = document.getElementById("profile-editor-slot");

    if (!slot) {
        return;
    }

    if (slot.children.length) {
        slot.innerHTML = "";

        return;
    }

    const user = profileState.user;

    slot.innerHTML = `
        <form class="profile-editor" id="profile-form">
            <h3>Edit profile</h3>

            <div class="profile-editor-photo">
                ${avatarMarkup(user, "avatar avatar-lg")}

                <div>
                    <button class="btn btn-ghost" type="button" data-change-photo>
                        Change profile photo
                    </button>
                    <p class="field-hint">JPG, PNG, WEBP or GIF · up to 5 MB</p>
                </div>
            </div>

            <div class="field">
                <label for="bio">Bio</label>

                <textarea
                    class="textarea"
                    id="bio"
                    maxlength="500"
                    placeholder="Tell readers what you like to read"
                >${escapeHtml(user.bio || "")}</textarea>

                <span class="field-hint" id="bio-counter"></span>
            </div>

            <div class="switch-row">
                <span class="switch-row-text">
                    <strong>Private account</strong>
                    <span class="meta">
                        Only accepted followers can see your books.
                    </span>
                </span>

                <span class="switch">
                    <input
                        id="private"
                        type="checkbox"
                        ${user.is_private ? "checked" : ""}
                    >
                    <span class="switch-track"></span>
                </span>
            </div>

            <p class="form-message" id="profile-message"></p>

            <div class="profile-editor-actions">
                <button class="btn btn-outline" type="button" data-cancel-edit>
                    Cancel
                </button>

                <button class="btn btn-primary" type="submit">Save changes</button>
            </div>
        </form>
    `;

    const textarea = document.getElementById("bio");
    const counter = document.getElementById("bio-counter");

    const updateCounter = () => {
        counter.textContent = `${textarea.value.length}/500`;
    };

    updateCounter();

    textarea.addEventListener("input", updateCounter);

    slot.querySelector("[data-cancel-edit]").addEventListener("click", () => {
        slot.innerHTML = "";
    });

    slot.querySelector("[data-change-photo]")?.addEventListener("click", () => {
        document.getElementById("avatar-file")?.click();
    });

    document
        .getElementById("profile-form")
        .addEventListener("submit", saveProfile);
}

async function saveProfile(event) {
    event.preventDefault();

    const message = document.getElementById("profile-message");
    const button = event.currentTarget.querySelector("button[type='submit']");

    const bio = document.getElementById("bio").value.trim();
    const isPrivate = document.getElementById("private").checked;

    message.className = "form-message";
    message.textContent = "";

    button.disabled = true;

    try {
        const updated = await apiRequest("/users/me", {
            method: "PATCH",
            body: JSON.stringify({
                bio,
                is_private: isPrivate
            })
        });

        profileState.user = updated;
        profileState.me = updated;

        try {
            sessionStorage.setItem("bookly:me", JSON.stringify(updated));
        } catch (error) {
            /* ignore */
        }

        renderProfile(document.getElementById("profile-root"));

        loadProfilePosts();

        toast("Profile updated.");
    } catch (error) {
        message.className = "form-message is-error";
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
}

function openAccountMenu() {
    const card = openModal(`
        <div class="modal-head">
            <h2 class="title-lg">Account</h2>
            <p>${escapeHtml(profileState.user.username)}</p>
        </div>

        <div class="modal-actions">
            <button class="modal-action" type="button" data-menu-edit>
                Edit profile
            </button>

            <button class="modal-action" type="button" data-menu-logout>
                Log out
            </button>

            <button class="modal-action is-strong" type="button" data-menu-delete>
                Delete account
            </button>

            <button class="modal-action" type="button" data-cancel>Cancel</button>
        </div>
    `);

    if (!card) {
        return;
    }

    card.querySelector("[data-cancel]").addEventListener("click", closeModal);

    card.querySelector("[data-menu-edit]").addEventListener("click", () => {
        closeModal();
        toggleEditor();
    });

    card.querySelector("[data-menu-logout]").addEventListener("click", () => {
        closeModal();
        logout();
    });

    card.querySelector("[data-menu-delete]").addEventListener("click", async () => {
        closeModal();

        const confirmed = await confirmDialog({
            title: "Delete account?",
            message:
                "Your posts, comments, likes and followers are permanently removed.",
            confirmLabel: "Delete account",
            cancelLabel: "Cancel"
        });

        if (!confirmed) {
            return;
        }

        try {
            await apiRequest("/auth/account", { method: "DELETE" });

            removeToken();

            window.location.replace("register.html");
        } catch (error) {
            toast(error.message);
        }
    });
}

/* --------------------------------------------------------------------------
   5. Connections
   -------------------------------------------------------------------------- */

async function openConnections(kind) {
    const username = profileState.user.username;

    const title = kind === "followers" ? "Followers" : "Following";

    const card = openModal(`
        <div class="modal-list-head">
            <h2 class="title-md">${title}</h2>

            <button class="icon-btn" type="button" data-cancel aria-label="Close">
                ${ICONS.close}
            </button>
        </div>

        <div class="modal-body" id="connections-body">
            <div class="spinner" role="status" aria-label="Loading"></div>
        </div>
    `);

    if (!card) {
        return;
    }

    card.querySelector("[data-cancel]").addEventListener("click", closeModal);

    const body = card.querySelector("#connections-body");

    try {
        const users = await apiRequest(
            `/follows/${encodeURIComponent(username)}/${kind}`
        );

        rememberUsers(users);

        if (!users.length) {
            body.innerHTML = `
                <p class="search-hint">
                    ${
                        kind === "followers"
                            ? "No followers yet."
                            : "Not following anyone yet."
                    }
                </p>
            `;

            return;
        }

        body.innerHTML = users
            .map(
                (user) => `
                    <a class="user-row" href="${profileHref(user.username)}">
                        ${avatarMarkup(user, "avatar avatar-md")}

                        <span class="user-row-body">
                            <span class="user-row-name truncate">${escapeHtml(
                                user.username
                            )}</span>

                            <span class="user-row-meta truncate">${escapeHtml(
                                user.bio || (user.is_private ? "Private account" : "Bookly reader")
                            )}</span>
                        </span>
                    </a>
                `
            )
            .join("");
    } catch (error) {
        body.innerHTML = `<p class="search-hint">${escapeHtml(error.message)}</p>`;
    }
}

/* --------------------------------------------------------------------------
   6. Post grid
   -------------------------------------------------------------------------- */

async function loadProfilePosts() {
    const grid = document.getElementById("profile-grid");

    if (!grid) {
        return;
    }

    grid.innerHTML = Array.from({ length: 3 })
        .map(
            () => `<div class="skeleton" style="aspect-ratio:1/1;border-radius:0"></div>`
        )
        .join("");

    try {
        const posts = await apiRequest("/posts/feed");

        const mine = posts.filter(
            (post) => post.user_id === profileState.user.id
        );

        profileState.posts = mine;

        document.querySelectorAll("[data-posts-count]").forEach((element) => {
            element.textContent = formatCount(mine.length);
        });

        if (!mine.length) {
            grid.outerHTML = `
                <div class="post-grid" id="profile-grid"></div>
                <div class="state">
                    ${ICONS.book}
                    <h2>${
                        profileState.isOwn
                            ? "Share your first book"
                            : profileState.user.is_private && !profileState.isFollowing
                              ? "This account is private"
                              : "No books yet"
                    }</h2>

                    <p>${
                        profileState.isOwn
                            ? "Posts you share appear here as a grid of covers."
                            : profileState.user.is_private && !profileState.isFollowing
                              ? "Follow this reader to see the books they share."
                              : "This reader has not shared a book yet."
                    }</p>

                    ${
                        profileState.isOwn
                            ? `<a class="btn btn-primary btn-lg" href="create_post.html">Share a book</a>`
                            : ""
                    }
                </div>
            `;

            return;
        }

        grid.innerHTML = mine.map(gridItemMarkup).join("");
    } catch (error) {
        grid.innerHTML = `<p class="search-hint">${escapeHtml(error.message)}</p>`;
    }
}

function gridItemMarkup(post, index) {
    const media = post.cover
        ? `<img src="${assetUrl(post.cover)}" alt="Cover of ${escapeHtml(
              post.title
          )}" loading="lazy">`
        : `<span class="grid-item-text">${escapeHtml(post.title)}</span>`;

    return `
        <a
            class="grid-item"
            href="comments.html?post_id=${encodeURIComponent(post.id)}"
            style="animation-delay:${Math.min(index, 9) * 24}ms"
            aria-label="${escapeHtml(post.title)}"
        >
            ${media}

            <span class="grid-overlay">
                <span>${ICONS.heart} ${formatCount(post.likes_count)}</span>
                <span>${ICONS.comment} ${formatCount(post.comments_count)}</span>
            </span>
        </a>
    `;
}
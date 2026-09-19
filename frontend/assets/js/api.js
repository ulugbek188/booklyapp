/* ==========================================================================
   Bookly — api.js
   Transport layer for the FastAPI backend, token storage, small caches and
   shared formatting helpers. No endpoint, payload or auth scheme is changed.
   ========================================================================== */

const API_URL = "http://127.0.0.1:8000";

const STORAGE_KEYS = {
    token: "access_token",
    theme: "theme",
    likedPosts: "bookly:liked-posts",
    likedComments: "bookly:liked-comments",
    followRequest: "follow-request",
    directory: "bookly:user-directory"
};

/* --------------------------------------------------------------------------
   1. Request
   -------------------------------------------------------------------------- */

async function apiRequest(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    const token = getToken();

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (networkError) {
        const error = new Error(
            "Cannot reach the Bookly server. Check that the API is running."
        );

        error.status = 0;

        throw error;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(
            normalizeDetail(data?.detail) || "Something went wrong."
        );

        error.status = response.status;

        if (response.status === 401 && !isAuthPage()) {
            removeToken();

            window.location.replace("login.html");
        }

        throw error;
    }

    return data;
}

function normalizeDetail(detail) {
    if (!detail) {
        return "";
    }

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item?.msg || item?.detail || "")
            .filter(Boolean)
            .join(" ");
    }

    return "";
}

function isAuthPage() {
    const page = document.body?.dataset?.page;

    return page === "login" || page === "register";
}

/* --------------------------------------------------------------------------
   2. Token
   -------------------------------------------------------------------------- */

function saveToken(token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
}

function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
}

function removeToken() {
    localStorage.removeItem(STORAGE_KEYS.token);

    sessionStorage.removeItem("bookly:me");
}

function isLoggedIn() {
    return Boolean(getToken());
}

/* --------------------------------------------------------------------------
   3. Local state caches
   -------------------------------------------------------------------------- */

function readSet(key) {
    try {
        const raw = localStorage.getItem(key);

        const parsed = raw ? JSON.parse(raw) : [];

        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch (error) {
        return new Set();
    }
}

function writeSet(key, set) {
    try {
        localStorage.setItem(key, JSON.stringify([...set]));
    } catch (error) {
        /* storage unavailable — state stays in memory for this session */
    }
}

function isPostLiked(postId) {
    return readSet(STORAGE_KEYS.likedPosts).has(String(postId));
}

function setPostLiked(postId, liked) {
    const set = readSet(STORAGE_KEYS.likedPosts);

    liked ? set.add(String(postId)) : set.delete(String(postId));

    writeSet(STORAGE_KEYS.likedPosts, set);
}

function isCommentLiked(commentId) {
    return readSet(STORAGE_KEYS.likedComments).has(String(commentId));
}

function setCommentLiked(commentId, liked) {
    const set = readSet(STORAGE_KEYS.likedComments);

    liked ? set.add(String(commentId)) : set.delete(String(commentId));

    writeSet(STORAGE_KEYS.likedComments, set);
}

/* --------------------------------------------------------------------------
   4. User directory (id -> username)

   The posts and comments endpoints expose `user_id` only, so a directory is
   built from the endpoints that do return usernames: the signed-in user, the
   follower / following lists and any search or profile lookup.
   -------------------------------------------------------------------------- */

function readDirectory() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEYS.directory);

        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        return {};
    }
}

function writeDirectory(directory) {
    try {
        sessionStorage.setItem(
            STORAGE_KEYS.directory,
            JSON.stringify(directory)
        );
    } catch (error) {
        /* ignore */
    }
}

function rememberUser(user) {
    if (!user || user.id === undefined || !user.username) {
        return;
    }

    const directory = readDirectory();
    const previous = normalizeDirectoryEntry(directory[String(user.id)]);

    directory[String(user.id)] = {
        username: user.username,
        avatar_url:
            user.avatar_url !== undefined
                ? user.avatar_url || null
                : previous?.avatar_url || null
    };

    writeDirectory(directory);
}

function rememberUsers(users) {
    if (!Array.isArray(users)) {
        return;
    }

    users.forEach(rememberUser);
}

function normalizeDirectoryEntry(entry) {
    if (!entry) {
        return null;
    }

    if (typeof entry === "string") {
        return {
            username: entry,
            avatar_url: null
        };
    }

    return {
        username: entry.username || null,
        avatar_url: entry.avatar_url || null
    };
}

function directoryEntryForId(userId) {
    const directory = readDirectory();

    return normalizeDirectoryEntry(directory[String(userId)]);
}

function usernameForId(userId) {
    return directoryEntryForId(userId)?.username || null;
}

function avatarUrlForId(userId) {
    return directoryEntryForId(userId)?.avatar_url || null;
}

function userRefForId(userId) {
    const entry = directoryEntryForId(userId);

    return {
        username: entry?.username || `reader_${userId}`,
        avatar_url: entry?.avatar_url || null
    };
}

function displayNameForId(userId) {
    return usernameForId(userId) || `reader_${userId}`;
}

function profileHref(username) {
    return `profile.html?username=${encodeURIComponent(username)}`;
}

/* --------------------------------------------------------------------------
   5. Current user
   -------------------------------------------------------------------------- */

let mePromise = null;

async function getMe(forceRefresh = false) {
    if (!forceRefresh) {
        try {
            const cached = sessionStorage.getItem("bookly:me");

            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            /* fall through to network */
        }

        if (mePromise) {
            return mePromise;
        }
    }

    mePromise = apiRequest("/auth/me")
        .then((me) => {
            rememberUser(me);

            try {
                sessionStorage.setItem("bookly:me", JSON.stringify(me));
            } catch (error) {
                /* ignore */
            }

            return me;
        })
        .finally(() => {
            mePromise = null;
        });

    return mePromise;
}

function cachedMe() {
    try {
        const cached = sessionStorage.getItem("bookly:me");

        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        return null;
    }
}

/* --------------------------------------------------------------------------
   6. Utilities
   -------------------------------------------------------------------------- */

function assetUrl(path) {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${API_URL}${path}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function initialOf(value) {
    const text = String(value ?? "").trim();

    return text ? text.charAt(0).toUpperCase() : "?";
}

function formatCount(value) {
    const number = Number(value) || 0;

    if (number < 1000) {
        return String(number);
    }

    if (number < 1000000) {
        return `${(number / 1000).toFixed(number % 1000 === 0 ? 0 : 1)}k`;
    }

    return `${(number / 1000000).toFixed(1)}m`;
}

function pluralize(count, singular, plural) {
    return Number(count) === 1 ? singular : plural || `${singular}s`;
}

function parseDate(value) {
    if (!value) {
        return null;
    }

    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);

    const date = new Date(hasZone ? value : `${value}Z`);

    return Number.isNaN(date.getTime()) ? new Date(value) : date;
}

function timeAgo(value) {
    const date = parseDate(value);

    if (!date || Number.isNaN(date.getTime())) {
        return "";
    }

    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (seconds < 60) {
        return "just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d`;
    }

    const weeks = Math.floor(days / 7);

    if (days < 365) {
        return `${weeks}w`;
    }

    return `${Math.floor(days / 365)}y`;
}

function formatLongDate(value) {
    const date = parseDate(value);

    if (!date || Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatMonthYear(value) {
    const date = parseDate(value);

    if (!date || Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long"
    });
}

function debounce(fn, delay = 280) {
    let timer;

    return (...args) => {
        clearTimeout(timer);

        timer = setTimeout(() => fn(...args), delay);
    };
}

function permissionLabel(permission) {
    if (permission === "followers") {
        return "Followers can comment";
    }

    if (permission === "nobody") {
        return "Comments off";
    }

    return "Open to comments";
}
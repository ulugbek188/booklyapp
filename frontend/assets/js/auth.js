/* ==========================================================================
   Bookly — auth.js
   Login and registration. Talks to /auth/login and /auth/register and stores
   the bearer token exactly as the backend expects.
   ========================================================================== */

(function initAuth() {
    if (isLoggedIn()) {
        window.location.replace("feed.html");

        return;
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindPasswordToggles();
        bindThemeControl();

        document
            .getElementById("login-form")
            ?.addEventListener("submit", handleLogin);

        document
            .getElementById("register-form")
            ?.addEventListener("submit", handleRegister);
    });
})();

/* --------------------------------------------------------------------------
   1. Helpers
   -------------------------------------------------------------------------- */

function setAuthMessage(id, text, tone = "error") {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.className = `form-message is-${tone}`;
    element.textContent = text;
}

function setLoading(form, loading, label) {
    const button = form.querySelector("button[type='submit']");

    if (!button) {
        return;
    }

    button.disabled = loading;

    if (loading) {
        button.dataset.label = button.textContent;
        button.textContent = label;
    } else if (button.dataset.label) {
        button.textContent = button.dataset.label;
    }
}

function bindPasswordToggles() {
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(
                button.dataset.passwordToggle
            );

            if (!input) {
                return;
            }

            const revealed = input.type === "text";

            input.type = revealed ? "password" : "text";
            button.textContent = revealed ? "Show" : "Hide";
        });
    });
}

function bindThemeControl() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.addEventListener("click", toggleTheme);
    });
}

/* --------------------------------------------------------------------------
   2. Login
   -------------------------------------------------------------------------- */

async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username.length < 3) {
        setAuthMessage("login-message", "Usernames are at least 3 characters.");

        return;
    }

    if (password.length < 8) {
        setAuthMessage("login-message", "Passwords are at least 8 characters.");

        return;
    }

    setLoading(form, true, "Logging in...");

    setAuthMessage("login-message", "", "success");

    try {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        saveToken(data.access_token);

        setAuthMessage("login-message", "Welcome back.", "success");

        window.location.replace("feed.html");
    } catch (error) {
        setAuthMessage("login-message", error.message);

        setLoading(form, false);
    }
}

/* --------------------------------------------------------------------------
   3. Register
   -------------------------------------------------------------------------- */

async function handleRegister(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username.length < 3 || username.length > 50) {
        setAuthMessage(
            "register-message",
            "Usernames are between 3 and 50 characters."
        );

        return;
    }

    if (password.length < 8 || password.length > 50) {
        setAuthMessage(
            "register-message",
            "Passwords are between 8 and 50 characters."
        );

        return;
    }

    setLoading(form, true, "Creating account...");

    try {
        await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        setAuthMessage(
            "register-message",
            "Account created. Signing you in...",
            "success"
        );

        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        saveToken(data.access_token);

        window.location.replace("feed.html");
    } catch (error) {
        setAuthMessage("register-message", error.message);

        setLoading(form, false);
    }
}
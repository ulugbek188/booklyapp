/* ==========================================================================
   Bookly — create-post.js
   Composer: cover selection with live preview, book details and publishing.
   Uses POST /posts followed by POST /posts/{id}/cover when a file is chosen.
   ========================================================================== */

const composerState = {
    file: null,
    previewUrl: null
};

const ALLOWED_COVER_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];

(function initComposer() {
    if (!isLoggedIn()) {
        return;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        bindComposer();

        try {
            const me = await getMe();

            const user = document.getElementById("composer-user");

            if (user) {
                user.innerHTML = `
                    ${avatarMarkup(me)}
                    <strong>${escapeHtml(me.username)}</strong>
                `;
            }
        } catch (error) {
            /* the shell handles an expired session */
        }
    });
})();

/* --------------------------------------------------------------------------
   1. Bindings
   -------------------------------------------------------------------------- */

function bindComposer() {
    const form = document.getElementById("post-form");
    const drop = document.getElementById("cover-drop");
    const input = document.getElementById("cover");

    form?.addEventListener("submit", publishPost);

    drop?.addEventListener("click", (event) => {
        if (event.target.closest("[data-remove-cover]")) {
            return;
        }

        input?.click();
    });

    drop?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input?.click();
        }
    });

    ["dragenter", "dragover"].forEach((type) => {
        drop?.addEventListener(type, (event) => {
            event.preventDefault();
            drop.classList.add("is-dragging");
        });
    });

    ["dragleave", "drop"].forEach((type) => {
        drop?.addEventListener(type, (event) => {
            event.preventDefault();
            drop.classList.remove("is-dragging");
        });
    });

    drop?.addEventListener("drop", (event) => {
        const file = event.dataTransfer?.files?.[0];

        if (file) {
            selectCover(file);
        }
    });

    input?.addEventListener("change", (event) => {
        const file = event.target.files?.[0];

        if (file) {
            selectCover(file);
        }
    });

    bindCounters();
}

function bindCounters() {
    const pairs = [
        ["title", "title-counter", 255],
        ["gist", "gist-counter", 180],
        ["description", "description-counter", 2200]
    ];

    pairs.forEach(([fieldId, counterId, max]) => {
        const field = document.getElementById(fieldId);
        const counter = document.getElementById(counterId);

        if (!field || !counter) {
            return;
        }

        const update = () => {
            counter.textContent = `${field.value.length}/${max}`;
        };

        field.setAttribute("maxlength", String(max));

        update();

        field.addEventListener("input", update);
    });
}

/* --------------------------------------------------------------------------
   2. Cover
   -------------------------------------------------------------------------- */

function selectCover(file) {
    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
        toast("Covers must be a JPG, PNG, WEBP or GIF image.");

        return;
    }

    if (file.size > 8 * 1024 * 1024) {
        toast("That image is larger than 8 MB.");

        return;
    }

    if (composerState.previewUrl) {
        URL.revokeObjectURL(composerState.previewUrl);
    }

    composerState.file = file;
    composerState.previewUrl = URL.createObjectURL(file);

    renderCoverPreview();
}

function renderCoverPreview() {
    const drop = document.getElementById("cover-drop");

    if (!drop) {
        return;
    }

    drop.innerHTML = `
        <img class="composer-preview" src="${composerState.previewUrl}" alt="Selected cover preview">

        <div class="composer-preview-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-remove-cover>
                Remove
            </button>
        </div>
    `;

    drop.querySelector("[data-remove-cover]").addEventListener("click", (event) => {
        event.stopPropagation();

        clearCover();
    });
}

function clearCover() {
    if (composerState.previewUrl) {
        URL.revokeObjectURL(composerState.previewUrl);
    }

    composerState.file = null;
    composerState.previewUrl = null;

    const input = document.getElementById("cover");

    if (input) {
        input.value = "";
    }

    const drop = document.getElementById("cover-drop");

    if (drop) {
        drop.innerHTML = coverPlaceholderMarkup();
    }
}

function coverPlaceholderMarkup() {
    return `
        ${ICONS.image}
        <h3>Drag a book cover here</h3>
        <p>JPG, PNG, WEBP or GIF — optional</p>
        <span class="btn btn-primary btn-sm">Select from device</span>
    `;
}

/* --------------------------------------------------------------------------
   3. Publish
   -------------------------------------------------------------------------- */

async function publishPost(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const message = document.getElementById("post-message");
    const button = form.querySelector("button[type='submit']");

    const title = document.getElementById("title").value.trim();
    const gist = document.getElementById("gist").value.trim();
    const description = document.getElementById("description").value.trim();
    const permission = document.getElementById("permission").value;

    message.className = "form-message";
    message.textContent = "";

    if (!title || !gist || !description) {
        message.className = "form-message is-error";
        message.textContent = "Title, short take and description are required.";

        return;
    }

    if (gist.length < 5) {
        message.className = "form-message is-error";
        message.textContent = "Your short take needs at least 5 characters.";

        return;
    }

    button.disabled = true;
    button.textContent = "Publishing...";

    try {
        const post = await apiRequest("/posts", {
            method: "POST",
            body: JSON.stringify({
                title,
                gist,
                description,
                comment_permission: permission
            })
        });

        if (composerState.file) {
            button.textContent = "Uploading cover...";

            const formData = new FormData();

            formData.append("file", composerState.file);

            try {
                await apiRequest(`/posts/${post.id}/cover`, {
                    method: "POST",
                    body: formData
                });
            } catch (coverError) {
                toast(`Post published, but the cover failed: ${coverError.message}`);
            }
        }

        message.className = "form-message is-success";
        message.textContent = "Your book post is live.";

        clearCover();

        form.reset();

        bindCounters();

        setTimeout(() => {
            window.location.href = "feed.html";
        }, 600);
    } catch (error) {
        message.className = "form-message is-error";
        message.textContent = error.message;

        button.disabled = false;
        button.textContent = "Share";
    }
}
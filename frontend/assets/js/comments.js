/* ==========================================================================
   Bookly — comments.js
   Post detail: cover, caption, like state and the comment thread.
   Uses /posts/{id}, /comments/post/{id}, /comments/{id} and /likes/*.
   ========================================================================== */

const detailState = {
    postId: new URLSearchParams(window.location.search).get("post_id"),
    post: null,
    me: null,
    comments: []
};

(function initDetail() {
    if (!isLoggedIn()) {
        return;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const root = document.getElementById("detail-root");

        if (!root) {
            return;
        }

        if (!detailState.postId) {
            root.innerHTML = `
                <div class="state">
                    ${ICONS.book}
                    <h2>No post selected</h2>
                    <p>Open a post from your feed to read and add comments.</p>
                    <a class="btn btn-primary" href="feed.html">Back to feed</a>
                </div>
            `;

            return;
        }

        root.innerHTML = `<div class="spinner" role="status" aria-label="Loading post"></div>`;

        try {
            const [me, post] = await Promise.all([
                getMe(),
                apiRequest(`/posts/${encodeURIComponent(detailState.postId)}`)
            ]);

            detailState.me = me;
            detailState.post = post;

            await seedDirectory(me);

            renderDetail(root);

            await loadComments();
        } catch (error) {
            root.innerHTML = `
                <div class="state">
                    ${ICONS.book}
                    <h2>Post unavailable</h2>
                    <p>${escapeHtml(error.message)}</p>
                    <a class="btn btn-primary" href="feed.html">Back to feed</a>
                </div>
            `;
        }
    });
})();

/* --------------------------------------------------------------------------
   1. Directory seeding (user_id -> username)
   -------------------------------------------------------------------------- */

async function seedDirectory(me) {
    try {
        const [followers, following] = await Promise.all([
            apiRequest(`/follows/${encodeURIComponent(me.username)}/followers`),
            apiRequest(`/follows/${encodeURIComponent(me.username)}/following`)
        ]);

        rememberUsers(followers);
        rememberUsers(following);
    } catch (error) {
        /* names fall back to reader_<id> */
    }
}

/* --------------------------------------------------------------------------
   2. Detail view
   -------------------------------------------------------------------------- */

function authorLink(userId, className = "post-author") {
    const name = displayNameForId(userId);

    if (usernameForId(userId)) {
        return `<a class="${className}" href="${profileHref(name)}">${escapeHtml(name)}</a>`;
    }

    return `<span class="${className}">${escapeHtml(name)}</span>`;
}

function detailMediaMarkup(post) {
    if (post.cover) {
        return `
            <img
                src="${assetUrl(post.cover)}"
                alt="Cover of ${escapeHtml(post.title)}"
            >
            <span class="post-burst" data-burst>${ICONS.heart}</span>
        `;
    }

    return `
        <div class="post-media-blank">
            <span class="blank-label">Bookly</span>
            <span class="blank-title">${escapeHtml(post.title)}</span>
            <span class="blank-gist">${escapeHtml(post.gist)}</span>
        </div>
        <span class="post-burst" data-burst>${ICONS.heart}</span>
    `;
}

function renderDetail(root) {
    const post = detailState.post;

    const liked = isPostLiked(post.id);

    const likes = Number(post.likes_count) || 0;

    const authorName = displayNameForId(post.user_id);

    const commentsOff = post.comment_permission === "nobody";

    root.innerHTML = `
        <article class="detail">
            <div class="detail-media" data-media>
                ${detailMediaMarkup(post)}
            </div>

            <div class="detail-panel">
                <header class="detail-head">
                    ${avatarMarkup(userRefForId(post.user_id), "avatar avatar-md")}

                    <div class="post-head-body">
                        ${authorLink(post.user_id)}
                        <span class="post-head-meta">
                            ${escapeHtml(permissionLabel(post.comment_permission))}
                        </span>
                    </div>

                    <button class="post-more" type="button" data-post-menu aria-label="Post options">
                        ${ICONS.more}
                    </button>
                </header>

                <div class="detail-scroll">
                    <div class="detail-caption">
                        ${avatarMarkup(userRefForId(post.user_id), "avatar avatar-md")}

                        <div class="detail-caption-body">
                            <p class="post-caption">
                                ${authorLink(post.user_id)}
                                <span class="post-title">${escapeHtml(post.title)}</span>
                            </p>

                            <p class="post-caption post-gist">${escapeHtml(post.gist)}</p>

                            <p class="post-caption post-description">${escapeHtml(post.description)}</p>

                            <span class="post-time">${escapeHtml(
                                formatLongDate(post.created_at)
                            )}</span>
                        </div>
                    </div>

                    <div class="comments-list" id="comments-list">
                        <div class="spinner" role="status" aria-label="Loading comments"></div>
                    </div>
                </div>

                <div class="detail-actions">
                    <button
                        class="post-action${liked ? " is-liked" : ""}"
                        type="button"
                        data-like
                        aria-pressed="${liked}"
                        aria-label="${liked ? "Unlike" : "Like"}"
                    >
                        ${ICONS.heart}
                    </button>

                    <button
                        class="post-action"
                        type="button"
                        data-focus-comment
                        aria-label="Write a comment"
                        ${commentsOff ? "disabled" : ""}
                    >
                        ${ICONS.comment}
                    </button>
                </div>

                <div class="detail-meta">
                    <span class="post-likes" data-likes data-count="${likes}">
                        ${formatCount(likes)} ${pluralize(likes, "like")}
                    </span>

                    <span class="post-time">${escapeHtml(timeAgo(post.created_at))} ago</span>
                </div>

                ${
                    commentsOff
                        ? `<p class="comments-disabled">Comments are turned off for this post.</p>`
                        : `
                            <form class="comment-composer comment-composer-sticky" id="comment-form">
                                ${avatarMarkup(detailState.me)}

                                <input
                                    class="input"
                                    id="comment-text"
                                    type="text"
                                    maxlength="1000"
                                    placeholder="Add a comment..."
                                    autocomplete="off"
                                    aria-label="Add a comment"
                                >

                                <button class="btn btn-ghost" type="submit" data-submit-comment>
                                    Post
                                </button>
                            </form>
                        `
                }
            </div>
        </article>
    `;

    bindDetail(root);
}

function bindDetail(root) {
    const post = detailState.post;

    const burst = root.querySelector("[data-burst]");

    root.querySelector("[data-like]")?.addEventListener("click", () => {
        toggleDetailLike(root, burst);
    });

    let lastTap = 0;

    root.querySelector("[data-media]")?.addEventListener("click", () => {
        const now = Date.now();

        if (now - lastTap < 320) {
            lastTap = 0;

            if (!isPostLiked(post.id)) {
                toggleDetailLike(root, burst);
            } else {
                playBurstElement(burst);
            }

            return;
        }

        lastTap = now;
    });

    root.querySelector("[data-focus-comment]")?.addEventListener("click", () => {
        document.getElementById("comment-text")?.focus();
    });

    root.querySelector("[data-post-menu]")?.addEventListener("click", () => {
        openDetailMenu();
    });

    document
        .getElementById("comment-form")
        ?.addEventListener("submit", createComment);
}

function playBurstElement(burst) {
    if (!burst) {
        return;
    }

    burst.classList.remove("is-active");

    void burst.offsetWidth;

    burst.classList.add("is-active");
}

async function toggleDetailLike(root, burst) {
    const post = detailState.post;

    const button = root.querySelector("[data-like]");
    const counter = root.querySelector("[data-likes]");

    const liked = isPostLiked(post.id);

    const nextLiked = !liked;

    const baseline = Number(counter?.dataset.count) || 0;

    const nextCount = Math.max(0, baseline + (nextLiked ? 1 : -1));

    setLikeVisual(button, counter, nextLiked, nextCount);

    if (nextLiked) {
        playBurstElement(burst);
    }

    try {
        await apiRequest(`/likes/posts/${encodeURIComponent(post.id)}`, {
            method: nextLiked ? "POST" : "DELETE"
        });

        setPostLiked(post.id, nextLiked);
    } catch (error) {
        if (
            (nextLiked && error.status === 400) ||
            (!nextLiked && error.status === 404)
        ) {
            setPostLiked(post.id, nextLiked);

            return;
        }

        setLikeVisual(button, counter, liked, baseline);

        toast(error.message);
    }
}

function setLikeVisual(button, counter, liked, count) {
    if (button) {
        button.classList.toggle("is-liked", liked);
        button.setAttribute("aria-pressed", String(liked));
        button.setAttribute("aria-label", liked ? "Unlike" : "Like");
    }

    if (counter) {
        counter.dataset.count = String(count);
        counter.textContent = `${formatCount(count)} ${pluralize(count, "like")}`;
    }
}

function openDetailMenu() {
    const post = detailState.post;

    const isOwn = detailState.me && post.user_id === detailState.me.id;

    const authorName = displayNameForId(post.user_id);

    const card = openModal(`
        <div class="modal-head">
            <h2 class="title-lg">${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(permissionLabel(post.comment_permission))}</p>
        </div>

        <div class="modal-actions">
            ${
                usernameForId(post.user_id)
                    ? `<a class="modal-action" href="${profileHref(authorName)}">
                           About this account
                       </a>`
                    : ""
            }

            ${
                isOwn
                    ? `<button class="modal-action is-strong" type="button" data-delete-post>
                           Delete post
                       </button>`
                    : ""
            }

            <button class="modal-action" type="button" data-cancel>Cancel</button>
        </div>
    `);

    if (!card) {
        return;
    }

    card.querySelector("[data-cancel]").addEventListener("click", closeModal);

    card.querySelector("[data-delete-post]")?.addEventListener("click", async () => {
        closeModal();

        const confirmed = await confirmDialog({
            title: "Delete post?",
            message: "This removes the post along with its likes and comments.",
            confirmLabel: "Delete",
            cancelLabel: "Keep post"
        });

        if (!confirmed) {
            return;
        }

        try {
            await apiRequest(`/posts/${encodeURIComponent(post.id)}`, {
                method: "DELETE"
            });

            window.location.replace("feed.html");
        } catch (error) {
            toast(error.message);
        }
    });
}

/* --------------------------------------------------------------------------
   3. Comments
   -------------------------------------------------------------------------- */

async function loadComments() {
    const list = document.getElementById("comments-list");

    if (!list) {
        return;
    }

    try {
        const comments = await apiRequest(
            `/comments/post/${encodeURIComponent(detailState.postId)}`
        );

        detailState.comments = comments;

        if (!comments.length) {
            list.innerHTML = `
                <div class="state" style="padding:36px 24px">
                    ${ICONS.comment}
                    <h2 class="title-md">No comments yet</h2>
                    <p class="meta">
                        ${
                            detailState.post.comment_permission === "nobody"
                                ? "Comments are turned off for this post."
                                : "Start the conversation about this book."
                        }
                    </p>
                </div>
            `;

            return;
        }

        list.innerHTML = comments.map(commentMarkup).join("");

        bindCommentActions(list);
    } catch (error) {
        list.innerHTML = `<p class="search-hint">${escapeHtml(error.message)}</p>`;
    }
}

function commentMarkup(comment, index) {
    const name = displayNameForId(comment.user_id);

    const liked = isCommentLiked(comment.id);

    const likes = Number(comment.likes_count) || 0;

    const isOwn = detailState.me && comment.user_id === detailState.me.id;

    return `
        <article
            class="comment"
            data-comment-id="${comment.id}"
            style="animation-delay:${Math.min(index, 8) * 24}ms"
        >
            ${avatarMarkup(userRefForId(comment.user_id))}

            <div class="comment-body">
                <p class="comment-text">
                    ${authorLink(comment.user_id)}
                    ${escapeHtml(comment.text)}
                </p>

                <div class="comment-meta">
                    <span>${escapeHtml(timeAgo(comment.created_at))}</span>

                    <span data-comment-likes data-count="${likes}">
                        ${likes ? `${formatCount(likes)} ${pluralize(likes, "like")}` : ""}
                    </span>

                    ${
                        isOwn
                            ? `<button type="button" data-delete-comment>Delete</button>`
                            : ""
                    }
                </div>
            </div>

            <button
                class="comment-like${liked ? " is-liked" : ""}"
                type="button"
                data-like-comment
                aria-pressed="${liked}"
                aria-label="${liked ? "Unlike comment" : "Like comment"}"
            >
                ${ICONS.heart}
            </button>
        </article>
    `;
}

function bindCommentActions(list) {
    list.querySelectorAll("[data-like-comment]").forEach((button) => {
        button.addEventListener("click", () => {
            const article = button.closest(".comment");

            toggleCommentLike(article.dataset.commentId, article);
        });
    });

    list.querySelectorAll("[data-delete-comment]").forEach((button) => {
        button.addEventListener("click", () => {
            const article = button.closest(".comment");

            deleteComment(article.dataset.commentId, article);
        });
    });
}

async function toggleCommentLike(commentId, article) {
    const button = article.querySelector("[data-like-comment]");
    const counter = article.querySelector("[data-comment-likes]");

    const liked = isCommentLiked(commentId);

    const nextLiked = !liked;

    const baseline = Number(counter?.dataset.count) || 0;

    const nextCount = Math.max(0, baseline + (nextLiked ? 1 : -1));

    setCommentLikeVisual(button, counter, nextLiked, nextCount);

    try {
        await apiRequest(`/likes/comments/${encodeURIComponent(commentId)}`, {
            method: nextLiked ? "POST" : "DELETE"
        });

        setCommentLiked(commentId, nextLiked);
    } catch (error) {
        if (
            (nextLiked && error.status === 400) ||
            (!nextLiked && error.status === 404)
        ) {
            setCommentLiked(commentId, nextLiked);

            return;
        }

        setCommentLikeVisual(button, counter, liked, baseline);

        toast(error.message);
    }
}

function setCommentLikeVisual(button, counter, liked, count) {
    if (button) {
        button.classList.toggle("is-liked", liked);
        button.setAttribute("aria-pressed", String(liked));
        button.setAttribute(
            "aria-label",
            liked ? "Unlike comment" : "Like comment"
        );
    }

    if (counter) {
        counter.dataset.count = String(count);
        counter.textContent = count
            ? `${formatCount(count)} ${pluralize(count, "like")}`
            : "";
    }
}

async function createComment(event) {
    event.preventDefault();

    const input = document.getElementById("comment-text");
    const button = event.currentTarget.querySelector("[data-submit-comment]");

    const text = input.value.trim();

    if (!text) {
        return;
    }

    button.disabled = true;

    try {
        await apiRequest(`/comments/${encodeURIComponent(detailState.postId)}`, {
            method: "POST",
            body: JSON.stringify({ text })
        });

        input.value = "";

        await loadComments();

        document.querySelector(".detail-scroll")?.scrollTo({
            top: document.querySelector(".detail-scroll").scrollHeight,
            behavior: "smooth"
        });
    } catch (error) {
        toast(error.message);
    } finally {
        button.disabled = false;
    }
}

async function deleteComment(commentId, article) {
    const confirmed = await confirmDialog({
        title: "Delete comment?",
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel"
    });

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/comments/${encodeURIComponent(commentId)}`, {
            method: "DELETE"
        });

        article.style.opacity = "0";

        setTimeout(() => {
            article.remove();

            const list = document.getElementById("comments-list");

            if (list && !list.children.length) {
                loadComments();
            }
        }, 160);

        toast("Comment deleted.");
    } catch (error) {
        toast(error.message);
    }
}
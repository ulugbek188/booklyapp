/* ==========================================================================
   Bookly — feed.js
   Home feed: post cards, like interactions and the desktop right rail.
   Uses /posts/feed, /likes/posts/{id} and /follows/{username}/*.
   ========================================================================== */

(function initFeed() {
    if (!isLoggedIn()) {
        return;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const feedElement = document.getElementById("feed");

        if (!feedElement) {
            return;
        }

        renderFeedSkeletons(feedElement);

        let me = null;

        try {
            me = await getMe();
        } catch (error) {
            return;
        }

        renderAsideMe(me);

        loadConnectionsForShell(me.username);

        await loadFeed(me);
    });
})();

/* --------------------------------------------------------------------------
   1. Skeletons
   -------------------------------------------------------------------------- */

function renderFeedSkeletons(container, count = 2) {
    container.innerHTML = Array.from({ length: count })
        .map(
            () => `
                <div class="post-skeleton" aria-hidden="true">
                    <div class="post-skeleton-head">
                        <div class="skeleton" style="width:44px;height:44px;border-radius:50%"></div>

                        <div style="flex:1">
                            <div class="skeleton" style="width:38%;height:11px;margin-bottom:8px"></div>
                            <div class="skeleton" style="width:22%;height:9px"></div>
                        </div>
                    </div>

                    <div class="skeleton post-skeleton-media"></div>

                    <div class="post-skeleton-lines">
                        <div class="skeleton" style="width:30%;height:11px"></div>
                        <div class="skeleton" style="width:88%;height:11px"></div>
                        <div class="skeleton" style="width:64%;height:11px"></div>
                    </div>
                </div>
            `
        )
        .join("");
}

/* --------------------------------------------------------------------------
   2. Right rail
   -------------------------------------------------------------------------- */

async function loadConnectionsForShell(username) {
    const asideList = document.getElementById("aside-following");

    try {
        const following = await apiRequest(
            `/follows/${encodeURIComponent(username)}/following`
        );

        rememberUsers(following);

        renderAsideFollowing(asideList, following);
    } catch (error) {
        if (asideList) {
            asideList.innerHTML = `<p class="aside-empty">Could not load your readers.</p>`;
        }
    }
}

function renderAsideMe(me) {
    const element = document.getElementById("aside-me");

    if (!element || !me) {
        return;
    }

    element.innerHTML = `
        <a class="aside-me" href="profile.html">
            ${avatarMarkup(me, "avatar avatar-md")}

            <span class="aside-me-body">
                <strong class="truncate">${escapeHtml(me.username)}</strong>
                <span class="truncate">${escapeHtml(me.bio || "Your shelf")}</span>
            </span>
        </a>
    `;
}

function renderAsideFollowing(list, following) {
    if (!list) {
        return;
    }

    if (!following.length) {
        list.innerHTML = `
            <p class="aside-empty">
                You are not following anyone yet. Search for readers to fill your feed.
            </p>
        `;

        return;
    }

    list.innerHTML = following
        .slice(0, 5)
        .map(
            (user) => `
                <a class="user-row" href="${profileHref(user.username)}">
                    ${avatarMarkup(user)}

                    <span class="user-row-body">
                        <span class="user-row-name truncate">${escapeHtml(user.username)}</span>
                        <span class="user-row-meta truncate">${escapeHtml(
                            user.bio || "Bookly reader"
                        )}</span>
                    </span>
                </a>
            `
        )
        .join("");
}

/* --------------------------------------------------------------------------
   3. Feed
   -------------------------------------------------------------------------- */

async function loadFeed(me) {
    const feedElement = document.getElementById("feed");

    if (!feedElement) {
        return;
    }

    try {
        const posts = await apiRequest("/posts/feed");

        feedElement.innerHTML = "";

        if (!posts || !posts.length) {
            feedElement.innerHTML = `
                <div class="state">
                    ${ICONS.book}
                    <h2>Your feed is quiet</h2>
                    <p>
                        Follow other readers or share the first book from your
                        own shelf to get things started.
                    </p>
                    <a class="btn btn-primary btn-lg" href="create_post.html">
                        Share a book
                    </a>
                </div>
            `;

            return;
        }

        posts.forEach((post, index) => {
            const element = createPostElement(post, me);

            element.style.animationDelay = `${Math.min(index, 6) * 40}ms`;

            feedElement.appendChild(element);
        });
    } catch (error) {
        feedElement.innerHTML = `
            <div class="state">
                ${ICONS.book}
                <h2>Could not load your feed</h2>
                <p>${escapeHtml(error.message)}</p>
                <button class="btn btn-primary" type="button" id="retry-feed">
                    Try again
                </button>
            </div>
        `;

        document.getElementById("retry-feed")?.addEventListener("click", () => {
            renderFeedSkeletons(feedElement);
            loadFeed(me);
        });
    }
}

/* --------------------------------------------------------------------------
   4. Post card
   -------------------------------------------------------------------------- */

function postMediaMarkup(post) {
    if (post.cover) {
        return `
            <div class="post-media" data-media>
                <img
                    src="${assetUrl(post.cover)}"
                    alt="Cover of ${escapeHtml(post.title)}"
                    loading="lazy"
                >
                <span class="post-burst" data-burst>${ICONS.heart}</span>
            </div>
        `;
    }

    return `
        <div class="post-media post-media-blank" data-media>
            <span class="blank-label">Bookly</span>
            <span class="blank-title">${escapeHtml(post.title)}</span>
            <span class="blank-gist">${escapeHtml(post.gist)}</span>
            <span class="post-burst" data-burst>${ICONS.heart}</span>
        </div>
    `;
}

function createPostElement(post, me) {
    const article = document.createElement("article");

    article.className = "post";
    article.dataset.postId = String(post.id);

    const authorName = displayNameForId(post.user_id);

    const authorKnown = Boolean(usernameForId(post.user_id));

    const isOwn = me && post.user_id === me.id;

    const liked = isPostLiked(post.id);

    const likes = Number(post.likes_count) || 0;

    const comments = Number(post.comments_count) || 0;

    const authorTag = authorKnown
        ? `<a class="post-author" href="${profileHref(authorName)}">${escapeHtml(authorName)}</a>`
        : `<span class="post-author">${escapeHtml(authorName)}</span>`;

    article.innerHTML = `
        <header class="post-head">
            ${
                authorKnown
                    ? `<a href="${profileHref(authorName)}" aria-label="${escapeHtml(authorName)}">
                           ${avatarMarkup(userRefForId(post.user_id), "avatar avatar-md")}
                       </a>`
                    : `${avatarMarkup(userRefForId(post.user_id), "avatar avatar-md")}`
            }

            <div class="post-head-body">
                ${authorTag}

                <span class="post-head-meta">
                    <span>${escapeHtml(timeAgo(post.created_at))}</span>
                    <span class="dot-sep">${escapeHtml(
                        permissionLabel(post.comment_permission)
                    )}</span>
                </span>
            </div>

            <button class="post-more" type="button" data-more aria-label="Post options">
                ${ICONS.more}
            </button>
        </header>

        ${postMediaMarkup(post)}

        <div class="post-actions">
            <button
                class="post-action${liked ? " is-liked" : ""}"
                type="button"
                data-like
                aria-pressed="${liked}"
                aria-label="${liked ? "Unlike" : "Like"}"
            >
                ${ICONS.heart}
            </button>

            <a
                class="post-action"
                href="comments.html?post_id=${encodeURIComponent(post.id)}"
                aria-label="Comments"
            >
                ${ICONS.comment}
            </a>
        </div>

        <div class="post-body">
            <span class="post-likes" data-likes data-count="${likes}">
                ${formatCount(likes)} ${pluralize(likes, "like")}
            </span>

            <p class="post-caption">
                ${authorTag}
                <span class="post-title">${escapeHtml(post.title)}</span>
            </p>

            <p class="post-caption post-gist">${escapeHtml(post.gist)}</p>

            <p class="post-caption post-description is-clamped" data-description>${escapeHtml(
                post.description
            )}</p>

            <button class="post-more-text" type="button" data-expand>more</button>

            <a
                class="post-comments-link"
                href="comments.html?post_id=${encodeURIComponent(post.id)}"
            >
                ${
                    comments
                        ? `View all ${formatCount(comments)} ${pluralize(comments, "comment")}`
                        : post.comment_permission === "nobody"
                          ? "Comments are turned off"
                          : "Add a comment"
                }
            </a>

            <span class="post-time">${escapeHtml(formatLongDate(post.created_at))}</span>
        </div>
    `;

    bindPostElement(article, post, isOwn);

    return article;
}

function bindPostElement(article, post, isOwn) {
    const likeButton = article.querySelector("[data-like]");
    const media = article.querySelector("[data-media]");
    const burst = article.querySelector("[data-burst]");
    const expand = article.querySelector("[data-expand]");
    const description = article.querySelector("[data-description]");

    likeButton?.addEventListener("click", () => {
        togglePostLike(post.id, article);
    });

    const finePointer =
        window.matchMedia &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let lastTap = 0;

    media?.addEventListener("click", () => {
        if (finePointer) {
            window.location.href = `comments.html?post_id=${encodeURIComponent(
                post.id
            )}`;

            return;
        }

        const now = Date.now();

        if (now - lastTap < 320) {
            lastTap = 0;

            if (!isPostLiked(post.id)) {
                togglePostLike(post.id, article, burst);
            } else {
                playBurst(burst);
            }

            return;
        }

        lastTap = now;
    });

    media?.addEventListener("dblclick", (event) => {
        event.preventDefault();
    });

    if (description && expand) {
        requestAnimationFrame(() => {
            const overflowing =
                description.scrollHeight - description.clientHeight > 2;

            if (!overflowing) {
                expand.remove();
            }
        });

        expand.addEventListener("click", () => {
            description.classList.remove("is-clamped");
            expand.remove();
        });
    }

    article.querySelector("[data-more]")?.addEventListener("click", () => {
        openPostMenu(post, isOwn, article);
    });
}

function playBurst(burst) {
    if (!burst) {
        return;
    }

    burst.classList.remove("is-active");

    void burst.offsetWidth;

    burst.classList.add("is-active");
}

async function togglePostLike(postId, article, burst) {
    const button = article.querySelector("[data-like]");
    const counter = article.querySelector("[data-likes]");

    const liked = isPostLiked(postId);

    const nextLiked = !liked;

    const baseline = Number(counter?.dataset.count) || 0;

    applyLikeState(
        button,
        counter,
        nextLiked,
        Math.max(0, baseline + (nextLiked ? 1 : -1))
    );

    if (nextLiked) {
        playBurst(burst);
    }

    try {
        await apiRequest(`/likes/posts/${encodeURIComponent(postId)}`, {
            method: nextLiked ? "POST" : "DELETE"
        });

        setPostLiked(postId, nextLiked);
    } catch (error) {
        const alreadyLiked =
            nextLiked && error.status === 400;

        const alreadyUnliked = !nextLiked && error.status === 404;

        if (alreadyLiked || alreadyUnliked) {
            setPostLiked(postId, nextLiked);

            return;
        }

        applyLikeState(button, counter, liked, baseline);

        toast(error.message);
    }
}

function applyLikeState(button, counter, liked, count) {
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

/* --------------------------------------------------------------------------
   5. Post menu
   -------------------------------------------------------------------------- */

function openPostMenu(post, isOwn, article) {
    const authorName = displayNameForId(post.user_id);

    const known = Boolean(usernameForId(post.user_id));

    const card = openModal(`
        <div class="modal-head">
            <h2 class="title-lg">${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(permissionLabel(post.comment_permission))}</p>
        </div>

        <div class="modal-actions">
            <a
                class="modal-action"
                href="comments.html?post_id=${encodeURIComponent(post.id)}"
            >
                Open post
            </a>

            ${
                known && !isOwn
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

    card.querySelector("[data-cancel]")?.addEventListener("click", closeModal);

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

            article.style.opacity = "0";

            setTimeout(() => {
                article.remove();

                const feedElement = document.getElementById("feed");

                if (feedElement && !feedElement.children.length) {
                    feedElement.innerHTML = `
                        <div class="state">
                            ${ICONS.book}
                            <h2>Your feed is quiet</h2>
                            <p>Share a book to bring it back to life.</p>
                            <a class="btn btn-primary btn-lg" href="create_post.html">
                                Share a book
                            </a>
                        </div>
                    `;
                }
            }, 180);

            toast("Post deleted.");
        } catch (error) {
            toast(error.message);
        }
    });
}
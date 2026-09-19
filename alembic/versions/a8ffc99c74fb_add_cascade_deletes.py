"""add cascade deletes

Revision ID: a8ffc99c74fb
Revises: f885cfa17602
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op


revision: str = "a8ffc99c74fb"
down_revision: Union[str, Sequence[str], None] = "f885cfa17602"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Comments
    op.drop_constraint(
        "comments_user_id_fkey",
        "comments",
        type_="foreignkey",
    )

    op.drop_constraint(
        "comments_post_id_fkey",
        "comments",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "comments_user_id_fkey",
        "comments",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "comments_post_id_fkey",
        "comments",
        "posts",
        ["post_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Follows
    op.drop_constraint(
        "follows_follower_id_fkey",
        "follows",
        type_="foreignkey",
    )

    op.drop_constraint(
        "follows_following_id_fkey",
        "follows",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "follows_follower_id_fkey",
        "follows",
        "users",
        ["follower_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "follows_following_id_fkey",
        "follows",
        "users",
        ["following_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Likes
    op.drop_constraint(
        "likes_user_id_fkey",
        "likes",
        type_="foreignkey",
    )

    op.drop_constraint(
        "likes_post_id_fkey",
        "likes",
        type_="foreignkey",
    )

    op.drop_constraint(
        "likes_comment_id_fkey",
        "likes",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "likes_user_id_fkey",
        "likes",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "likes_post_id_fkey",
        "likes",
        "posts",
        ["post_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "likes_comment_id_fkey",
        "likes",
        "comments",
        ["comment_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Posts
    op.drop_constraint(
        "posts_user_id_fkey",
        "posts",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "posts_user_id_fkey",
        "posts",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Sessions
    op.drop_constraint(
        "sessions_user_id_fkey",
        "sessions",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "sessions_user_id_fkey",
        "sessions",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    # Sessions
    op.drop_constraint(
        "sessions_user_id_fkey",
        "sessions",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "sessions_user_id_fkey",
        "sessions",
        "users",
        ["user_id"],
        ["id"],
    )

    # Posts
    op.drop_constraint(
        "posts_user_id_fkey",
        "posts",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "posts_user_id_fkey",
        "posts",
        "users",
        ["user_id"],
        ["id"],
    )

    # Likes
    op.drop_constraint(
        "likes_user_id_fkey",
        "likes",
        type_="foreignkey",
    )

    op.drop_constraint(
        "likes_post_id_fkey",
        "likes",
        type_="foreignkey",
    )

    op.drop_constraint(
        "likes_comment_id_fkey",
        "likes",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "likes_user_id_fkey",
        "likes",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_foreign_key(
        "likes_post_id_fkey",
        "likes",
        "posts",
        ["post_id"],
        ["id"],
    )

    op.create_foreign_key(
        "likes_comment_id_fkey",
        "likes",
        "comments",
        ["comment_id"],
        ["id"],
    )

    # Follows
    op.drop_constraint(
        "follows_follower_id_fkey",
        "follows",
        type_="foreignkey",
    )

    op.drop_constraint(
        "follows_following_id_fkey",
        "follows",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "follows_follower_id_fkey",
        "follows",
        "users",
        ["follower_id"],
        ["id"],
    )

    op.create_foreign_key(
        "follows_following_id_fkey",
        "follows",
        "users",
        ["following_id"],
        ["id"],
    )

    # Comments
    op.drop_constraint(
        "comments_user_id_fkey",
        "comments",
        type_="foreignkey",
    )

    op.drop_constraint(
        "comments_post_id_fkey",
        "comments",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "comments_user_id_fkey",
        "comments",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_foreign_key(
        "comments_post_id_fkey",
        "comments",
        "posts",
        ["post_id"],
        ["id"],
    )
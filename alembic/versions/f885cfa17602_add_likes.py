"""add likes

Revision ID: f885cfa17602
Revises: d764d8a646ab
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f885cfa17602"
down_revision: Union[str, Sequence[str], None] = "d764d8a646ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=True),
        sa.Column("comment_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["comment_id"],
            ["comments.id"],
        ),
        sa.ForeignKeyConstraint(
            ["post_id"],
            ["posts.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "comment_id",
            name="unique_comment_like",
        ),
        sa.UniqueConstraint(
            "user_id",
            "post_id",
            name="unique_ppost_like",
        ),
    )

    op.create_index(
        "ix_likes_id",
        "likes",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_likes_id",
        table_name="likes",
    )

    op.drop_table("likes")
"""add comments and comment permission

Revision ID: 4c8258dce283
Revises: 5567e049ff15
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4c8258dce283"
down_revision: Union[str, Sequence[str], None] = "5567e049ff15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "posts",
        sa.Column(
            "comment_permission",
            sa.String(length=20),
            nullable=False,
            server_default="anyone",
        ),
    )

    op.alter_column(
        "posts",
        "comment_permission",
        server_default=None,
    )

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
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
    )

    op.create_index(
        "ix_comments_id",
        "comments",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_comments_id",
        table_name="comments",
    )

    op.drop_table("comments")

    op.drop_column(
        "posts",
        "comment_permission",
    )
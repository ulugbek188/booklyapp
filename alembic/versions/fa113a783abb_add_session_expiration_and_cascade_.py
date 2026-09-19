"""fix post like constraint

Revision ID: fa113a783abb
Revises: a8ffc99c74fb
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op


revision: str = "fa113a783abb"
down_revision: Union[str, Sequence[str], None] = "a8ffc99c74fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "unique_ppost_like",
        "likes",
        type_="unique",
    )

    op.create_unique_constraint(
        "unique_post_like",
        "likes",
        ["user_id", "post_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "unique_post_like",
        "likes",
        type_="unique",
    )

    op.create_unique_constraint(
        "unique_ppost_like",
        "likes",
        ["user_id", "post_id"],
    )
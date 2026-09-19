"""make post gist unique

Revision ID: 83cb9918aacb
Revises: 5567e049ff15
Create Date: 2026-09-14 10:57:13.880155
"""

from typing import Sequence, Union

from alembic import op


revision: str = "83cb9918aacb"
down_revision: Union[str, Sequence[str], None] = "5567e049ff15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "unique_post_gist",
        "posts",
        ["gist"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "unique_post_gist",
        "posts",
        type_="unique",
    )
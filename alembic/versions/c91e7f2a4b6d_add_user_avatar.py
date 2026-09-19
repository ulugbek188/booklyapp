"""add user avatar

Revision ID: c91e7f2a4b6d
Revises: fa113a783abb
Create Date: 2026-09-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c91e7f2a4b6d"
down_revision: Union[str, Sequence[str], None] = "fa113a783abb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "avatar_url",
            sa.String(length=500),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "users",
        "avatar_url",
    )
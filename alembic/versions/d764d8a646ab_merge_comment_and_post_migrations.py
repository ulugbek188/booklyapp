"""merge comment and post migrations

Revision ID: d764d8a646ab
Revises: 4c8258dce283, 83cb9918aacb
Create Date: 2026-09-14
"""

from typing import Sequence, Union


revision: str = "d764d8a646ab"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = (
    "4c8258dce283",
    "83cb9918aacb",
)

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
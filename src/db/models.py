from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from src.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    bio = Column(
        String(500),
        nullable=True,
    )

    avatar_url = Column(
        String(500),
        nullable=True,
    )

    is_private = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    sessions = relationship(
        "Session",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    posts = relationship(
        "Post",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    comments = relationship(
        "Comment",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    likes = relationship(
        "Like",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    token_hash = Column(
        String(255),
        unique=True,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="sessions",
    )


class Follow(Base):
    __tablename__ = "follows"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    follower_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    following_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="accepted",
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint(
            "follower_id",
            "following_id",
            name="unique_follow",
        ),
    )


class Post(Base):
    __tablename__ = "posts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    cover = Column(
        String(500),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=False,
    )

    gist = Column(
        Text,
        unique=True,
        nullable=False,
    )

    comment_permission = Column(
        String(20),
        nullable=False,
        default="anyone",
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship(
        "User",
        back_populates="posts",
    )

    comments = relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan",
    )

    likes = relationship(
        "Like",
        back_populates="post",
        cascade="all, delete-orphan",
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    post_id = Column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
    )

    text = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship(
        "User",
        back_populates="comments",
    )

    post = relationship(
        "Post",
        back_populates="comments",
    )

    likes = relationship(
        "Like",
        back_populates="comment",
        cascade="all, delete-orphan",
    )


class Like(Base):
    __tablename__ = "likes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    post_id = Column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True,
    )

    comment_id = Column(
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "post_id",
            name="unique_post_like",
        ),
        UniqueConstraint(
            "user_id",
            "comment_id",
            name="unique_comment_like",
        ),
    )

    post = relationship(
        "Post",
        back_populates="likes",
    )

    comment = relationship(
        "Comment",
        back_populates="likes",
    )

    user = relationship(
        "User",
        back_populates="likes",
    )
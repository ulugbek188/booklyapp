import hashlib
import uuid

import bcrypt


def hash_password(password: str) -> str:
    hashed_password = bcrypt.hashpw(
        password.encode(),
        bcrypt.gensalt()
    )

    return hashed_password.decode()


def check_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode(),
        hashed_password.encode()
    )


def create_token() -> str:
    return str(uuid.uuid4())


def hash_token(token: str) -> str:
    return hashlib.sha256(
        token.encode()
    ).hexdigest()
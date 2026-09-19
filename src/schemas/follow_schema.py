from datetime import datetime

from pydantic import BaseModel, ConfigDict

class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
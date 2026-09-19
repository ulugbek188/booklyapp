from fastapi import Request
from fastapi.responses import JSONResponse

async def internal_server_error_handler(
    request: Request,
    exc: Exception,
):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
        },
    )
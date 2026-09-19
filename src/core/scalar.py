from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference

def setup_scalar(app: FastAPI) -> None:
    app.get(
        "/scalar",
        include_in_schema=False,       
    )(
        lambda: get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=app.title,
        )
    )
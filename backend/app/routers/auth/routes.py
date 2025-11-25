from fastapi import APIRouter, HTTPException, Depends, Body, Response, Request

from app.services.auth.auth_service import AuthService
from app.utils.response import APIResponse
from app.dependencies.auth_dependency import AuthDependency

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/login")
async def login(
    request: Request,
    response: Response,
    service: AuthService = Depends()
):
    body = await request.json()
    username = body.get("username")
    password = body.get("password")
    try:
        return service.login(username, password, request, response)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to login", error_detail=str(e))
    
# @auth_router.post("/logout")
# def logout(service: AuthService = Depends()):
#     return service.logout()

@auth_router.post("/refresh-token")
def refresh_token(
    request: Request,
    service: AuthService = Depends()
):
    refresh_cookie = request.cookies.get("refresh_token")

    if not refresh_cookie:
        raise HTTPException(
            status_code=401,
            detail="Missing refresh token cookie"
        )

    return service.refresh_access_token(refresh_cookie)

@auth_router.post("/logout")
def logout(
    refresh_token: str = Body(None, embed=True),
    service: AuthService = Depends(),
    current_user = Depends(AuthDependency.get_current_user)
):
    return service.logout(current_user.id, refresh_token)

# For Swagger
from fastapi.security import OAuth2PasswordRequestForm
import json

@auth_router.post("/login-form")
def login_form(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(),
):
    try:
        login_response = service.login(
            form_data.username,
            form_data.password,
            request,
            response
        )
    except Exception as e:
        print("🔥 LOGIN SERVICE ERROR:", str(e))
        raise

    try:
        body_bytes = login_response.body

        content_dict = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        print("🔥 PARSING ERROR:", str(e))
        raise

    # Now try to extract the token safely
    if "data" in content_dict and "access_token" in content_dict["data"]:
        token = content_dict["data"]["access_token"]
    elif "access_token" in content_dict:
        token = content_dict["access_token"]
    else:
        print("🔥 No token in response:", content_dict)
        raise HTTPException(500, "Token not found in login response")

    return {
        "access_token": token,
        "token_type": "bearer"
    }
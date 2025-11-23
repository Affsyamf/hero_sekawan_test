from fastapi import APIRouter, HTTPException, Depends, Body, Request

from app.services.auth.auth_service import AuthService
from app.utils.response import APIResponse
from app.dependencies.auth_dependency import AuthDependency

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/login")
def login(request: dict = Body(...), service: AuthService = Depends()):
    username = request.get("username")
    password = request.get("password")
    try:
        return service.login(username, password)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to login", error_detail=str(e))
    
# @auth_router.post("/logout")
# def logout(service: AuthService = Depends()):
#     return service.logout()

@auth_router.post("/refresh-token")
def refresh_token(
    refresh_token: str = Body(..., embed=True),
    service: AuthService = Depends()
):
    return service.refresh_access_token(refresh_token)

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
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends()
):
    # Call your JSON login route
    login_response = service.login(form_data.username, form_data.password)

    # login_response is a JSONResponse → convert to dict
    content_dict = json.loads(login_response.body.decode("utf-8"))

    # Extract access_token from your APIResponse format
    token = content_dict["data"]["access_token"]

    # Return the OAuth2-compatible shape
    return {
        "access_token": token,
        "token_type": "bearer"
    }
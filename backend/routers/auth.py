"""Authentication routes: signup, login, logout, session check."""


import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..ratelimit import limit
from ..schemas import (
    AuthStatus, LoginIn, PasswordChangeIn, ProfileUpdateIn, SignupIn, UserOut,
)
from ..security import get_current_user, hash_password, verify_password

logger = logging.getLogger("nutrifit.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, name=user.full_name, email=user.email, phone=user.phone)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limit("10/hour")
def signup(request: Request, payload: SignupIn, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Email already registered")
    user = User(
        full_name=payload.name,
        email=email,
        phone=(payload.phone or "").strip() or None,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("New signup: %s", email)
    return {"success": True, "message": "Signup successful! Please log in."}


@router.post("/login")
@limit("20/hour")
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Generic message avoids leaking which emails are registered.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")
    request.session["user_id"] = user.id
    return {"success": True, "message": "Login successful",
            "user": _user_out(user), "redirect": "/dashboard"}


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"success": True, "message": "Logout successful"}


@router.get("/me", response_model=AuthStatus)
def me(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return AuthStatus(authenticated=False)
    user = db.get(User, user_id)
    if not user:
        request.session.clear()
        return AuthStatus(authenticated=False)
    return AuthStatus(authenticated=True, user=_user_out(user))


@router.patch("/me")
def update_profile(payload: ProfileUpdateIn, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        user.full_name = name
    if payload.phone is not None:
        user.phone = payload.phone.strip() or None
    db.commit()
    db.refresh(user)
    return {"success": True, "user": _user_out(user)}


@router.post("/change-password")
@limit("10/hour")
def change_password(request: Request, payload: PasswordChangeIn,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password updated."}


@router.delete("/account")
def delete_account(request: Request, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    db.delete(user)  # weight logs cascade via relationship
    db.commit()
    request.session.clear()
    return {"success": True, "message": "Account deleted."}

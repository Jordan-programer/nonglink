"""Create (or promote) a superadmin user.

Run manually, once, per environment (prompts for email/name/password so the
password never has to be typed into a shell history or committed anywhere):
    cd backend && .venv/bin/python scripts/create_superadmin.py

If the email already exists, promotes that user to superadmin instead of
creating a duplicate.
"""
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password


def main() -> None:
    db = SessionLocal()
    try:
        email = input("Email: ").strip().lower()
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            existing.role = UserRole.SUPERADMIN
            existing.is_active = True
            existing.email_verified = True
            db.commit()
            print(f"Existing user '{email}' promoted to superadmin.")
            return

        name = input("Name: ").strip()
        password = getpass.getpass("Password: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Passwords don't match.", file=sys.stderr)
            sys.exit(1)

        user = User(
            name=name,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.SUPERADMIN,
            is_active=True,
            email_verified=True,
        )
        db.add(user)
        db.commit()
        print(f"Superadmin '{email}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

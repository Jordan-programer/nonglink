import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment variables before importing application modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-123"

from app.core.database import Base, get_db
from app.main import app
from app.models.farm import Farm
from app.models.user import User, UserRole
from app.utils.security import create_access_token, hash_password

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def owner_user(db):
    user = User(
        name="Owner Farmer",
        email="owner@test.com",
        hashed_password=hash_password("secret123"),
        role=UserRole.FARMER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def other_user(db):
    user = User(
        name="Other Farmer",
        email="other@test.com",
        hashed_password=hash_password("secret123"),
        role=UserRole.FARMER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def owner_headers(owner_user):
    token = create_access_token(str(owner_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_headers(other_user):
    token = create_access_token(str(other_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def owner_farm(db, owner_user):
    farm = Farm(
        name="Fazenda do Dono",
        owner_id=owner_user.id,
        location="Huambo",
        size_hectares=10.0,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@pytest.fixture
def other_farm(db, other_user):
    farm = Farm(
        name="Fazenda de Outro",
        owner_id=other_user.id,
        location="Benguela",
        size_hectares=20.0,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

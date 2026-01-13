from sqlalchemy import StaticPool
from sqlalchemy.orm import DeclarativeBase

from typing import AsyncGenerator

from app.config import get_settings

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


settings = get_settings()

database_url = settings.DATABASE_URL
if database_url.startswith("sqlite:///"):
    database_url = database_url.replace("sqlite:///","sqlite+aiosqlite:///")

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    poolclass=StaticPool if "sqlite" in database_url else None
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        from app.models import users, messages

        await conn.run_sync(Base.metadata.create_all)

async def close_db():
    await engine.dispose()

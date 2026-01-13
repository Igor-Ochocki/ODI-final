import hashlib
import secrets

from app.config import get_settings

from passlib.context import CryptContext


settings = get_settings()

class CryptoService:
    pwd_context = CryptContext(
        schemes=["argon2"],
        deprecated="auto",
        argon2__memory_cost=settings.ARGON2_MEMORY_COST,
        argon2__time_cost=settings.ARGON2_TIME_COST,
        argon2__parallelism=settings.ARGON2_PARALLELISM,
        argon2__hash_len=settings.ARGON2_HASH_LENGTH,
        argon2__salt_len=settings.ARGON2_SALT_LENGTH,
    )

    @staticmethod
    def hash_password(password: str) -> str:
        return CryptoService.pwd_context.hash(password)
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        try:
            return CryptoService.pwd_context.verify(password, password_hash)
        except Exception:
            return False
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        return secrets.token_hex(length)
    
    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode('utf-8')).hexdigest()
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> list:
        alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
        codes = []
        for _ in range(count):
            code = ''.join(secrets.choice(alphabet) for _ in range(8))
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes

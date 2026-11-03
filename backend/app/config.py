from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    admin_email: str = "admin@helpdesk.com"
    admin_password: str
    secret_key: str = "dev-only-change-me-7f3a9c1e5b2d4f60a8c3e1b9d7f5a2c4"
    access_token_expire_minutes: int = 60


settings = Settings()
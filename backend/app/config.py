from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    admin_email: str = "admin@helpdesk.com"
    admin_password: str


settings = Settings()
from pydantic import BaseModel, model_validator


class GoogleLoginRequest(BaseModel):
    id_token: str


class FacebookLoginRequest(BaseModel):
    access_token: str | None = None
    code: str | None = None
    redirect_uri: str | None = None

    @model_validator(mode="after")
    def require_token_or_code(self):
        if not self.access_token and not (self.code and self.redirect_uri):
            raise ValueError("Fornece access_token ou code + redirect_uri")
        return self

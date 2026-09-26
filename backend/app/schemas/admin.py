from pydantic import BaseModel
from typing import Any, Dict


class SettingUpdate(BaseModel):
    value: Any


class SettingResponse(BaseModel):
    key: str
    value: Any
    description: str

    class Config:
        from_attributes = True


class AdminSettingsMap(BaseModel):
    settings: Dict[str, Any]

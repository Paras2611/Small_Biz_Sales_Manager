from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    name: str
    company: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    @model_validator(mode="after")
    def check_at_least_one_contact(self):
        if not self.email and not self.phone:
            raise ValueError("At least one contact method (email or phone) is required.")
        return self


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    company: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    sku: str
    name: str
    category: str = "Software"
    unit_price: Decimal
    tax_rate: Decimal = Decimal("18.0")
    active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

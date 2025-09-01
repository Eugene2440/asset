from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import List
from app.core.firebase import get_firestore_db

router = APIRouter()

class AssetModelResponse(BaseModel):
    id: str
    asset_make: str
    asset_model: str
    asset_type: str

@router.get("/asset-models", response_model=List[AssetModelResponse])
async def get_asset_models(
    db = Depends(get_firestore_db),
):
    asset_models_ref = db.collection('asset_models')
    all_asset_models = asset_models_ref.stream()
    
    asset_models_list = []
    for model in all_asset_models:
        model_dict = model.to_dict()
        model_dict['id'] = model.id
        asset_models_list.append(model_dict)

    return asset_models_list

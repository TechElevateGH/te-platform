from typing import Any, Dict, List

import app.database.session as session
import app.ents.home.crud as home_crud
import app.ents.home.schema as home_schema
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

home_router = APIRouter(prefix="/home")


@home_router.get(".team", response_model=Dict[str, list[home_schema.Team]])
def get_team(db: Session = Depends(session.get_db)) -> Any:
    """
    Retrieve all active team.
    """
    team = home_crud.read_team()
    return {"team": [home_schema.Team(**vars(member)) for member in team]}


@home_router.get(
    ".beneficiaries", response_model=Dict[str, list[home_schema.Beneficiary]]
)
def get_beneficiaries(db: Session = Depends(session.get_db)) -> Any:
    """
    Retrieve all active beneficiaries.
    """
    beneficiaries = home_crud.read_beneficiaries()
    return {
        "beneficiaries": [
            home_schema.Beneficiary(**vars(member)) for member in beneficiaries
        ]
    }


@home_router.get(".partners", response_model=Dict[str, list[home_schema.Partner]])
def get_partners(db: Session = Depends(session.get_db)) -> Any:
    """
    Retrieve all active partners.
    """
    partners = home_crud.read_partner()
    return {"partners": [home_schema.Partner(**vars(partner)) for partner in partners]}

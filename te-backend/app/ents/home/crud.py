import app.ents.home.models as home_models
from typing import Optional
from pymongo.database import Database


def read_team(db: Database) -> Optional[home_models.Team]:
    return db.query(home_models.Team).all()


def read_beneficiaries(db: Database) -> Optional[home_models.Beneficiary]:
    return db.query(home_models.Team).all()


def read_partners(db: Database) -> Optional[home_models.Partner]:
    return db.query(home_models.Partner).all()

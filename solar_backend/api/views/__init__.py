"""API view exports."""

from .solar_systems import SolarSystemListCreate, SolarSystemDetail
from .energy_readings import EnergyReadingListCreate, upload_energy_csv
from .location import resolve_location, compute_solar_zone
from .weather import fetch_weather
from .predictions import (
    run_prediction,
    prediction_history,
    prediction_compare,
    prediction_forecast,
)
from .reports import reports_summary
from .calculator import solar_potential, calculator

__all__ = [
    "SolarSystemListCreate",
    "SolarSystemDetail",
    "EnergyReadingListCreate",
    "upload_energy_csv",
    "resolve_location",
    "compute_solar_zone",
    "fetch_weather",
    "run_prediction",
    "prediction_history",
    "prediction_compare",
    "prediction_forecast",
    "reports_summary",
    "solar_potential",
    "calculator",
]


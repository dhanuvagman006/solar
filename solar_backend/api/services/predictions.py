"""Prediction service wrapper for ML inference."""

from datetime import datetime

from .weather import get_season_from_month


def predict_all_models(features_dict):
    """Run all ML models via the loader."""
    from ..ml_loader import predict_all
    return predict_all(features_dict)


def build_feature_payload(base, day_date, weather):
    """Build ML feature payload for a given day."""
    day_dt = datetime.strptime(day_date, "%Y-%m-%d")
    day_of_year = int(day_dt.strftime("%j"))
    month = day_dt.month

    return {
        "latitude": base["latitude"],
        "longitude": base["longitude"],
        "solar_zone": base["solar_zone"],
        "hour": base.get("hour", 12),
        "day_of_year": day_of_year,
        "month": month,
        "season": get_season_from_month(month),
        "size_kw": base["size_kw"],
        "panel_wattage": base["panel_wattage"],
        "panel_count": base["panel_count"],
        "area_m2": base["area_m2"],
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "solar_irradiance": weather["solar_irradiance"],
        "wind_speed": weather["wind_speed"],
        "cloud_cover": weather["cloud_cover"],
        "uv_index": weather["uv_index"],
        "efficiency": base["efficiency"],
        "performance_ratio": base["performance_ratio"],
    }


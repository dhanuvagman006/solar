"""Weather service for Open-Meteo and geocoding utilities."""

from collections import defaultdict
from datetime import datetime

import requests
from django.conf import settings
from django.core.cache import cache


def get_season_from_month(month):
    """Return season encoding from month."""
    if month in [3, 4, 5]:
        return 0  # Summer
    if month in [6, 7, 8, 9]:
        return 1  # Monsoon
    return 2  # Winter


def _cache_key(prefix, lat, lon, extra=None):
    base = f"{prefix}:{round(lat, 4)}:{round(lon, 4)}"
    if extra:
        return f"{base}:{extra}"
    return base


def fetch_current_weather(lat, lon, timezone="Asia/Kolkata"):
    """Fetch current weather data, with cache + fallback."""
    cache_key = _cache_key("weather:current", lat, lon)
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        resp = requests.get(
            settings.OPEN_METEO_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": (
                    "temperature_2m,relative_humidity_2m,wind_speed_10m,"
                    "cloud_cover,uv_index,direct_radiation,diffuse_radiation,"
                    "surface_pressure"
                ),
                "timezone": timezone,
            },
            timeout=settings.OPEN_METEO_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})

        temperature = current.get("temperature_2m", 30.0)
        humidity = current.get("relative_humidity_2m", 50.0)
        wind_speed = current.get("wind_speed_10m", 3.0)
        cloud_cover = current.get("cloud_cover", 20.0)
        uv_index = current.get("uv_index", 5.0)

        direct = current.get("direct_radiation", 0) or 0
        diffuse = current.get("diffuse_radiation", 0) or 0
        solar_irradiance = direct + diffuse

        if solar_irradiance <= 0 and current.get("is_day", 0) == 1:
            solar_irradiance = max(0, (1000 - cloud_cover * 8) * (uv_index / 10))

    except Exception:
        now = datetime.now()
        hour = now.hour
        month = now.month
        season = get_season_from_month(month)

        temperature = {0: 35, 1: 28, 2: 22}.get(season, 28)
        humidity = {0: 35, 1: 75, 2: 45}.get(season, 50)
        wind_speed = 3.5
        cloud_cover = {0: 20, 1: 65, 2: 25}.get(season, 30)
        uv_index = 6.0 if 8 <= hour <= 16 else 1.0
        solar_irradiance = (
            max(0, 800 * (1 - cloud_cover / 100) * 0.7)
            if 6 <= hour <= 18
            else 0
        )

    weather = {
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "solar_irradiance": round(solar_irradiance, 2),
        "wind_speed": round(wind_speed, 2),
        "cloud_cover": round(cloud_cover, 2),
        "uv_index": round(uv_index, 2),
        "season": get_season_from_month(datetime.now().month),
    }
    cache.set(cache_key, weather, settings.WEATHER_CACHE_TTL_SECONDS)
    return weather


def fetch_daily_forecast(lat, lon, days=7, timezone="Asia/Kolkata"):
    """Fetch hourly forecast and aggregate into daily averages."""
    days = max(1, min(days, 14))
    cache_key = _cache_key("weather:forecast", lat, lon, extra=days)
    cached = cache.get(cache_key)
    if cached:
        return cached

    resp = requests.get(
        settings.OPEN_METEO_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "hourly": (
                "temperature_2m,relative_humidity_2m,wind_speed_10m,"
                "cloud_cover,uv_index,direct_radiation,diffuse_radiation"
            ),
            "forecast_days": days,
            "timezone": timezone,
        },
        timeout=settings.OPEN_METEO_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        return []

    metrics = defaultdict(lambda: defaultdict(list))
    for idx, time_str in enumerate(times):
        date_key = time_str.split("T")[0]
        metrics[date_key]["temperature"].append(_safe_val(hourly, "temperature_2m", idx))
        metrics[date_key]["humidity"].append(_safe_val(hourly, "relative_humidity_2m", idx))
        metrics[date_key]["wind_speed"].append(_safe_val(hourly, "wind_speed_10m", idx))
        metrics[date_key]["cloud_cover"].append(_safe_val(hourly, "cloud_cover", idx))
        metrics[date_key]["uv_index"].append(_safe_val(hourly, "uv_index", idx))

        direct = _safe_val(hourly, "direct_radiation", idx)
        diffuse = _safe_val(hourly, "diffuse_radiation", idx)
        metrics[date_key]["solar_irradiance"].append(direct + diffuse)

    daily = []
    for date_key in sorted(metrics.keys()):
        day = metrics[date_key]
        solar_vals = day["solar_irradiance"]
        radiation_kwh_m2 = sum(solar_vals) / 1000 if solar_vals else 0

        daily.append({
            "date": date_key,
            "temperature": _mean(day["temperature"]),
            "humidity": _mean(day["humidity"]),
            "wind_speed": _mean(day["wind_speed"]),
            "cloud_cover": _mean(day["cloud_cover"]),
            "uv_index": _mean(day["uv_index"]),
            "solar_irradiance": _mean(solar_vals),
            "radiation_kwh_m2": round(radiation_kwh_m2, 3),
        })

    cache.set(cache_key, daily, settings.FORECAST_CACHE_TTL_SECONDS)
    return daily


def _safe_val(hourly, key, idx):
    values = hourly.get(key, [])
    if idx >= len(values):
        return 0
    try:
        return float(values[idx] or 0)
    except (TypeError, ValueError):
        return 0


def _mean(values):
    values = [v for v in values if v is not None]
    if not values:
        return 0
    return round(sum(values) / len(values), 2)


"""
Solar Energy Dataset Generator
Generates a realistic synthetic dataset of 50,000 rows representing
hourly solar energy readings across India over 3 years.
Uses physics-based generation logic with solar declination, elevation angles,
zone multipliers, and seasonal effects.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

np.random.seed(42)

# Indian cities with coordinates and solar zone (1=high, 2=medium, 3=moderate)
LOCATIONS = [
    {"city": "Jaipur",     "lat": 26.9, "lon": 75.8, "zone": 1},
    {"city": "Jodhpur",    "lat": 26.3, "lon": 73.0, "zone": 1},
    {"city": "Ahmedabad",  "lat": 23.0, "lon": 72.6, "zone": 1},
    {"city": "Delhi",      "lat": 28.6, "lon": 77.2, "zone": 2},
    {"city": "Mumbai",     "lat": 19.1, "lon": 72.9, "zone": 2},
    {"city": "Hyderabad",  "lat": 17.4, "lon": 78.5, "zone": 2},
    {"city": "Bangalore",  "lat": 12.9, "lon": 77.6, "zone": 2},
    {"city": "Chennai",    "lat": 13.1, "lon": 80.3, "zone": 2},
    {"city": "Mangalore",  "lat": 12.9, "lon": 74.9, "zone": 3},
    {"city": "Kolkata",    "lat": 22.6, "lon": 88.4, "zone": 3},
    {"city": "Guwahati",   "lat": 26.2, "lon": 91.7, "zone": 3},
    {"city": "Bhopal",     "lat": 23.3, "lon": 77.4, "zone": 2},
    {"city": "Pune",       "lat": 18.5, "lon": 73.9, "zone": 2},
    {"city": "Lucknow",    "lat": 26.8, "lon": 80.9, "zone": 2},
    {"city": "Nagpur",     "lat": 21.1, "lon": 79.1, "zone": 1},
]

SYSTEM_SIZES = [3, 5, 8, 10, 15, 20]
PANEL_WATTAGES = [350, 400, 450]


def get_season(month):
    """Return season encoding: 0=Summer, 1=Monsoon, 2=Winter"""
    if month in [3, 4, 5]:
        return 0  # Summer
    if month in [6, 7, 8, 9]:
        return 1  # Monsoon
    return 2  # Winter (Oct-Feb)


def irradiance_simple(season, hour):
    """Simple irradiance estimate for UV index calculation"""
    if hour < 6 or hour > 19:
        return 0
    peak = {0: 900, 1: 550, 2: 750}[season]
    curve = np.sin(np.pi * (hour - 6) / 13)
    return peak * curve * np.random.uniform(0.85, 1.15)


def solar_irradiance(lat, lon, day_of_year, hour, zone, season, cloud_cover):
    """
    Calculate solar irradiance using physics-based model.
    Uses solar declination, hour angle, and elevation angle.
    """
    # Solar declination
    declination = 23.45 * np.sin(np.radians(360 / 365 * (day_of_year - 81)))
    # Hour angle
    hour_angle = 15 * (hour - 12)
    # Solar elevation angle
    elevation = np.degrees(np.arcsin(
        np.sin(np.radians(lat)) * np.sin(np.radians(declination)) +
        np.cos(np.radians(lat)) * np.cos(np.radians(declination)) *
        np.cos(np.radians(hour_angle))
    ))
    if elevation <= 0:
        return 0.0
    # Base irradiance from elevation
    base = 1000 * np.sin(np.radians(elevation))
    # Zone multiplier
    zone_mult = {1: 1.15, 2: 1.0, 3: 0.85}[zone]
    # Season effect
    season_mult = {0: 1.1, 1: 0.65, 2: 0.9}[season]
    # Cloud cover reduction
    cloud_factor = 1 - (cloud_cover / 100) * 0.75
    # Add realistic noise
    noise = np.random.normal(1.0, 0.05)
    irradiance = base * zone_mult * season_mult * cloud_factor * noise
    return max(0.0, min(irradiance, 1200.0))


def generate_weather(lat, lon, zone, season, month, hour):
    """Generate realistic weather parameters based on season and location."""
    # Temperature
    base_temp = {0: 38, 1: 30, 2: 22}[season]
    temp = base_temp + np.random.normal(0, 4) + (2 if hour in range(12, 16) else -2)
    temp = np.clip(temp, -5, 50)
    # Humidity
    base_hum = {0: 30, 1: 80, 2: 45}[season]
    hum = base_hum + np.random.normal(0, 8)
    hum = np.clip(hum, 10, 100)
    # Cloud cover
    base_cloud = {0: 15, 1: 70, 2: 25}[season]
    cloud = base_cloud + np.random.normal(0, 15)
    cloud = np.clip(cloud, 0, 100)
    # Wind speed
    wind = np.random.exponential(3.5) + 0.5
    wind = np.clip(wind, 0, 25)
    # UV index
    uv = np.clip(irradiance_simple(season, hour) / 100, 0, 12)
    return temp, hum, cloud, wind, uv


def compute_energy(size_kw, panel_wattage, irradiance, temp, cloud_cover, zone):
    """
    Compute energy output using physics-based model.
    Accounts for temperature coefficient, panel efficiency, and performance ratio.
    """
    # Standard Test Condition irradiance
    stc_irradiance = 1000.0
    # Temperature coefficient (efficiency drops at high temp)
    temp_coeff = 1 - 0.004 * max(0, temp - 25)
    # Panel efficiency based on wattage
    efficiency = {350: 0.18, 400: 0.20, 450: 0.22}[panel_wattage]
    # Performance ratio (real-world losses: wiring, inverter, dust)
    performance_ratio = 0.78 + np.random.normal(0, 0.03)
    performance_ratio = np.clip(performance_ratio, 0.65, 0.90)
    # Energy output for this hour
    energy_kwh = (
        size_kw *
        (irradiance / stc_irradiance) *
        temp_coeff *
        performance_ratio *
        (1 - cloud_cover / 100 * 0.1)
    )
    # Consumption (60-80% of production + base load)
    base_consumption = size_kw * 0.3 * np.random.uniform(0.8, 1.2)
    consumed = energy_kwh * np.random.uniform(0.55, 0.75) + base_consumption
    consumed = min(consumed, energy_kwh * 1.1)
    net_exported = max(0, energy_kwh - consumed)
    return (
        max(0, energy_kwh),
        max(0, consumed),
        max(0, net_exported),
        efficiency,
        performance_ratio
    )


def main():
    """Generate the full synthetic solar energy dataset."""
    print("Generating solar energy dataset...")
    rows = []
    start_date = datetime(2021, 1, 1)

    # Daytime-weighted hour probabilities
    hour_probs = [
        0.01, 0.01, 0.01, 0.01, 0.01, 0.02,
        0.06, 0.07, 0.07, 0.07, 0.07, 0.07,
        0.07, 0.07, 0.07, 0.07, 0.06, 0.05,
        0.04, 0.03, 0.02, 0.02, 0.01, 0.01
    ]

    for i in range(50000):
        if (i + 1) % 10000 == 0:
            print(f"  Generated {i + 1}/50,000 rows...")

        loc = LOCATIONS[np.random.randint(len(LOCATIONS))]
        size_kw = np.random.choice(SYSTEM_SIZES)
        panel_w = np.random.choice(PANEL_WATTAGES)
        panel_count = int((size_kw * 1000) / panel_w)
        area_m2 = panel_count * 1.7

        # Random timestamp (daytime hours weighted)
        days_offset = np.random.randint(0, 1095)
        hour = int(np.random.choice(range(24), p=hour_probs))
        ts = start_date + timedelta(days=days_offset, hours=hour)
        month = ts.month
        day_of_year = ts.timetuple().tm_yday
        season = get_season(month)

        temp, hum, cloud, wind, uv = generate_weather(
            loc["lat"], loc["lon"], loc["zone"], season, month, hour
        )
        irr = solar_irradiance(
            loc["lat"], loc["lon"], day_of_year, hour,
            loc["zone"], season, cloud
        )
        produced, consumed, net_exp, eff, perf_ratio = compute_energy(
            size_kw, panel_w, irr, temp, cloud, loc["zone"]
        )

        rows.append({
            "city": loc["city"],
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "solar_zone": loc["zone"],
            "timestamp": ts.isoformat(),
            "hour": hour,
            "day_of_year": day_of_year,
            "month": month,
            "season": season,
            "size_kw": size_kw,
            "panel_wattage": panel_w,
            "panel_count": panel_count,
            "area_m2": round(area_m2, 2),
            "temperature": round(temp, 2),
            "humidity": round(hum, 2),
            "solar_irradiance": round(irr, 2),
            "wind_speed": round(wind, 2),
            "cloud_cover": round(cloud, 2),
            "uv_index": round(uv, 2),
            "efficiency": round(eff, 4),
            "performance_ratio": round(perf_ratio, 4),
            "produced_kwh": round(produced, 4),
            "consumed_kwh": round(consumed, 4),
            "net_exported_kwh": round(net_exp, 4),
        })

    df = pd.DataFrame(rows)
    os.makedirs("ml/data", exist_ok=True)
    df.to_csv("ml/data/solar_dataset.csv", index=False)
    print(f"\n✅ Dataset generated: {len(df)} rows")
    print(f"   Saved to: ml/data/solar_dataset.csv")
    print(f"\nDataset statistics:")
    print(df.describe())
    print(f"\nCities: {df['city'].nunique()}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")


if __name__ == "__main__":
    main()

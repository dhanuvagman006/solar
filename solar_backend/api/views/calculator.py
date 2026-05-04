"""Calculator and solar potential views."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .location import compute_solar_zone


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def solar_potential(request):
    """Estimate solar potential for a given location."""
    lat = request.query_params.get("latitude")
    lon = request.query_params.get("longitude")

    if not lat or not lon:
        return Response(
            {"error": "latitude and longitude are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lat = float(lat)
    lon = float(lon)
    zone = compute_solar_zone(lat, lon)

    zone_data = {
        1: {"annual_sun_hours": 2800, "avg_irradiance": 5.5, "rating": "Excellent"},
        2: {"annual_sun_hours": 2400, "avg_irradiance": 4.8, "rating": "Good"},
        3: {"annual_sun_hours": 2000, "avg_irradiance": 4.0, "rating": "Moderate"},
    }

    data = zone_data[zone]

    estimates = []
    for size_kw in [3, 5, 8, 10, 15, 20]:
        daily_kwh = size_kw * data["avg_irradiance"] * 0.78
        monthly_kwh = daily_kwh * 30
        annual_kwh = daily_kwh * 365
        estimates.append(
            {
                "size_kw": size_kw,
                "daily_kwh": round(daily_kwh, 2),
                "monthly_kwh": round(monthly_kwh, 2),
                "annual_kwh": round(annual_kwh, 2),
            }
        )

    return Response(
        {
            "latitude": lat,
            "longitude": lon,
            "solar_zone": zone,
            "annual_sun_hours": data["annual_sun_hours"],
            "avg_irradiance_kwh_m2": data["avg_irradiance"],
            "rating": data["rating"],
            "estimates": estimates,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def calculator(request):
    """Quick solar system size calculator."""
    size_kw = float(request.query_params.get("size_kw", 5))
    panel_wattage = int(request.query_params.get("panel_wattage", 400))

    panel_count = int((size_kw * 1000) / panel_wattage)
    area_m2 = round(panel_count * 1.7, 2)
    efficiency = {350: 0.18, 400: 0.20, 450: 0.22}.get(panel_wattage, 0.20)

    zone_estimates = {}
    for zone, irr in {1: 5.5, 2: 4.8, 3: 4.0}.items():
        daily = round(size_kw * irr * 0.78, 2)
        zone_estimates[f"zone_{zone}"] = {
            "daily_kwh": daily,
            "monthly_kwh": round(daily * 30, 2),
            "annual_kwh": round(daily * 365, 2),
        }

    return Response(
        {
            "size_kw": size_kw,
            "panel_wattage": panel_wattage,
            "panel_count": panel_count,
            "area_m2": area_m2,
            "efficiency": efficiency,
            "performance_ratio": 0.78,
            "estimates": zone_estimates,
        }
    )


"""Location resolution views."""

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Location
from ..serializers import LocationResolveSerializer


def compute_solar_zone(lat, lon):
    """Compute solar zone from latitude/longitude."""
    if 20 <= lat <= 30 and 65 <= lon <= 80:
        return 1
    if 10 <= lat <= 25 and 70 <= lon <= 85:
        return 2
    return 3


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resolve_location(request):
    """Resolve latitude/longitude to a city/state using Nominatim."""
    serializer = LocationResolveSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    lat = serializer.validated_data["latitude"]
    lon = serializer.validated_data["longitude"]

    if not (6 <= lat <= 37 and 68 <= lon <= 98):
        return Response(
            {"error": "Select a location within India"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        resp = requests.get(
            settings.NOMINATIM_URL,
            params={
                "lat": lat,
                "lon": lon,
                "format": "json",
                "addressdetails": 1,
            },
            headers={"User-Agent": "SolarApp/1.0"},
            timeout=settings.NOMINATIM_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        address = data.get("address", {})
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("county")
            or address.get("state_district")
            or "Unknown"
        )
        state = address.get("state", "")
        country = address.get("country", "")

        if country and "India" not in country:
            return Response(
                {"error": "Select a location within India"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception:
        city = f"Location ({lat:.2f}, {lon:.2f})"
        state = "Unknown"

    solar_zone = compute_solar_zone(lat, lon)

    location, created = Location.objects.get_or_create(
        latitude=round(lat, 4),
        longitude=round(lon, 4),
        defaults={
            "name": city,
            "state": state,
            "solar_zone": solar_zone,
        },
    )

    return Response(
        {
            "location_id": location.id,
            "city": location.name,
            "state": location.state,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "solar_zone": location.solar_zone,
            "created": created,
        }
    )


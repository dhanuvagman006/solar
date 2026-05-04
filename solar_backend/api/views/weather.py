"""Weather views."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Location, WeatherReading
from ..serializers import WeatherFetchSerializer
from ..services.weather import fetch_current_weather


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fetch_weather(request):
    """Fetch current weather data from Open-Meteo API."""
    serializer = WeatherFetchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    lat = serializer.validated_data["latitude"]
    lon = serializer.validated_data["longitude"]
    location_id = serializer.validated_data["location_id"]

    try:
        location = Location.objects.get(id=location_id)
    except Location.DoesNotExist:
        return Response(
            {"error": "Location not found"}, status=status.HTTP_404_NOT_FOUND
        )

    weather_data = fetch_current_weather(lat, lon)

    weather = WeatherReading.objects.create(
        location=location,
        temperature=weather_data["temperature"],
        humidity=weather_data["humidity"],
        solar_irradiance=weather_data["solar_irradiance"],
        wind_speed=weather_data["wind_speed"],
        cloud_cover=weather_data["cloud_cover"],
        uv_index=weather_data["uv_index"],
        season=weather_data["season"],
    )

    return Response(
        {
            "weather_id": weather.id,
            "temperature": weather.temperature,
            "humidity": weather.humidity,
            "solar_irradiance": weather.solar_irradiance,
            "wind_speed": weather.wind_speed,
            "cloud_cover": weather.cloud_cover,
            "uv_index": weather.uv_index,
            "season": weather.season,
            "timestamp": weather.timestamp,
        }
    )

"""Prediction views."""

from statistics import mean

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import SolarSystem, Location, WeatherReading, PredictionResult
from ..serializers import (
    PredictionRequestSerializer,
    PredictionResultSerializer,
    ForecastRequestSerializer,
)
from ..services.predictions import build_feature_payload, predict_all_models
from ..services.weather import fetch_daily_forecast


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_prediction(request):
    """Run prediction using all 5 ML models."""
    serializer = PredictionRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    d = serializer.validated_data

    features_dict = {
        "latitude": d["latitude"],
        "longitude": d["longitude"],
        "solar_zone": d["solar_zone"],
        "hour": d["hour"],
        "day_of_year": d["day_of_year"],
        "month": d["month"],
        "season": d["season"],
        "size_kw": d["size_kw"],
        "panel_wattage": d["panel_wattage"],
        "panel_count": d["panel_count"],
        "area_m2": d["area_m2"],
        "temperature": d["temperature"],
        "humidity": d["humidity"],
        "solar_irradiance": d["solar_irradiance"],
        "wind_speed": d["wind_speed"],
        "cloud_cover": d["cloud_cover"],
        "uv_index": d["uv_index"],
        "efficiency": d["efficiency"],
        "performance_ratio": d["performance_ratio"],
    }

    try:
        results = predict_all_models(features_dict)
    except Exception as exc:
        return Response(
            {"error": f"Prediction failed: {str(exc)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    solar_system = None
    location = None
    weather = None
    if d.get("solar_system_id"):
        try:
            solar_system = SolarSystem.objects.get(id=d["solar_system_id"])
        except SolarSystem.DoesNotExist:
            pass
    if d.get("location_id"):
        try:
            location = Location.objects.get(id=d["location_id"])
        except Location.DoesNotExist:
            pass
    if d.get("weather_id"):
        try:
            weather = WeatherReading.objects.get(id=d["weather_id"])
        except WeatherReading.DoesNotExist:
            pass

    saved_results = []
    for r in results:
        pr = PredictionResult.objects.create(
            solar_system=solar_system,
            location=location,
            weather=weather,
            model_name=r["model_name"],
            predicted_kwh=r["predicted_kwh"],
            r2_score=r["r2_score"],
            rmse=r["rmse"],
            mae=r["mae"],
            mape=r["mape"],
            granularity=d.get("granularity", "hourly"),
            input_features=features_dict,
        )
        saved_results.append(
            {
                "id": pr.id,
                "model_name": r["model_name"],
                "predicted_kwh": r["predicted_kwh"],
                "r2_score": r["r2_score"],
                "rmse": r["rmse"],
                "mae": r["mae"],
                "mape": r["mape"],
                "granularity": pr.granularity,
                "timestamp": pr.timestamp,
            }
        )

    return Response(saved_results)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def prediction_forecast(request):
    """Run a 7-day forecast based on hourly weather prediction."""
    serializer = ForecastRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    d = serializer.validated_data
    days = d.get("forecast_days", 7)
    try:
        forecast = fetch_daily_forecast(d["latitude"], d["longitude"], days=days)
    except Exception as exc:
        return Response(
            {"error": f"Forecast fetch failed: {str(exc)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    base = {
        "latitude": d["latitude"],
        "longitude": d["longitude"],
        "solar_zone": d["solar_zone"],
        "size_kw": d["size_kw"],
        "panel_wattage": d["panel_wattage"],
        "panel_count": d["panel_count"],
        "area_m2": d["area_m2"],
        "efficiency": d["efficiency"],
        "performance_ratio": d["performance_ratio"],
        "hour": 12,
    }

    results = []
    for day in forecast:
        features = build_feature_payload(base, day["date"], day)
        try:
            model_results = predict_all_models(features)
        except Exception as exc:
            return Response(
                {"error": f"Forecast prediction failed: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        avg_predicted = mean([m["predicted_kwh"] for m in model_results]) if model_results else 0
        results.append(
            {
                "date": day["date"],
                "predicted_kwh": round(avg_predicted, 4),
                "radiation_kwh_m2": day["radiation_kwh_m2"],
                "solar_irradiance": day["solar_irradiance"],
                "temperature": day["temperature"],
                "humidity": day["humidity"],
                "wind_speed": day["wind_speed"],
                "cloud_cover": day["cloud_cover"],
                "uv_index": day["uv_index"],
                "model_results": model_results,
            }
        )

    return Response(results)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def prediction_history(request):
    """Get prediction history with optional filters."""
    qs = PredictionResult.objects.select_related(
        "solar_system", "location", "weather"
    ).all()

    location_id = request.query_params.get("location_id")
    model_name = request.query_params.get("model_name")
    limit = int(request.query_params.get("limit", 50))

    if location_id:
        qs = qs.filter(location_id=location_id)
    if model_name:
        qs = qs.filter(model_name=model_name)

    qs = qs[:limit]
    serializer = PredictionResultSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def prediction_compare(request):
    """Compare predictions across models grouped by timestamp."""
    qs = PredictionResult.objects.select_related("location").all()

    location_id = request.query_params.get("location_id")
    if location_id:
        qs = qs.filter(location_id=location_id)

    from collections import defaultdict

    grouped = defaultdict(dict)

    for p in qs.order_by("-timestamp")[:250]:
        key = p.timestamp.strftime("%Y-%m-%d %H:%M")
        safe_name = p.model_name.replace("-", "_").replace(" ", "_")
        grouped[key][safe_name] = p.predicted_kwh
        grouped[key]["date"] = key
        if p.location:
            grouped[key]["location"] = p.location.name

    data = list(grouped.values())[:50]
    return Response(data)

"""
API Views for the Solar Energy Prediction application.
"""

import csv
import io
import json
from datetime import datetime

import requests
from django.db.models import Avg, Sum, Count, Max, Min
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

from .models import SolarSystem, Location, WeatherReading, EnergyReading, PredictionResult
from .serializers import (
    SolarSystemSerializer, LocationSerializer, WeatherReadingSerializer,
    EnergyReadingSerializer, PredictionResultSerializer,
    LocationResolveSerializer, WeatherFetchSerializer,
    PredictionRequestSerializer, EnergyCSVUploadSerializer,
)


# ─── SOLAR SYSTEM VIEWS ─────────────────────────────────────

class SolarSystemListCreate(generics.ListCreateAPIView):
    """GET: list all solar systems. POST: create a new one."""
    queryset = SolarSystem.objects.all()
    serializer_class = SolarSystemSerializer
    permission_classes = [IsAuthenticated]


class SolarSystemDetail(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE a specific solar system."""
    queryset = SolarSystem.objects.all()
    serializer_class = SolarSystemSerializer
    permission_classes = [IsAuthenticated]


# ─── ENERGY READINGS ─────────────────────────────────────────

class EnergyReadingListCreate(generics.ListCreateAPIView):
    """GET: paginated list. POST: create a new reading."""
    serializer_class = EnergyReadingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EnergyReading.objects.select_related(
            'solar_system', 'location', 'weather'
        ).all()
        # Optional filters
        location_id = self.request.query_params.get('location_id')
        system_id = self.request.query_params.get('solar_system_id')
        if location_id:
            qs = qs.filter(location_id=location_id)
        if system_id:
            qs = qs.filter(solar_system_id=system_id)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_energy_csv(request):
    """Upload CSV file of energy readings."""
    serializer = EnergyCSVUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    csv_file = serializer.validated_data['file']
    solar_system_id = serializer.validated_data['solar_system_id']
    location_id = serializer.validated_data['location_id']

    try:
        solar_system = SolarSystem.objects.get(id=solar_system_id)
        location = Location.objects.get(id=location_id)
    except (SolarSystem.DoesNotExist, Location.DoesNotExist) as e:
        return Response(
            {'error': str(e)}, status=status.HTTP_404_NOT_FOUND
        )

    decoded = csv_file.read().decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

    created = 0
    errors = []
    for i, row in enumerate(reader, 1):
        try:
            EnergyReading.objects.create(
                solar_system=solar_system,
                location=location,
                timestamp=row.get('timestamp', timezone.now().isoformat()),
                produced_kwh=float(row.get('produced_kwh', 0)),
                consumed_kwh=float(row.get('consumed_kwh', 0)),
                net_exported_kwh=float(row.get('net_exported_kwh', 0)),
            )
            created += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    return Response({
        'created': created,
        'errors': errors[:10],  # Return first 10 errors
        'total_errors': len(errors),
    }, status=status.HTTP_201_CREATED)


# ─── LOCATION RESOLVE ────────────────────────────────────────

def compute_solar_zone(lat, lon):
    """Compute solar zone from latitude/longitude."""
    # Zone 1: High (Rajasthan/Gujarat strip) lat 20-30, lon 65-80
    if 20 <= lat <= 30 and 65 <= lon <= 80:
        return 1
    # Zone 2: Medium (Deccan/Peninsula) lat 10-25, lon 70-85
    if 10 <= lat <= 25 and 70 <= lon <= 85:
        return 2
    # Zone 3: everything else
    return 3


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_location(request):
    """
    Resolve latitude/longitude to a city/state using Nominatim.
    Creates or retrieves a Location record.
    """
    serializer = LocationResolveSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    lat = serializer.validated_data['latitude']
    lon = serializer.validated_data['longitude']

    # Validate India bounds (rough)
    if not (6 <= lat <= 37 and 68 <= lon <= 98):
        return Response(
            {'error': 'Select a location within India'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Call Nominatim reverse geocoding
    try:
        resp = requests.get(
            'https://nominatim.openstreetmap.org/reverse',
            params={
                'lat': lat,
                'lon': lon,
                'format': 'json',
                'addressdetails': 1,
            },
            headers={'User-Agent': 'SolarApp/1.0'},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        address = data.get('address', {})
        city = (
            address.get('city') or
            address.get('town') or
            address.get('village') or
            address.get('county') or
            address.get('state_district') or
            'Unknown'
        )
        state = address.get('state', '')
        country = address.get('country', '')

        if country and 'India' not in country:
            return Response(
                {'error': 'Select a location within India'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception:
        # Fallback if API fails
        city = f"Location ({lat:.2f}, {lon:.2f})"
        state = 'Unknown'

    solar_zone = compute_solar_zone(lat, lon)

    # Get or create location with matching coordinates (rounded)
    location, created = Location.objects.get_or_create(
        latitude=round(lat, 4),
        longitude=round(lon, 4),
        defaults={
            'name': city,
            'state': state,
            'solar_zone': solar_zone,
        }
    )

    return Response({
        'location_id': location.id,
        'city': location.name,
        'state': location.state,
        'latitude': location.latitude,
        'longitude': location.longitude,
        'solar_zone': location.solar_zone,
        'created': created,
    })


# ─── WEATHER FETCH ────────────────────────────────────────────

def get_season_from_month(month):
    """Return season encoding from month."""
    if month in [3, 4, 5]:
        return 0  # Summer
    if month in [6, 7, 8, 9]:
        return 1  # Monsoon
    return 2  # Winter


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_weather(request):
    """
    Fetch current weather data from Open-Meteo API.
    Saves a WeatherReading to the database.
    """
    serializer = WeatherFetchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    lat = serializer.validated_data['latitude']
    lon = serializer.validated_data['longitude']
    location_id = serializer.validated_data['location_id']

    try:
        location = Location.objects.get(id=location_id)
    except Location.DoesNotExist:
        return Response(
            {'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND
        )

    # Call Open-Meteo API
    try:
        resp = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params={
                'latitude': lat,
                'longitude': lon,
                'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,uv_index',
                'daily': 'shortwave_radiation_sum',
                'timezone': 'Asia/Kolkata',
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        current = data.get('current', {})
        daily = data.get('daily', {})

        temperature = current.get('temperature_2m', 30.0)
        humidity = current.get('relative_humidity_2m', 50.0)
        wind_speed = current.get('wind_speed_10m', 3.0)
        cloud_cover = current.get('cloud_cover', 20.0)
        uv_index = current.get('uv_index', 5.0)

        # Convert shortwave_radiation_sum (MJ/m²) to average W/m²
        # shortwave_radiation_sum is in MJ/m² per day
        # divide by 3.6 to get approximate kWh/m², then convert
        radiation_sum = (daily.get('shortwave_radiation_sum') or [0])[0] or 0
        solar_irradiance = radiation_sum / 3.6 * 1000 / 12  # rough avg W/m² during daylight

        if solar_irradiance <= 0:
            # Estimate from UV index and cloud cover
            solar_irradiance = max(0, (1000 - cloud_cover * 8) * (uv_index / 10))

    except Exception:
        # Fallback estimated values
        now = datetime.now()
        hour = now.hour
        month = now.month
        season = get_season_from_month(month)

        temperature = {0: 35, 1: 28, 2: 22}.get(season, 28)
        humidity = {0: 35, 1: 75, 2: 45}.get(season, 50)
        wind_speed = 3.5
        cloud_cover = {0: 20, 1: 65, 2: 25}.get(season, 30)
        uv_index = 6.0 if 8 <= hour <= 16 else 1.0
        solar_irradiance = max(0, 800 * (1 - cloud_cover / 100) * 0.7) if 6 <= hour <= 18 else 0

    now = datetime.now()
    season = get_season_from_month(now.month)

    weather = WeatherReading.objects.create(
        location=location,
        temperature=round(temperature, 2),
        humidity=round(humidity, 2),
        solar_irradiance=round(solar_irradiance, 2),
        wind_speed=round(wind_speed, 2),
        cloud_cover=round(cloud_cover, 2),
        uv_index=round(uv_index, 2),
        season=season,
    )

    return Response({
        'weather_id': weather.id,
        'temperature': weather.temperature,
        'humidity': weather.humidity,
        'solar_irradiance': weather.solar_irradiance,
        'wind_speed': weather.wind_speed,
        'cloud_cover': weather.cloud_cover,
        'uv_index': weather.uv_index,
        'season': weather.season,
        'timestamp': weather.timestamp,
    })


# ─── PREDICTION ───────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_prediction(request):
    """
    Run prediction using all 5 ML models.
    Saves PredictionResult rows and returns results.
    """
    serializer = PredictionRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    d = serializer.validated_data

    # Build features_dict matching FEATURE_COLS order EXACTLY
    features_dict = {
        'latitude': d['latitude'],
        'longitude': d['longitude'],
        'solar_zone': d['solar_zone'],
        'hour': d['hour'],
        'day_of_year': d['day_of_year'],
        'month': d['month'],
        'season': d['season'],
        'size_kw': d['size_kw'],
        'panel_wattage': d['panel_wattage'],
        'panel_count': d['panel_count'],
        'area_m2': d['area_m2'],
        'temperature': d['temperature'],
        'humidity': d['humidity'],
        'solar_irradiance': d['solar_irradiance'],
        'wind_speed': d['wind_speed'],
        'cloud_cover': d['cloud_cover'],
        'uv_index': d['uv_index'],
        'efficiency': d['efficiency'],
        'performance_ratio': d['performance_ratio'],
    }

    # Run predictions
    try:
        from .ml_loader import predict_all
        results = predict_all(features_dict)
    except Exception as e:
        return Response(
            {'error': f'Prediction failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Get FK objects (optional)
    solar_system = None
    location = None
    weather = None
    if d.get('solar_system_id'):
        try:
            solar_system = SolarSystem.objects.get(id=d['solar_system_id'])
        except SolarSystem.DoesNotExist:
            pass
    if d.get('location_id'):
        try:
            location = Location.objects.get(id=d['location_id'])
        except Location.DoesNotExist:
            pass
    if d.get('weather_id'):
        try:
            weather = WeatherReading.objects.get(id=d['weather_id'])
        except WeatherReading.DoesNotExist:
            pass

    # Save prediction results
    saved_results = []
    for r in results:
        pr = PredictionResult.objects.create(
            solar_system=solar_system,
            location=location,
            weather=weather,
            model_name=r['model_name'],
            predicted_kwh=r['predicted_kwh'],
            r2_score=r['r2_score'],
            rmse=r['rmse'],
            mae=r['mae'],
            mape=r['mape'],
            granularity=d.get('granularity', 'hourly'),
            input_features=features_dict,
        )
        saved_results.append({
            'id': pr.id,
            'model_name': r['model_name'],
            'predicted_kwh': r['predicted_kwh'],
            'r2_score': r['r2_score'],
            'rmse': r['rmse'],
            'mae': r['mae'],
            'mape': r['mape'],
            'granularity': pr.granularity,
            'timestamp': pr.timestamp,
        })

    return Response(saved_results)


# ─── PREDICTION HISTORY & COMPARE ─────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_history(request):
    """Get prediction history with optional filters."""
    qs = PredictionResult.objects.select_related(
        'solar_system', 'location', 'weather'
    ).all()

    location_id = request.query_params.get('location_id')
    model_name = request.query_params.get('model_name')
    limit = int(request.query_params.get('limit', 50))

    if location_id:
        qs = qs.filter(location_id=location_id)
    if model_name:
        qs = qs.filter(model_name=model_name)

    qs = qs[:limit]
    serializer = PredictionResultSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_compare(request):
    """Compare predictions across models grouped by timestamp."""
    qs = PredictionResult.objects.select_related('location').all()

    location_id = request.query_params.get('location_id')
    if location_id:
        qs = qs.filter(location_id=location_id)

    # Group by approximate timestamp (rounded to minute)
    from collections import defaultdict
    grouped = defaultdict(dict)

    for p in qs.order_by('-timestamp')[:250]:
        key = p.timestamp.strftime('%Y-%m-%d %H:%M')
        safe_name = p.model_name.replace('-', '_').replace(' ', '_')
        grouped[key][safe_name] = p.predicted_kwh
        grouped[key]['date'] = key
        if p.location:
            grouped[key]['location'] = p.location.name

    data = list(grouped.values())[:50]
    return Response(data)


# ─── REPORTS ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_summary(request):
    """Get summary statistics for reports."""
    location_id = request.query_params.get('location_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    # Prediction stats
    pred_qs = PredictionResult.objects.all()
    if location_id:
        pred_qs = pred_qs.filter(location_id=location_id)
    if date_from:
        pred_qs = pred_qs.filter(timestamp__gte=date_from)
    if date_to:
        pred_qs = pred_qs.filter(timestamp__lte=date_to)

    # Per-model aggregates
    model_stats = []
    for model_name in ['BiLSTM', 'Attention-LSTM', 'CNN-BiLSTM', 'GRU-Attention', 'Transformer']:
        model_qs = pred_qs.filter(model_name=model_name)
        agg = model_qs.aggregate(
            avg_predicted=Avg('predicted_kwh'),
            max_predicted=Max('predicted_kwh'),
            min_predicted=Min('predicted_kwh'),
            count=Count('id'),
            avg_r2=Avg('r2_score'),
            avg_rmse=Avg('rmse'),
            avg_mae=Avg('mae'),
            avg_mape=Avg('mape'),
        )
        model_stats.append({
            'model_name': model_name,
            **agg,
        })

    # Energy reading stats
    energy_qs = EnergyReading.objects.all()
    if location_id:
        energy_qs = energy_qs.filter(location_id=location_id)

    energy_agg = energy_qs.aggregate(
        total_produced=Sum('produced_kwh'),
        total_consumed=Sum('consumed_kwh'),
        total_exported=Sum('net_exported_kwh'),
        avg_produced=Avg('produced_kwh'),
        reading_count=Count('id'),
    )

    # Location list
    locations = list(
        Location.objects.values('id', 'name', 'state', 'solar_zone')
    )

    return Response({
        'model_stats': model_stats,
        'energy_stats': energy_agg,
        'locations': locations,
        'total_predictions': pred_qs.count(),
    })


# ─── SOLAR POTENTIAL ──────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solar_potential(request):
    """Estimate solar potential for a given location."""
    lat = request.query_params.get('latitude')
    lon = request.query_params.get('longitude')

    if not lat or not lon:
        return Response(
            {'error': 'latitude and longitude are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    lat = float(lat)
    lon = float(lon)
    zone = compute_solar_zone(lat, lon)

    # Estimate annual solar hours and potential
    zone_data = {
        1: {'annual_sun_hours': 2800, 'avg_irradiance': 5.5, 'rating': 'Excellent'},
        2: {'annual_sun_hours': 2400, 'avg_irradiance': 4.8, 'rating': 'Good'},
        3: {'annual_sun_hours': 2000, 'avg_irradiance': 4.0, 'rating': 'Moderate'},
    }

    data = zone_data[zone]

    # Estimate for common system sizes
    estimates = []
    for size_kw in [3, 5, 8, 10, 15, 20]:
        daily_kwh = size_kw * data['avg_irradiance'] * 0.78  # performance ratio
        monthly_kwh = daily_kwh * 30
        annual_kwh = daily_kwh * 365
        estimates.append({
            'size_kw': size_kw,
            'daily_kwh': round(daily_kwh, 2),
            'monthly_kwh': round(monthly_kwh, 2),
            'annual_kwh': round(annual_kwh, 2),
        })

    return Response({
        'latitude': lat,
        'longitude': lon,
        'solar_zone': zone,
        'annual_sun_hours': data['annual_sun_hours'],
        'avg_irradiance_kwh_m2': data['avg_irradiance'],
        'rating': data['rating'],
        'estimates': estimates,
    })


# ─── CALCULATOR ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def calculator(request):
    """Quick solar system size calculator."""
    size_kw = float(request.query_params.get('size_kw', 5))
    panel_wattage = int(request.query_params.get('panel_wattage', 400))

    panel_count = int((size_kw * 1000) / panel_wattage)
    area_m2 = round(panel_count * 1.7, 2)
    efficiency = {350: 0.18, 400: 0.20, 450: 0.22}.get(panel_wattage, 0.20)

    # Estimates for 3 zones
    zone_estimates = {}
    for zone, irr in {1: 5.5, 2: 4.8, 3: 4.0}.items():
        daily = round(size_kw * irr * 0.78, 2)
        zone_estimates[f'zone_{zone}'] = {
            'daily_kwh': daily,
            'monthly_kwh': round(daily * 30, 2),
            'annual_kwh': round(daily * 365, 2),
        }

    return Response({
        'size_kw': size_kw,
        'panel_wattage': panel_wattage,
        'panel_count': panel_count,
        'area_m2': area_m2,
        'efficiency': efficiency,
        'performance_ratio': 0.78,
        'estimates': zone_estimates,
    })

"""
Serializers for the Solar Energy Prediction API.
"""

from rest_framework import serializers
from .models import SolarSystem, Location, WeatherReading, EnergyReading, PredictionResult


class SolarSystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolarSystem
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class WeatherReadingSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = WeatherReading
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class EnergyReadingSerializer(serializers.ModelSerializer):
    solar_system_name = serializers.CharField(
        source='solar_system.name', read_only=True
    )
    location_name = serializers.CharField(
        source='location.name', read_only=True
    )

    class Meta:
        model = EnergyReading
        fields = '__all__'
        read_only_fields = ['id']


class PredictionResultSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(
        source='location.name', read_only=True, default=''
    )

    class Meta:
        model = PredictionResult
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class LocationResolveSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class WeatherFetchSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    location_id = serializers.IntegerField()


class PredictionRequestSerializer(serializers.Serializer):
    solar_system_id = serializers.IntegerField(required=False, allow_null=True)
    location_id = serializers.IntegerField(required=False, allow_null=True)
    weather_id = serializers.IntegerField(required=False, allow_null=True)
    size_kw = serializers.FloatField()
    panel_wattage = serializers.IntegerField()
    panel_count = serializers.IntegerField()
    area_m2 = serializers.FloatField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    solar_zone = serializers.IntegerField()
    temperature = serializers.FloatField()
    humidity = serializers.FloatField()
    solar_irradiance = serializers.FloatField()
    wind_speed = serializers.FloatField()
    cloud_cover = serializers.FloatField()
    uv_index = serializers.FloatField()
    hour = serializers.IntegerField()
    day_of_year = serializers.IntegerField()
    month = serializers.IntegerField()
    season = serializers.IntegerField()
    efficiency = serializers.FloatField()
    performance_ratio = serializers.FloatField()
    granularity = serializers.CharField(default='hourly')
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)


class EnergyCSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    solar_system_id = serializers.IntegerField()
    location_id = serializers.IntegerField()

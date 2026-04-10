"""
Django models for the Solar Energy Prediction application.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class SolarSystem(models.Model):
    """Represents a solar panel system configuration."""
    name = models.CharField(max_length=100)
    size_kw = models.FloatField(validators=[MinValueValidator(0.1)])
    panel_wattage = models.IntegerField(
        validators=[MinValueValidator(100), MaxValueValidator(1000)]
    )
    panel_count = models.IntegerField(validators=[MinValueValidator(1)])
    area_m2 = models.FloatField(validators=[MinValueValidator(0.1)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.size_kw}kW)"


class Location(models.Model):
    """Represents a geographic location in India."""
    ZONE_CHOICES = [
        (1, 'High Solar Potential'),
        (2, 'Medium Solar Potential'),
        (3, 'Moderate Solar Potential'),
    ]

    name = models.CharField(max_length=100)  # city name
    state = models.CharField(max_length=100, blank=True, default='')
    latitude = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    solar_zone = models.IntegerField(
        choices=ZONE_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(3)]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.state} (Zone {self.solar_zone})"


class WeatherReading(models.Model):
    """Stores weather data for a location at a point in time."""
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name='weather_readings'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    temperature = models.FloatField(help_text='Temperature in Celsius')
    humidity = models.FloatField(help_text='Humidity percentage')
    solar_irradiance = models.FloatField(help_text='Solar irradiance in W/m2')
    wind_speed = models.FloatField(help_text='Wind speed in m/s')
    cloud_cover = models.FloatField(help_text='Cloud cover percentage')
    uv_index = models.FloatField(help_text='UV index')
    season = models.IntegerField(
        help_text='0=Summer, 1=Monsoon, 2=Winter',
        validators=[MinValueValidator(0), MaxValueValidator(2)]
    )

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Weather @ {self.location.name} ({self.timestamp})"


class EnergyReading(models.Model):
    """Stores actual energy production/consumption data."""
    solar_system = models.ForeignKey(
        SolarSystem, on_delete=models.CASCADE, related_name='energy_readings'
    )
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name='energy_readings'
    )
    weather = models.ForeignKey(
        WeatherReading, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='energy_readings'
    )
    timestamp = models.DateTimeField()
    produced_kwh = models.FloatField(validators=[MinValueValidator(0)])
    consumed_kwh = models.FloatField(validators=[MinValueValidator(0)])
    net_exported_kwh = models.FloatField(default=0)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.solar_system.name} @ {self.location.name}: {self.produced_kwh} kWh"


class PredictionResult(models.Model):
    """Stores ML model prediction results."""
    GRANULARITY_CHOICES = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('monthly', 'Monthly'),
    ]

    solar_system = models.ForeignKey(
        SolarSystem, on_delete=models.CASCADE,
        null=True, blank=True, related_name='predictions'
    )
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE,
        null=True, blank=True, related_name='predictions'
    )
    weather = models.ForeignKey(
        WeatherReading, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='predictions'
    )
    model_name = models.CharField(max_length=50)
    predicted_kwh = models.FloatField()
    actual_kwh = models.FloatField(null=True, blank=True)
    r2_score = models.FloatField(null=True, blank=True)
    rmse = models.FloatField(null=True, blank=True)
    mae = models.FloatField(null=True, blank=True)
    mape = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    granularity = models.CharField(
        max_length=10, choices=GRANULARITY_CHOICES, default='hourly'
    )
    input_features = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.model_name}: {self.predicted_kwh} kWh"

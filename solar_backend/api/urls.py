"""
URL patterns for the API app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # Auth
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Solar Systems
    path('solar-systems/', views.SolarSystemListCreate.as_view(), name='solar-systems-list'),
    path('solar-systems/<int:pk>/', views.SolarSystemDetail.as_view(), name='solar-systems-detail'),

    # Energy Readings
    path('energy-readings/', views.EnergyReadingListCreate.as_view(), name='energy-readings-list'),
    path('energy-readings/upload-csv/', views.upload_energy_csv, name='energy-readings-upload'),

    # Location
    path('location/resolve/', views.resolve_location, name='location-resolve'),

    # Weather
    path('weather/fetch/', views.fetch_weather, name='weather-fetch'),

    # Predictions
    path('predict/', views.run_prediction, name='predict'),
    path('predictions/history/', views.prediction_history, name='prediction-history'),
    path('predictions/compare/', views.prediction_compare, name='prediction-compare'),

    # Reports
    path('reports/summary/', views.reports_summary, name='reports-summary'),

    # Solar Potential & Calculator
    path('solar-potential/', views.solar_potential, name='solar-potential'),
    path('calculator/', views.calculator, name='calculator'),
]

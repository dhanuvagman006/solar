from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .serializers import ForecastRequestSerializer


class ForecastSerializerTests(TestCase):
    def test_forecast_serializer_requires_fields(self):
        serializer = ForecastRequestSerializer(data={})
        self.assertFalse(serializer.is_valid())


class PredictionForecastEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        user = get_user_model().objects.create_user(
            username="tester", password="pass12345"
        )
        self.client.force_authenticate(user=user)

    def test_prediction_forecast_missing_fields(self):
        response = self.client.post("/api/predictions/forecast/", data={})
        self.assertEqual(response.status_code, 400)

    def test_weather_fetch_invalid_location(self):
        response = self.client.post(
            "/api/weather/fetch/",
            data={"latitude": 12.9, "longitude": 77.6, "location_id": 999},
        )
        self.assertEqual(response.status_code, 404)

"""
App configuration for the API app.
"""

from django.apps import AppConfig
from django.conf import settings
from urllib.parse import urlparse


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Optionally load ML models when Django starts (runserver only)."""
        self._validate_settings()
        import sys
        # Only load models for runserver, not for migrate/makemigrations/etc.
        if 'runserver' not in sys.argv:
            return
        try:
            from .ml_loader import load_all_models
            load_all_models()
        except Exception as e:
            print(f"Warning: Could not load ML models at startup: {e}")
            print("Models will be loaded on first prediction request.")

    def _validate_settings(self):
        """Validate runtime settings for external services."""
        for name in ("OPEN_METEO_URL", "NOMINATIM_URL"):
            value = getattr(settings, name, "")
            parsed = urlparse(value)
            if not parsed.scheme or not parsed.netloc:
                print(f"Warning: {name} is not a valid URL ({value})")

        for name in (
            "OPEN_METEO_TIMEOUT",
            "NOMINATIM_TIMEOUT",
            "WEATHER_CACHE_TTL_SECONDS",
            "FORECAST_CACHE_TTL_SECONDS",
        ):
            value = getattr(settings, name, 0)
            if not isinstance(value, int) or value <= 0:
                print(f"Warning: {name} should be a positive integer ({value})")

        model_dir = getattr(settings, "MODEL_DIR", "")
        if not model_dir:
            print("Warning: MODEL_DIR is not configured.")

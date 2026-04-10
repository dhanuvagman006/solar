"""
App configuration for the API app.
"""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Optionally load ML models when Django starts (runserver only)."""
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

"""
Management command to create sample data for development.
Creates 2 SolarSystems, all 15 cities as Locations,
sample WeatherReadings and EnergyReadings.
"""

import random
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import SolarSystem, Location, WeatherReading, EnergyReading


LOCATIONS_DATA = [
    {"city": "Jaipur",     "state": "Rajasthan",        "lat": 26.9, "lon": 75.8, "zone": 1},
    {"city": "Jodhpur",    "state": "Rajasthan",        "lat": 26.3, "lon": 73.0, "zone": 1},
    {"city": "Ahmedabad",  "state": "Gujarat",          "lat": 23.0, "lon": 72.6, "zone": 1},
    {"city": "Delhi",      "state": "Delhi",            "lat": 28.6, "lon": 77.2, "zone": 2},
    {"city": "Mumbai",     "state": "Maharashtra",      "lat": 19.1, "lon": 72.9, "zone": 2},
    {"city": "Hyderabad",  "state": "Telangana",        "lat": 17.4, "lon": 78.5, "zone": 2},
    {"city": "Bangalore",  "state": "Karnataka",        "lat": 12.9, "lon": 77.6, "zone": 2},
    {"city": "Chennai",    "state": "Tamil Nadu",       "lat": 13.1, "lon": 80.3, "zone": 2},
    {"city": "Mangalore",  "state": "Karnataka",        "lat": 12.9, "lon": 74.9, "zone": 3},
    {"city": "Kolkata",    "state": "West Bengal",      "lat": 22.6, "lon": 88.4, "zone": 3},
    {"city": "Guwahati",   "state": "Assam",            "lat": 26.2, "lon": 91.7, "zone": 3},
    {"city": "Bhopal",     "state": "Madhya Pradesh",   "lat": 23.3, "lon": 77.4, "zone": 2},
    {"city": "Pune",       "state": "Maharashtra",      "lat": 18.5, "lon": 73.9, "zone": 2},
    {"city": "Lucknow",    "state": "Uttar Pradesh",    "lat": 26.8, "lon": 80.9, "zone": 2},
    {"city": "Nagpur",     "state": "Maharashtra",      "lat": 21.1, "lon": 79.1, "zone": 1},
]


class Command(BaseCommand):
    help = 'Create sample data for development'

    def handle(self, *args, **options):
        self.stdout.write("Creating sample data...")

        # Create Solar Systems
        systems = [
            SolarSystem.objects.get_or_create(
                name="Residential 5kW",
                defaults={
                    'size_kw': 5,
                    'panel_wattage': 400,
                    'panel_count': 12,
                    'area_m2': 20.4,
                }
            )[0],
            SolarSystem.objects.get_or_create(
                name="Commercial 10kW",
                defaults={
                    'size_kw': 10,
                    'panel_wattage': 450,
                    'panel_count': 22,
                    'area_m2': 37.4,
                }
            )[0],
        ]
        self.stdout.write(f"  Created {len(systems)} solar systems")

        # Create Locations
        locations = []
        for loc_data in LOCATIONS_DATA:
            loc, created = Location.objects.get_or_create(
                latitude=loc_data['lat'],
                longitude=loc_data['lon'],
                defaults={
                    'name': loc_data['city'],
                    'state': loc_data['state'],
                    'solar_zone': loc_data['zone'],
                }
            )
            locations.append(loc)
        self.stdout.write(f"  Created {len(locations)} locations")

        # Create sample WeatherReadings and EnergyReadings
        weather_count = 0
        energy_count = 0
        now = timezone.now()

        for loc in locations[:5]:  # For first 5 locations
            for day_offset in range(7):  # 7 days of data
                for hour in range(6, 19):  # Daylight hours
                    ts = now - timedelta(days=day_offset, hours=(18 - hour))

                    # Create weather reading
                    season = 0 if ts.month in [3, 4, 5] else (1 if ts.month in [6, 7, 8, 9] else 2)
                    temp = random.uniform(20, 40)
                    cloud = random.uniform(0, 60)
                    irradiance = max(0, 800 * (1 - cloud / 100) * abs(
                        (hour - 6) * (18 - hour) / 36
                    ))

                    weather = WeatherReading.objects.create(
                        location=loc,
                        temperature=round(temp, 2),
                        humidity=round(random.uniform(20, 80), 2),
                        solar_irradiance=round(irradiance, 2),
                        wind_speed=round(random.uniform(0.5, 10), 2),
                        cloud_cover=round(cloud, 2),
                        uv_index=round(random.uniform(2, 10), 2),
                        season=season,
                    )
                    weather_count += 1

                    # Create energy reading for each system
                    for system in systems:
                        produced = round(
                            system.size_kw * (irradiance / 1000) * 0.78 *
                            random.uniform(0.85, 1.15), 4
                        )
                        consumed = round(produced * random.uniform(0.5, 0.8), 4)
                        net = round(max(0, produced - consumed), 4)

                        EnergyReading.objects.create(
                            solar_system=system,
                            location=loc,
                            weather=weather,
                            timestamp=ts,
                            produced_kwh=produced,
                            consumed_kwh=consumed,
                            net_exported_kwh=net,
                        )
                        energy_count += 1

        self.stdout.write(f"  Created {weather_count} weather readings")
        self.stdout.write(f"  Created {energy_count} energy readings")
        self.stdout.write(self.style.SUCCESS("Sample data created successfully!"))

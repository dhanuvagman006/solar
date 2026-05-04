"""Energy readings views."""

import csv
import io

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import SolarSystem, Location, EnergyReading
from ..serializers import EnergyReadingSerializer, EnergyCSVUploadSerializer


class EnergyReadingListCreate(generics.ListCreateAPIView):
    """GET: paginated list. POST: create a new reading."""
    serializer_class = EnergyReadingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EnergyReading.objects.select_related(
            "solar_system", "location", "weather"
        ).all()
        location_id = self.request.query_params.get("location_id")
        system_id = self.request.query_params.get("solar_system_id")
        if location_id:
            qs = qs.filter(location_id=location_id)
        if system_id:
            qs = qs.filter(solar_system_id=system_id)
        return qs


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_energy_csv(request):
    """Upload CSV file of energy readings."""
    serializer = EnergyCSVUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    csv_file = serializer.validated_data["file"]
    solar_system_id = serializer.validated_data["solar_system_id"]
    location_id = serializer.validated_data["location_id"]

    try:
        solar_system = SolarSystem.objects.get(id=solar_system_id)
        location = Location.objects.get(id=location_id)
    except (SolarSystem.DoesNotExist, Location.DoesNotExist) as exc:
        return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)

    decoded = csv_file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    created = 0
    errors = []
    for i, row in enumerate(reader, 1):
        try:
            EnergyReading.objects.create(
                solar_system=solar_system,
                location=location,
                timestamp=row.get("timestamp") or timezone.now().isoformat(),
                produced_kwh=float(row.get("produced_kwh", 0)),
                consumed_kwh=float(row.get("consumed_kwh", 0)),
                net_exported_kwh=float(row.get("net_exported_kwh", 0)),
            )
            created += 1
        except Exception as exc:
            errors.append(f"Row {i}: {str(exc)}")

    return Response(
        {
            "created": created,
            "errors": errors[:10],
            "total_errors": len(errors),
        },
        status=status.HTTP_201_CREATED,
    )

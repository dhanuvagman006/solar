"""Solar system views."""

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..models import SolarSystem
from ..serializers import SolarSystemSerializer


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


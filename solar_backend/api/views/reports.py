"""Reports views."""

from django.db.models import Avg, Sum, Count, Max, Min
from django.db.models.functions import TruncSecond
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Location, PredictionResult


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_summary(request):
    """Get summary statistics for reports."""
    location_id = request.query_params.get("location_id")
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")

    pred_qs = PredictionResult.objects.all()
    if location_id:
        pred_qs = pred_qs.filter(location_id=location_id)
    if date_from:
        pred_qs = pred_qs.filter(timestamp__gte=date_from)
    if date_to:
        pred_qs = pred_qs.filter(timestamp__lte=date_to)

    model_stats = []
    for model_name in [
        "BiLSTM",
        "Attention-LSTM",
        "CNN-BiLSTM",
        "GRU-Attention",
        "Transformer",
    ]:
        model_qs = pred_qs.filter(model_name=model_name)
        agg = model_qs.aggregate(
            avg_predicted=Avg("predicted_kwh"),
            max_predicted=Max("predicted_kwh"),
            min_predicted=Min("predicted_kwh"),
            count=Count("id"),
            avg_r2=Avg("r2_score"),
            avg_rmse=Avg("rmse"),
            avg_mae=Avg("mae"),
            avg_mape=Avg("mape"),
        )
        model_stats.append({"model_name": model_name, **agg})

    events_qs = (
        pred_qs.annotate(event_ts=TruncSecond("timestamp"))
        .values("event_ts")
        .annotate(event_produced=Avg("predicted_kwh"))
    )
    events_agg = events_qs.aggregate(
        total_produced=Sum("event_produced"),
        avg_produced=Avg("event_produced"),
        inference_events=Count("event_ts"),
    )

    energy_agg = {
        "total_produced": events_agg.get("total_produced") or 0,
        "total_consumed": 0,
        "total_exported": events_agg.get("total_produced") or 0,
        "avg_produced": events_agg.get("avg_produced") or 0,
        "reading_count": events_agg.get("inference_events") or 0,
    }

    locations = list(Location.objects.values("id", "name", "state", "solar_zone"))

    return Response(
        {
            "model_stats": model_stats,
            "energy_stats": energy_agg,
            "locations": locations,
            "total_predictions": pred_qs.count(),
        }
    )


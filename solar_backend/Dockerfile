FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies if required for ML libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /app/

EXPOSE 8000

# Give simple command to run dev server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

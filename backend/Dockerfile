# NutriFit FastAPI backend
# Build from the REPO ROOT so the ML modules/datasets are included:
#   docker build -f backend/Dockerfile -t nutrifit-api .
#   docker run -p 5000:5000 --env-file backend/.env nutrifit-api
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for scientific wheels are generally prebuilt; keep image lean.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/backend/requirements.txt

# Copy the ML code/datasets and the backend package.
COPY Diet_Plan_Model/ /app/Diet_Plan_Model/
COPY Work_Out_Model/ /app/Work_Out_Model/
COPY backend/ /app/backend/

EXPOSE 5000

# Gunicorn + Uvicorn workers for production.
CMD ["gunicorn", "backend.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "4", "-b", "0.0.0.0:5000", \
     "--timeout", "120"]

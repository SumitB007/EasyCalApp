FROM python:3.9-slim

WORKDIR /app

# Install git since Mask_RCNN is installed via a git+https link
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies (using --no-cache-dir to keep image size small)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

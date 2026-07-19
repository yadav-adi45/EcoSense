# Use Python 3.11 slim image
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask flask-cors requests

# Copy application code
COPY . .

# Expose port
EXPOSE 8081

# Command to run the service
# Note: Using python -u for unbuffered output
CMD ["python", "-u", "mock_pathway.py"]

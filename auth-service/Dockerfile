FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY *.py ./

# SQLite database lives on a volume mounted at /data.
RUN mkdir /data && chown nobody:nogroup /data
USER nobody
EXPOSE 8000
CMD ["python", "main.py"]

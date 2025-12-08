FROM python:3.11-slim

WORKDIR /code

# Default model cache locations (can be overridden via environment)
ENV HF_HOME=/models_cache/huggingface \
    TRANSFORMERS_CACHE=/models_cache/huggingface/transformers \
    SENTENCE_TRANSFORMERS_HOME=/models_cache/sentence-transformers \
    TORCH_HOME=/models_cache/torch

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Ensure cache directories exist with sane permissions
RUN mkdir -p /models_cache/huggingface/transformers \
    /models_cache/sentence-transformers \
    /models_cache/torch && \
    chmod -R 777 /models_cache

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
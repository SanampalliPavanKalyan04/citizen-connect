# Vercel entry point: exposes the Flask app from backend/app.py
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import app  # noqa: E402,F401

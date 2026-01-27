#!/usr/bin/env python3
"""
Certification Question Generator - Main Entry Point

Run from root directory:
    python3 run.py
    
or with specific provider:
    python3 run.py --provider aws
"""

import sys
import os

# Add src/ to path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import and run the main CLI
from quick_generate import main

if __name__ == "__main__":
    main()

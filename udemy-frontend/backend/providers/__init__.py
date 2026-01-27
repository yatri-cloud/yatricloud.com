"""Providers Module - Multi-provider certification support

Supports AWS, Azure, Google Cloud, and more cloud certifications
with provider-specific domain extraction and question generation context.

Provider Structure:
  providers/
    ├── base_provider.py      (Abstract base class)
    ├── aws/                  (AWS provider)
    │   ├── __init__.py
    │   └── provider.py
    ├── azure/                (Azure provider)
    │   ├── __init__.py
    │   └── provider.py
    └── gcp/                  (Google Cloud provider)
        ├── __init__.py
        └── provider.py
"""

from .base_provider import BaseProvider
from .aws import AWSProvider
from .azure import AzureProvider
from .gcp import GCPProvider

# Provider registry
PROVIDERS = {
    "AWS": AWSProvider,
    "Azure": AzureProvider,
    "Google Cloud": GCPProvider,
}


def get_provider(provider_name: str) -> BaseProvider:
    """Factory function to get provider instance
    
    Args:
        provider_name: Name of provider (case-insensitive)
        
    Returns:
        Instance of requested provider
        
    Raises:
        ValueError: If provider not found
    """
    # Try exact match first
    if provider_name in PROVIDERS:
        return PROVIDERS[provider_name]()
    
    # Try case-insensitive match
    for name, provider_class in PROVIDERS.items():
        if name.lower() == provider_name.lower():
            return provider_class()
    
    available = ", ".join(PROVIDERS.keys())
    raise ValueError(f"Provider '{provider_name}' not found. Available: {available}")


__all__ = ["BaseProvider", "AWSProvider", "AzureProvider", "GCPProvider", "PROVIDERS", "get_provider"]

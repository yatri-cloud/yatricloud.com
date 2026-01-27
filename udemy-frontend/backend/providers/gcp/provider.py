"""GCP Provider - Google Cloud Platform Certification Domains & Context"""

import sys
import os

# Add parent providers directory to path for base_provider import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_provider import BaseProvider
from typing import List, Dict
import re


class GCPProvider(BaseProvider):
    """Google Cloud Platform Certification Provider
    
    Handles extraction of GCP exam domains from official exam guides
    and provides context for question generation.
    
    Supported Certifications:
    - Associate Cloud Engineer
    - Professional Cloud Architect
    - Professional Data Engineer
    - Professional Cloud Security Engineer
    - Professional DevOps Engineer
    - Professional Cloud Database Engineer
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Google Cloud"
        self.certifications = [
            "Google Cloud Associate Cloud Engineer",
            "Google Cloud Professional Cloud Architect",
            "Google Cloud Professional Data Engineer",
            "Google Cloud Professional Cloud Security Engineer",
            "Google Cloud Professional DevOps Engineer",
            "Google Cloud Professional Cloud Database Engineer",
        ]
    
    def extract_domains_from_pdf(self, pdf_path: str) -> Dict:
        """Extract Google Cloud exam domains from PDF
        
        GCP exam guides use multiple patterns:
        - Section X: Section Name (##%)
        - Domain X: Description (##%)
        - Objective X: Objective Name
        """
        text = self.read_pdf_text(pdf_path)
        
        # GCP typically uses "Section X: Section Name (%)" format
        patterns = [
            r'Section\s+(\d+):\s+([^(%\n]+)\s+\((\d+)%',  # Section with percentage
            r'Domain\s+\d+[:\s]+([^(\n]+)\s+\((\d+)%',     # Domain with percentage
            r'Objective\s+\d+:\s+([^\n]+)',                 # Objective-based
        ]
        
        domains_info = {}
        for pattern in patterns:
            domains_info = self.extract_weighted_domains(text, pattern)
            if domains_info:
                break
        
        self.domain_details = domains_info if domains_info else self._extract_generic_domains(text)
        self.domains = list(self.domain_details.keys())
        
        return {
            "domains": self.domains,
            "details": self.domain_details
        }
    
    def get_domain_context(self, domain: str) -> str:
        """Get rich context for Google Cloud question generation
        
        Returns domain-specific context including weighting, areas,
        and GCP-specific services for better question generation
        """
        if domain not in self.domain_details:
            return domain
        
        details = self.domain_details[domain]
        context = f"{domain}"
        
        if details.get("weighting"):
            context += f" ({details['weighting']}% of exam)"
        
        # GCP specific context
        context += ". Focus on Google Cloud architecture and services"
        
        if details.get("tasks"):
            context += ". Key areas:"
            for task in details.get("tasks", [])[:2]:
                context += f"\n- {task.get('name', '')}"
        
        return context
    
    def validate_certification_name(self, cert_name: str) -> bool:
        """Validate Google Cloud certification name against known certifications"""
        return any(cert.lower() in cert_name.lower() for cert in self.certifications)
    
    def get_available_certifications(self) -> List[str]:
        """Get list of Google Cloud certifications"""
        return self.certifications
    
    def _extract_generic_domains(self, text: str) -> Dict:
        """Extract domains using generic patterns
        
        Used as fallback when standard patterns don't match
        """
        domains = {}
        
        # Look for sections or objectives
        pattern = r'(?:Section|Objective|Domain)[\s:]+([^\n]+(?:Cloud|GCP|Google)[^\n]*)'
        matches = re.finditer(pattern, text, re.IGNORECASE)
        
        for i, match in enumerate(matches, 1):
            domain_name = match.group(1).strip()
            domains[domain_name] = {
                "weighting": 0,
                "tasks": [],
                "keywords": self._extract_keywords(domain_name)
            }
        
        return domains
    
    def _extract_keywords(self, domain_name: str) -> List[str]:
        """Extract Google Cloud specific keywords from domain name
        
        Maps domain names to GCP service keywords for context-aware
        question generation
        """
        keywords = []
        
        keyword_map = {
            "Compute": ["vm", "compute engine", "app engine", "cloud functions", "gke", "kubernetes"],
            "Storage": ["cloud storage", "firestore", "datastore", "bigtable"],
            "Networking": ["vpc", "load balancing", "cloud cdn", "cloud interconnect"],
            "Database": ["cloud sql", "cloud spanner", "firestore", "bigtable", "datastore"],
            "Data": ["bigquery", "dataflow", "dataproc", "pub/sub", "analytics"],
            "Security": ["identity", "iam", "cloud armor", "kms", "secret manager"],
            "Architecture": ["design", "scalability", "resilience", "performance", "cost"],
            "DevOps": ["deployment", "cicd", "monitoring", "logging", "tracing"],
        }
        
        for key, values in keyword_map.items():
            if key.lower() in domain_name.lower():
                keywords.extend(values)
        
        return list(set(keywords))

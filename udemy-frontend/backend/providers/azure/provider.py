"""Azure Provider - Azure Certification Domains & Context"""

import sys
import os

# Add parent providers directory to path for base_provider import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_provider import BaseProvider
from typing import List, Dict
import re


class AzureProvider(BaseProvider):
    """Azure Certification Provider
    
    Handles extraction of Azure exam domains from official exam guides
    and provides context for question generation.
    
    Supported Certifications:
    - AZ-900 (Fundamentals)
    - AZ-104 (Administrator)
    - AZ-204 (Developer Associate)
    - AZ-305 (Solutions Architect Expert)
    - AZ-500 (Security Engineer)
    - AI-102 (AI Engineer Associate)
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Azure"
        self.certifications = [
            "Azure Fundamentals (AZ-900)",
            "Azure Administrator (AZ-104)",
            "Azure Developer Associate (AZ-204)",
            "Azure Solutions Architect Expert (AZ-305)",
            "Azure Security Engineer (AZ-500)",
            "Azure Data Engineer Associate (AZ-900)",
            "Azure AI Engineer Associate (AI-102)",
        ]
    
    def extract_domains_from_pdf(self, pdf_path: str) -> Dict:
        """Extract Azure exam domains from PDF
        
        Azure exam guides use multiple patterns:
        - Skill X.Y: Skill Name
        - Domain X: Description (##%)
        - Module X: Module Name
        """
        text = self.read_pdf_text(pdf_path)
        
        # Azure typically uses "Skill X.Y: Skill Name" or "Domain: Description"
        patterns = [
            r'Skill\s+(\d+\.\d+):\s+([^\n]+)',  # Skill-based
            r'Domain\s+\d+[:\s]+([^(\n]+)\s+\((\d+)%',  # Domain with percentage
            r'Module\s+\d+:\s+([^\n]+(?:Azure|Cloud)[^\n]*)',  # Module-based
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
        """Get rich context for Azure question generation
        
        Returns domain-specific context including weighting, objectives,
        and Azure-specific services for better question generation
        """
        if domain not in self.domain_details:
            return domain
        
        details = self.domain_details[domain]
        context = f"{domain}"
        
        if details.get("weighting"):
            context += f" ({details['weighting']}% of exam)"
        
        # Azure specific context
        context += ". Focus on Azure cloud architecture and best practices"
        
        if details.get("tasks"):
            context += ". Key learning objectives:"
            for task in details.get("tasks", [])[:2]:
                context += f"\n- {task.get('name', '')}"
        
        return context
    
    def validate_certification_name(self, cert_name: str) -> bool:
        """Validate Azure certification name against known certifications"""
        return any(cert.lower() in cert_name.lower() for cert in self.certifications)
    
    def get_available_certifications(self) -> List[str]:
        """Get list of Azure certifications"""
        return self.certifications
    
    def _extract_generic_domains(self, text: str) -> Dict:
        """Extract domains using generic patterns
        
        Used as fallback when standard patterns don't match
        """
        domains = {}
        
        # Look for skill areas or learning objectives
        pattern = r'(?:Skill|Objective|Domain)[\s:]+([^\n]+(?:Azure|Cloud)[^\n]*)'
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
        """Extract Azure-specific keywords from domain name
        
        Maps domain names to Azure service keywords for context-aware
        question generation
        """
        keywords = []
        
        keyword_map = {
            "Administrator": ["vm", "storage", "networking", "identity", "governance", "iaas"],
            "Developer": ["app service", "azure functions", "cosmosdb", "storage", "apis", "paas"],
            "Solutions Architect": ["design", "scalability", "resilience", "cost", "security", "multi-region"],
            "Security Engineer": ["identity", "authentication", "encryption", "compliance", "security"],
            "Data Engineer": ["databases", "big data", "analytics", "pipelines", "spark"],
            "AI": ["cognitive services", "machine learning", "nlp", "computer vision", "ml ops"],
            "Fundamentals": ["cloud concepts", "azure services", "governance", "pricing"],
        }
        
        for key, values in keyword_map.items():
            if key.lower() in domain_name.lower():
                keywords.extend(values)
        
        return list(set(keywords))

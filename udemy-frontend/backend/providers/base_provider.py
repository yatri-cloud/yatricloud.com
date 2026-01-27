from abc import ABC, abstractmethod
from typing import List, Dict
import pdfplumber
import re

class BaseProvider(ABC):
    """Base class for certification providers"""
    
    def __init__(self):
        self.name = ""
        self.domains = []
        self.domain_details = {}
    
    @abstractmethod
    def extract_domains_from_pdf(self, pdf_path: str) -> Dict:
        """Extract domains and details from exam guide PDF
        
        Returns:
            Dictionary with domains, weightings, tasks, etc.
        """
        pass
    
    @abstractmethod
    def get_domain_context(self, domain: str) -> str:
        """Get rich context for question generation based on domain"""
        pass
    
    @abstractmethod
    def validate_certification_name(self, cert_name: str) -> bool:
        """Validate if certification name is valid for this provider"""
        pass
    
    @abstractmethod
    def get_available_certifications(self) -> List[str]:
        """Get list of available certifications for this provider"""
        pass
    
    def read_pdf_text(self, pdf_path: str) -> str:
        """Helper: Read text from PDF"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
                return full_text
        except Exception as e:
            raise Exception(f"Error reading PDF: {e}")
    
    def extract_weighted_domains(self, text: str, pattern: str) -> Dict:
        """Helper: Extract domains with weightings using regex pattern
        
        Args:
            text: Full PDF text
            pattern: Regex pattern to match domains with weightings
            
        Returns:
            Dictionary of domains with details
        """
        domains_info = {}
        
        matches = re.finditer(pattern, text)
        for match in matches:
            domain_name = match.group(1).strip()
            weighting = int(match.group(2)) if match.lastindex >= 2 else 0
            
            domains_info[domain_name] = {
                "weighting": weighting,
                "tasks": self._extract_tasks(text, domain_name),
                "keywords": self._extract_keywords(domain_name)
            }
        
        return domains_info
    
    def _extract_tasks(self, text: str, domain_name: str) -> List[Dict]:
        """Helper: Extract tasks for a domain"""
        return []
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Helper: Extract relevant keywords"""
        return []

"""AWS Provider - AWS Certification Domains & Context"""

import sys
import os

# Add parent providers directory to path for base_provider import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_provider import BaseProvider
from typing import List, Dict
import re


class AWSProvider(BaseProvider):
    """AWS Certification Provider
    
    Handles extraction of AWS exam domains from official exam guides
    and provides context for question generation.
    
    Supported Certifications:
    - Cloud Practitioner
    - Solutions Architect (Associate, Professional)
    - Developer - Associate
    - SysOps Administrator - Associate
    - DevOps Engineer - Professional
    - Database - Specialty
    - Advanced Networking - Specialty
    """
    
    def __init__(self):
        super().__init__()
        self.name = "AWS"
        self.certifications = [
            "AWS Certified Cloud Practitioner",
            "AWS Certified Solutions Architect - Associate",
            "AWS Certified Solutions Architect - Professional",
            "AWS Certified Developer - Associate",
            "AWS Certified SysOps Administrator - Associate",
            "AWS Certified DevOps Engineer - Professional",
            "AWS Certified Database - Specialty",
            "AWS Certified Advanced Networking - Specialty",
        ]
    
    def extract_domains_from_pdf(self, pdf_path: str) -> Dict:
        """Extract AWS exam domains from PDF
        
        AWS exam guides use "Content Domain X: Name (##%)" format
        This method extracts the domain structure and weightings
        """
        text = self.read_pdf_text(pdf_path)
        
        # AWS uses "Content Domain X: Name (##%)" format
        pattern = r'Content Domain\s+(\d+):\s+([^(\n]+)\s+\((\d+)%'
        
        domains_info = {}
        matches = re.finditer(pattern, text)
        
        for match in matches:
            domain_num = match.group(1)
            domain_name = match.group(2).strip()
            weighting = int(match.group(3))
            
            domains_info[domain_name] = {
                "number": domain_num,
                "weighting": weighting,
                "tasks": self._extract_tasks_for_domain(text, domain_num),
                "keywords": self._extract_keywords(domain_name)
            }
        
        if not domains_info:
            # Fallback pattern if content domain not found
            pattern = r'Domain\s+(\d+)[:\s]+([^(\n]+)\s+\((\d+)%'
            matches = re.finditer(pattern, text)
            for match in matches:
                domain_num = match.group(1)
                domain_name = match.group(2).strip()
                weighting = int(match.group(3))
                
                domains_info[domain_name] = {
                    "number": domain_num,
                    "weighting": weighting,
                    "tasks": [],
                    "keywords": self._extract_keywords(domain_name)
                }
        
        self.domain_details = domains_info
        self.domains = list(domains_info.keys())
        
        return {
            "domains": self.domains,
            "details": domains_info
        }
    
    def _extract_tasks_for_domain(self, text: str, domain_num: str) -> List[Dict]:
        """Extract AWS tasks for a specific domain
        
        AWS exam guides typically include "Task X.Y: Task Name" items
        under each domain section
        """
        tasks = []
        
        # Find tasks like "Task 1.1: Task Name"
        task_pattern = rf'Task\s+{domain_num}\.\d+:\s+([^\n.]+)'
        task_matches = re.finditer(task_pattern, text)
        
        for match in task_matches:
            task_name = match.group(1).strip()
            tasks.append({
                "name": task_name,
                "knowledge": []
            })
        
        return tasks[:5]  # Return first 5 tasks
    
    def get_domain_context(self, domain: str) -> str:
        """Get rich context for AWS question generation
        
        Returns domain-specific context including weighting, tasks,
        and AWS-specific keywords for better question generation
        """
        if domain not in self.domain_details:
            return domain
        
        details = self.domain_details[domain]
        context = f"{domain}"
        
        if details.get("weighting"):
            context += f" ({details['weighting']}% of exam)"
        
        # AWS specific context
        context += ". Focus on AWS Well-Architected Framework pillars"
        
        if details.get("tasks"):
            context += ". Key tasks:"
            for task in details.get("tasks", [])[:2]:
                context += f"\n- {task.get('name', '')}"
        
        return context
    
    def validate_certification_name(self, cert_name: str) -> bool:
        """Validate AWS certification name against known certifications"""
        return any(cert.lower() in cert_name.lower() for cert in self.certifications)
    
    def get_available_certifications(self) -> List[str]:
        """Get list of AWS certifications"""
        return self.certifications
    
    def _extract_tasks(self, text: str, domain_name: str) -> List[Dict]:
        """Extract AWS tasks for a domain (base method override)"""
        return []
    
    def _extract_keywords(self, domain_name: str) -> List[str]:
        """Extract AWS-specific keywords from domain name
        
        Maps domain names to AWS service keywords for context-aware
        question generation
        """
        keywords = []
        
        keyword_map = {
            "Organizational Complexity": ["multi-account", "networking", "security", "governance", "organizations"],
            "New Solutions": ["deployment", "continuity", "reliability", "performance", "cost", "security"],
            "Continuous Improvement": ["operational excellence", "monitoring", "optimization", "automation"],
            "Migration": ["migration", "workload", "modernization", "database", "data transfer"],
            "Design": ["architecture", "scalability", "availability", "resilience", "well-architected"],
            "Security": ["identity", "access", "encryption", "compliance", "iam"],
            "Cost": ["optimization", "pricing", "rightsizing", "budget", "reserved instances"],
            "Performance": ["optimization", "caching", "scaling", "monitoring", "cloudwatch"],
        }
        
        for key, values in keyword_map.items():
            if key.lower() in domain_name.lower():
                keywords.extend(values)
        
        return list(set(keywords))

import pdfplumber
import re
from typing import List, Dict, Tuple

class PDFDomainExtractor:
    """Extract exam domains, tasks, and detailed content from AWS exam guide PDFs"""
    
    def __init__(self, pdf_path: str):
        """
        Initialize with PDF path
        
        Args:
            pdf_path: Path to the exam guide PDF
        """
        self.pdf_path = pdf_path
        self.domains = []
        self.domain_details = {}  # Store detailed domain info
        self.all_tasks = []  # Store all tasks for context
        
    def extract_all(self) -> Dict:
        """
        Extract comprehensive exam guide information
        
        Returns:
            Dictionary with domains, weightings, tasks, and knowledge
        """
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                full_text = ""
                
                # Extract text from all pages
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
                
                # Extract structured information
                self.domain_details = self._parse_domains_with_details(full_text)
                self.domains = list(self.domain_details.keys())
                
                return {
                    "domains": self.domains,
                    "details": self.domain_details,
                    "full_text": full_text[:5000]  # Store summary text for context
                }
                
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return {}
    
    def _parse_domains_with_details(self, text: str) -> Dict:
        """
        Parse domains with detailed task and knowledge information
        
        Args:
            text: Full text from PDF
            
        Returns:
            Dictionary with domain details
        """
        domains_info = {}
        
        # Pattern: "Content Domain X: Domain Name (##% of scored content)"
        domain_pattern = r'Content Domain (\d+):\s+([^(\n]+)\s+\((\d+)%'
        domain_matches = re.finditer(domain_pattern, text)
        
        for match in domain_matches:
            domain_num = match.group(1)
            domain_name = match.group(2).strip()
            weighting = int(match.group(3))
            
            # Extract tasks for this domain
            domain_id = f"Domain {domain_num}"
            tasks = self._extract_tasks_for_domain(text, domain_name, domain_num)
            
            domains_info[domain_name] = {
                "number": domain_num,
                "weighting": weighting,
                "tasks": tasks,
                "keywords": self._extract_keywords(domain_name)
            }
        
        # If Content Domain pattern not found, try simpler patterns
        if not domains_info:
            domains_info = self._extract_domains_basic(text)
        
        return domains_info
    
    def _extract_tasks_for_domain(self, text: str, domain_name: str, domain_num: str) -> List[Dict]:
        """
        Extract tasks and knowledge items for a domain
        
        Args:
            text: Full text
            domain_name: Domain name
            domain_num: Domain number
            
        Returns:
            List of task dictionaries
        """
        tasks = []
        
        # Find all tasks like "Task 1.1: Architect network connectivity"
        task_pattern = rf'Task {domain_num}\.\d+:\s+([^\n]+)'
        task_matches = re.finditer(task_pattern, text)
        
        for match in task_matches:
            task_name = match.group(1).strip()
            
            # Extract knowledge items after "Knowledge of:"
            knowledge_start = match.end()
            knowledge_section = text[knowledge_start:knowledge_start+1000]
            
            knowledge_items = []
            knowledge_pattern = r'•\s+([^\n]+)'
            for k_match in re.finditer(knowledge_pattern, knowledge_section[:500]):
                knowledge_items.append(k_match.group(1).strip())
                if len(knowledge_items) >= 3:
                    break
            
            tasks.append({
                "name": task_name,
                "knowledge": knowledge_items[:3]
            })
        
        return tasks
    
    def _extract_keywords(self, domain_name: str) -> List[str]:
        """Extract key AWS concepts from domain name"""
        keywords = []
        
        # Common AWS domain keywords
        keyword_map = {
            "Organizational Complexity": ["multi-account", "networking", "security", "governance"],
            "New Solutions": ["deployment", "business continuity", "reliability", "performance", "cost"],
            "Continuous Improvement": ["operational excellence", "security", "performance", "reliability"],
            "Migration": ["migration", "workload", "modernization", "database migration"],
            "Design": ["architecture", "scalability", "availability", "resilience"],
            "Security": ["identity", "access", "encryption", "compliance"],
            "Cost": ["optimization", "pricing", "rightsizing", "monitoring"],
            "Performance": ["optimization", "caching", "scaling", "monitoring"],
        }
        
        for key, values in keyword_map.items():
            if key.lower() in domain_name.lower():
                keywords.extend(values)
        
        return list(set(keywords))
    
    def _extract_domains_basic(self, text: str) -> Dict:
        """Fallback: Extract domains using basic patterns"""
        domains_info = {}
        
        # Pattern 1: "Domain 1: Design High-Performing Architectures (26%)"
        pattern1 = r'Domain\s+\d+[:\s]+([^(\n]+)\s+\((\d+)%'
        matches1 = re.finditer(pattern1, text, re.IGNORECASE)
        
        for i, match in enumerate(matches1, 1):
            domain_name = match.group(1).strip()
            weighting = int(match.group(2)) if match.group(2) else 0
            
            domains_info[domain_name] = {
                "number": str(i),
                "weighting": weighting,
                "tasks": [],
                "keywords": self._extract_keywords(domain_name)
            }
        
        return domains_info
    
    def print_domains(self):
        """Print extracted domains with details"""
        print("\n" + "=" * 70)
        print("EXTRACTED DOMAINS FROM EXAM GUIDE")
        print("=" * 70)
        if self.domain_details:
            for domain_name, details in self.domain_details.items():
                weighting = details.get("weighting", 0)
                tasks = details.get("tasks", [])
                print(f"\n{domain_name}")
                if weighting:
                    print(f"  Weighting: {weighting}%")
                if tasks:
                    print(f"  Tasks: {len(tasks)}")
                    for task in tasks[:2]:
                        print(f"    - {task['name']}")
        else:
            print("No domains found in PDF")
        print("=" * 70)
    
    def get_context_for_question(self, domain: str) -> str:
        """
        Get rich context for question generation
        
        Args:
            domain: Domain name
            
        Returns:
            Formatted context string
        """
        if domain not in self.domain_details:
            return domain
        
        details = self.domain_details[domain]
        context = f"{domain}"
        
        if details.get("weighting"):
            context += f" ({details['weighting']}% of exam)"
        
        if details.get("tasks"):
            context += "\n  Focus areas:"
            for task in details.get("tasks", [])[:2]:
                context += f"\n    - {task['name']}"
        
        return context


def extract_pdf_domains(pdf_path: str) -> Tuple[List[str], Dict]:
    """
    Convenience function to extract domains from PDF
    
    Args:
        pdf_path: Path to exam guide PDF
        
    Returns:
        Tuple of (domains list, domain details dict)
    """
    extractor = PDFDomainExtractor(pdf_path)
    result = extractor.extract_all()
    return result.get("domains", []), result.get("details", {})

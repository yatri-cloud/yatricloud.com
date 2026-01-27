# Multi-Provider Certification Question Generator

## Architecture Overview

This system generates exam questions for multiple cloud certification providers using local Ollama LLM models.

### Supported Providers
- **AWS** - AWS Certified certifications
- **Azure** - Microsoft Azure certifications  
- **Google Cloud** - Google Cloud Platform certifications

## Project Structure

```
.
├── quick_generate.py                 # Main CLI interface (interactive)
├── generate_questions_ollama.py      # Core question generation engine
├── providers/                        # Provider module
│   ├── __init__.py                   # Module initialization & factory
│   ├── base_provider.py              # Abstract base provider class
│   ├── aws_provider.py               # AWS certification provider
│   ├── azure_provider.py             # Azure certification provider
│   └── gcp_provider.py               # Google Cloud provider
├── OLLAMA_SETUP.md                   # Setup guide for users
└── ARCHITECTURE.md                   # This file
```

## File Descriptions

### quick_generate.py (213 lines)
**Purpose:** Interactive CLI for question generation

**Flow:**
1. **Step 0** - Select provider (AWS/Azure/Google Cloud)
2. **Step 1** - Choose certification name with validation
3. **Step 2** - Specify number of questions to generate
4. **Step 3** - Enter exam duration
5. **Step 4** - Upload exam guide PDF (optional)
   - Auto-extracts domains using provider-specific patterns
   - Shows extracted domains for confirmation
6. **Step 5** - Select Ollama model (mistral/llama2/neural-chat/gpt-oss)

**Output:** CSV file with questions, options, and explanations

---

### generate_questions_ollama.py
**Purpose:** Core question generation engine using Ollama API

**Key Methods:**
- `generate_question(certification, topic, num_options=4, context=None)`
  - Generates single question with exactly 4 answer options
  - Accepts optional domain context for better questions
  - Returns dict with question, options, explanations, correct answer
  
- `generate_bulk_questions(certification, provider_name, topics, questions_per_topic, num_options=4, domain_details=None, provider=None)`
  - Generates multiple questions per topic
  - Uses provider instance for domain context
  - Returns list of formatted question dictionaries
  
- `save_to_csv(questions, filename)`
  - Exports questions to CSV matching exam guide template
  - 4 options with individual explanations

**Dependencies:**
- requests (HTTP to Ollama API)
- json (response parsing)
- pandas (CSV export)

---

### providers/base_provider.py
**Purpose:** Abstract interface for certification providers

**Abstract Methods:**
```python
def extract_domains_from_pdf(pdf_path):
    """Extract domains/topics from exam guide PDF"""
    pass

def get_domain_context(domain):
    """Return rich context/metadata for domain"""
    pass

def validate_certification_name(cert_name):
    """Validate if cert name is valid for provider"""
    pass

def get_available_certifications():
    """Return list of supported certifications"""
    pass
```

**Properties:**
- `name` - Provider display name (e.g., "AWS", "Azure")
- `supported_certifications` - List of certification names

---

### providers/aws_provider.py
**Purpose:** AWS certification provider implementation

**Features:**
- Domain extraction pattern: `Content Domain X: Name (##%)`
- Extracts Task X.Y items for each domain
- Maps domain names to AWS keywords (multi-account, security, cost, etc.)

**Supported Certifications:**
- Cloud Practitioner
- Solutions Architect (Associate, Professional)
- Developer - Associate
- SysOps Administrator - Associate
- DevOps Engineer - Professional
- Database Specialty
- Networking Specialty

**Tested:** ✅ Domain extraction working with actual AWS exam guides

---

### providers/azure_provider.py
**Purpose:** Azure certification provider implementation

**Features:**
- Multiple pattern support:
  - `Skill X.Y`
  - `Module X`
  - Generic `Domain` format
- Fallback to generic pattern matching
- Maps domain names to Azure services (App Service, CosmosDB, Identity, etc.)

**Supported Certifications:**
- AZ-900 (Fundamentals)
- AZ-104 (Administrator)
- AZ-204 (Developer)
- AZ-305 (Solutions Architect)
- AZ-500 (Security)
- AI-102 (AI Engineer)

**Status:** ✅ Structure ready, pending real exam guide testing

---

### providers/gcp_provider.py
**Purpose:** Google Cloud provider implementation

**Features:**
- Pattern support:
  - `Section X: Name`
  - Generic `Domain` format
  - `Objective` items
- Fallback generic matching
- Maps to GCP services (Compute Engine, Cloud SQL, BigQuery, etc.)

**Supported Certifications:**
- Associate Cloud Engineer
- Professional Cloud Architect
- Data Engineer
- Security Engineer
- DevOps Engineer
- Database Engineer

**Status:** ✅ Structure ready, pending real exam guide testing

---

### providers/__init__.py
**Purpose:** Module initialization and factory function

**Key Components:**
```python
PROVIDERS = {
    "AWS": AWSProvider,
    "Azure": AzureProvider,
    "Google Cloud": GCPProvider
}

def get_provider(provider_name):
    """Factory function - returns provider instance"""
    pass
```

---

## Usage

### Basic Usage
```bash
./myenv/bin/python3 quick_generate.py
```

Then follow the interactive prompts:
1. Select provider (1-3)
2. Enter certification name
3. Specify number of questions
4. Enter exam duration
5. (Optional) Upload PDF and select domains
6. Choose Ollama model
7. Confirm and generate

### Example Session
```
Select provider: 1 (AWS)
Certification: AWS Certified Solutions Architect - Professional
Questions: 5
Duration: 180 minutes
PDF: /path/to/AWS-exam-guide.pdf
Use domains: y
Model: 1 (mistral)
Proceed: y
```

**Output:** `aws_aws_certified_s_5_questions.csv`

---

## Design Patterns Used

### 1. Provider Pattern
- **Purpose:** Encapsulate certification provider logic
- **Benefit:** Easy to add new providers (Kubernetes, Linux, etc.)
- **Implementation:** BaseProvider abstract class with AWS/Azure/GCP subclasses

### 2. Strategy Pattern
- **Purpose:** Different PDF parsing strategies per provider
- **Benefit:** Each provider handles its exam guide format independently

### 3. Factory Pattern
- **Purpose:** `get_provider()` function returns correct provider instance
- **Benefit:** Decouples provider selection from main logic

---

## Question Generation Logic

### Temperature & Randomness
- Temperature: 0.5 (balanced creativity/consistency)
- Ensures mostly consistent question structure with minor variations

### Option Enforcement
- Always generates exactly 4 options
- JSON schema includes validation
- Fallback logic removes invalid options and regenerates

### Context Injection
- Provider passes domain weighting and task information
- Ollama receives enriched context for better questions
- Example: "Domain: Design Solutions for Organizational Complexity (25% weight)"

---

## CSV Output Format

| Column | Description |
|--------|-------------|
| Question | Full question text |
| Question Type | Always "multiple-choice" |
| Answer Option 1-4 | The four possible answers |
| Explanation 1-4 | Why each option is correct/incorrect |
| Correct Answers | Option number (1-4) of correct answer |
| Overall Explanation | Summary of why correct answer is best |
| Domain | Extracted from exam guide (if PDF provided) |

---

## Ollama Setup

See `OLLAMA_SETUP.md` for:
- Installing Ollama
- Pulling models
- Starting Ollama server
- Testing API connectivity

**Recommended Model:** Mistral (4.1GB, fast, balanced quality)

---

## Extending the System

### Adding a New Provider

1. Create `providers/new_provider.py`:
```python
from providers.base_provider import BaseProvider

class NewProvider(BaseProvider):
    name = "New Provider"
    supported_certifications = [...]
    
    def extract_domains_from_pdf(self, pdf_path):
        # Implement domain extraction logic
        pass
    
    def _extract_keywords(self, domain):
        # Map domain to provider-specific keywords
        pass
```

2. Register in `providers/__init__.py`:
```python
from providers.new_provider import NewProvider

PROVIDERS = {
    ...
    "New Provider": NewProvider
}
```

3. Test with exam guide PDF

---

## Status Summary

✅ **Completed:**
- AWS provider with tested domain extraction
- Multi-provider architecture
- Question generation with context
- CSV export
- CLI interface

🟡 **In Progress:**
- Azure provider testing
- GCP provider testing

⏳ **Future Enhancements:**
- More providers (Kubernetes, Linux, HashiCorp)
- Different question types (scenario-based, labs, drag-and-drop)
- Question difficulty levels
- Spaced repetition support
- Web UI version

---

## Commit History

**Latest:** Refactored quick_generate.py to fix file structure
- Removed duplicate code sections (466 lines → 213 lines)
- Fixed input flow (Steps 2-4 now execute once)
- Tested end-to-end with AWS provider
- All provider modules created and importable


# Certification Question Generator

**Generate realistic exam questions using local Ollama models for AWS, Azure, and Google Cloud certifications.**

## Quick Start

### 1. Prerequisites
- Python 3.13+
- Ollama running locally
- Virtual environment with dependencies installed

### 2. Run the Generator
```bash
python3 run.py
```

Or with the venv:
```bash
./myenv/bin/python3 run.py
```

### 3. Follow the 5-Step Wizard
1. **Select Provider** - AWS, Azure, or Google Cloud
2. **Choose Certification** - Valid certification for provider
3. **Specify Quantity** - Number of questions to generate
4. **Set Duration** - Exam time in minutes (just a number)
5. **Select Model** - mistral (fast), llama2, neural-chat, or gpt-oss
6. *(Optional)* Upload exam guide PDF for domain extraction

### 4. Get Your Questions
CSV file is automatically generated with questions, options, and explanations.

---

## Project Structure

```
.
├── run.py                    # Main entry point (use this!)
├── README.md                 # This file
│
├── src/                      # Application code
│   ├── quick_generate.py     # Interactive CLI
│   ├── generate_questions_ollama.py
│   └── pdf_domain_extractor.py
│
├── providers/                # Multi-provider support
│   ├── base_provider.py      # Abstract base
│   ├── aws/
│   │   ├── __init__.py
│   │   └── provider.py       # AWS provider
│   ├── azure/
│   │   ├── __init__.py
│   │   └── provider.py       # Azure provider
│   └── gcp/
│       ├── __init__.py
│       └── provider.py       # Google Cloud provider
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System design & structure
│   ├── SETUP_TEST_GUIDE.md   # Setup & testing guide
│   └── OLLAMA_SETUP.md       # Ollama installation
│
├── examples/                 # Example outputs & data
│   └── *.csv                 # Sample generated questions
│
├── legacy/                   # Old/deprecated files
│   └── *.py                  # Previous versions
│
└── myenv/                    # Python virtual environment
```

---

## Supported Certifications

### AWS ✅ (Fully Tested)
- Cloud Practitioner
- Solutions Architect - Associate
- Solutions Architect - Professional
- Developer - Associate
- SysOps Administrator - Associate
- DevOps Engineer - Professional
- Database - Specialty
- Advanced Networking - Specialty

### Azure 🟡 (Ready)
- AZ-900 (Fundamentals)
- AZ-104 (Administrator)
- AZ-204 (Developer)
- AZ-305 (Solutions Architect)
- AZ-500 (Security)
- AI-102 (AI Engineer)

### Google Cloud 🟡 (Ready)
- Associate Cloud Engineer
- Professional Cloud Architect
- Professional Data Engineer
- Professional Cloud Security Engineer
- Professional DevOps Engineer
- Professional Cloud Database Engineer

---

## Features

✨ **Smart Question Generation**
- Uses local Ollama models (no API keys needed)
- Context-aware based on exam domains
- Exactly 4 options per question
- Includes detailed explanations

📄 **PDF Domain Extraction**
- Auto-extract topics from official exam guides
- Provider-specific parsing patterns
- Weighted domain importance
- Task and knowledge mapping

🔄 **Multi-Provider Architecture**
- Extensible provider pattern
- Easy to add new certification providers
- Consistent interface across providers

📊 **CSV Export**
- Exam-ready format
- Questions, options, explanations
- Domain and weighting information
- Compatible with study tools

---

## Setup

### 1. Install Ollama
```bash
# macOS
brew install ollama

# Linux/Windows
# Download from https://ollama.ai
```

### 2. Start Ollama
```bash
ollama serve
```

### 3. Pull a Model
```bash
# Recommended (4.1GB, fastest)
ollama pull mistral

# Or alternatives
ollama pull llama2
ollama pull neural-chat
ollama pull gpt-oss
```

### 4. Install Python Dependencies
```bash
cd "/Volumes/Yatri Cloud/Udemy"
./myenv/bin/pip install requests pandas pdfplumber
```

---

## Usage Examples

### Generate 5 AWS SAP Questions
```bash
python3 run.py
# Provider: 1 (AWS)
# Certification: AWS Certified Solutions Architect - Professional
# Questions: 5
# Duration: 180
# PDF: (skip with Enter)
# Model: 1 (mistral)
```

### Generate with PDF Domain Extraction
```bash
python3 run.py
# Select AWS
# Enter certification
# Questions: 10
# Duration: 130
# PDF: /path/to/AWS-SAP-exam-guide.pdf
# Use domains: y
# Select model
```

---

## Question Format

Questions are generated in CSV format:

| Column | Content |
|--------|---------|
| Question | Full question text |
| Question Type | "multiple-choice" |
| Answer Option 1-4 | Four possible answers |
| Explanation 1-4 | Why each is correct/incorrect |
| Correct Answers | Option number (1-4) |
| Overall Explanation | Summary of best answer |
| Domain | From exam guide (if PDF provided) |

---

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, design patterns, extending
- **[SETUP_TEST_GUIDE.md](docs/SETUP_TEST_GUIDE.md)** - Installation, testing, troubleshooting
- **[OLLAMA_SETUP.md](docs/OLLAMA_SETUP.md)** - Ollama installation & models

---

## Troubleshooting

### "Connection refused"
Make sure Ollama is running:
```bash
ollama serve
```

### "Model not found"
Pull the model first:
```bash
ollama pull mistral
```

### Slow question generation
- Use mistral (fastest)
- Reduce number of questions
- Check CPU/GPU usage

### PDF not parsing correctly
- Check if format matches expected patterns
- See docs/ARCHITECTURE.md for provider patterns
- May need regex adjustment for custom formats

---

## Architecture

The system uses professional design patterns:
- **Provider Pattern** - Encapsulate provider logic
- **Factory Pattern** - Dynamic provider instantiation
- **Strategy Pattern** - Provider-specific PDF parsing
- **Template Method** - BaseProvider defines structure

Each provider is **self-contained** in its own folder, making it easy to add new certification providers (Kubernetes, HashiCorp, etc.).

---

## Status

✅ **Production Ready for AWS**
- Fully tested with real AWS exam guides
- Clean, organized code
- Professional architecture

🟡 **Azure & GCP Ready**
- Code complete
- Needs exam guide testing

⏳ **Future**
- More providers (Kubernetes, HashiCorp, Linux)
- Question difficulty levels
- Scenario-based questions
- Web UI version

---

## Contributing

To add a new provider:

1. Create `providers/newprovider/provider.py`
2. Inherit from `BaseProvider`
3. Implement domain extraction
4. Register in `providers/__init__.py`
5. Test with exam guide PDF

See `docs/ARCHITECTURE.md` for detailed extending guide.

---

## License

MIT License - See repo for details

---

## Support

For issues or questions:
1. Check `docs/SETUP_TEST_GUIDE.md` troubleshooting
2. Review `docs/ARCHITECTURE.md` for design info
3. Check provider-specific code in `providers/*/provider.py`

Happy studying! 📚
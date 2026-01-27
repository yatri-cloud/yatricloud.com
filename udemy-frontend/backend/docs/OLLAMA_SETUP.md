# Ollama Question Generator Setup Guide

## 1. Install Ollama

### macOS
```bash
# Download from https://ollama.ai
# Or use Homebrew
brew install ollama
```

### Linux
```bash
curl https://ollama.ai/install.sh | sh
```

### Windows
Download from https://ollama.ai

---

## 2. Start Ollama Server

```bash
ollama serve
```

This starts the Ollama API on `http://localhost:11434`

---

## 3. Pull a Model

Choose one of these (in order of recommendation):

### Option 1: Mistral 7B (RECOMMENDED)
**Best for bulk generation** - Fast, high quality, good for questions
```bash
ollama pull mistral
```
Model size: ~4.1GB
Speed: Fast
Quality: Excellent for Q&A

### Option 2: Llama 2 13B
**Better quality but slower** - Higher quality answers, more resources
```bash
ollama pull llama2
```
Model size: ~7.4GB
Speed: Medium
Quality: Very high

### Option 3: Neural Chat
**Specialized for conversations** - Optimized for Q&A tasks
```bash
ollama pull neural-chat
```
Model size: ~4.1GB
Speed: Fast
Quality: Very good for Q&A

### Option 4: Dolphin Mixtral
**Excellent instruction following** - Best at following specific formats
```bash
ollama pull dolphin-mixtral
```
Model size: ~26GB
Speed: Slower
Quality: Excellent

---

## 4. Usage

### Basic Usage
```python
from generate_questions_ollama import OllamaQuestionGenerator

# Initialize with your chosen model
generator = OllamaQuestionGenerator(model_name="mistral")

# Generate a single question
question = generator.generate_question(
    certification="AWS Solutions Architect Associate",
    topic="EC2 and Auto Scaling",
    num_options=4
)

# Generate bulk questions
questions = generator.generate_bulk_questions(
    certification="AWS Solutions Architect Associate",
    topics=["EC2", "S3", "RDS", "VPC"],
    questions_per_topic=5,
    num_options=4
)

# Save to CSV
generator.save_to_csv(questions, "my_questions.csv")
```

### Advanced: Custom Prompt
Edit the `generate_question()` method to customize the question style, difficulty, or format.

---

## 5. Performance Tips

### Generate More Questions Faster
```python
# Increase topics and questions per topic
questions = generator.generate_bulk_questions(
    certification="AWS Solutions Architect Associate",
    topics=[...50 topics...],
    questions_per_topic=10,  # 500 total questions
    num_options=4
)
```

### Parallel Generation (Advanced)
For large-scale generation, modify to use `concurrent.futures`:
```python
from concurrent.futures import ThreadPoolExecutor

def generate_parallel(topics, num_threads=4):
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(generate_question, topic) for topic in topics]
        return [f.result() for f in futures]
```

### Resource Management
- **Mistral**: Works well on machines with 8GB+ RAM
- **Llama 2**: Needs 16GB+ RAM for best performance
- **Neural Chat**: Works well on 8GB+ RAM

---

## 6. Troubleshooting

### "Cannot connect to Ollama"
```bash
# Make sure Ollama is running
ollama serve

# In another terminal, verify it works
curl http://localhost:11434/api/tags
```

### Model pulls with errors
```bash
# Check available models
ollama list

# Remove a model if stuck
ollama rm mistral

# Pull again
ollama pull mistral
```

### Slow generation
- Use smaller model (Mistral instead of Llama 2)
- Reduce `temperature` in the request (more consistent, less creative)
- Increase system RAM or close other applications

### Poor quality questions
- Try a larger model (Llama 2 13B or Dolphin Mixtral)
- Adjust the prompt in `generate_question()` method
- Increase `temperature` for more varied responses

---

## 7. Generating at Scale

For 1000+ questions:

```python
generator = OllamaQuestionGenerator(model_name="mistral")

topics = [
    "EC2", "S3", "RDS", "VPC", "IAM", "CloudFront",
    "ElastiCache", "Lambda", "API Gateway", "DynamoDB",
    # ... more topics
]

# Generate 1000 questions
questions = generator.generate_bulk_questions(
    certification="AWS Solutions Architect Associate",
    topics=topics * 20,  # Repeat topics for volume
    questions_per_topic=1,
    num_options=4
)

generator.save_to_csv(questions, "1000_questions.csv")
```

**Estimated time:** 1000 questions ≈ 30-60 minutes (depending on model and hardware)

---

## 8. Model Comparison

| Model | Size | Speed | Quality | RAM | Best For |
|-------|------|-------|---------|-----|----------|
| Mistral | 4.1GB | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ | 8GB | **Bulk Q&A generation** |
| Llama 2 | 7.4GB | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ | 16GB | High quality, fewer questions |
| Neural Chat | 4.1GB | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ | 8GB | Q&A specialized |
| Dolphin Mixtral | 26GB | ⚡ Slow | ⭐⭐⭐⭐⭐ | 32GB | Premium quality |

**My Recommendation for your use case:** **Mistral** - Perfect balance of speed and quality for generating AWS cert questions at scale.

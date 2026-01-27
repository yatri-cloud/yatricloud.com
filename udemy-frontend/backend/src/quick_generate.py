#!/usr/bin/env python3
"""
Certification Question Generator (Ollama)
Supports AWS, Azure, Google Cloud, and more
"""

from generate_questions_ollama import OllamaQuestionGenerator
from providers import get_provider, PROVIDERS
import sys
import os
from pathlib import Path

def main():
    print("=" * 70)
    print("Certification Question Generator (Ollama)")
    print("=" * 70)
    
    # Step 0: Select Provider
    print("\n[Step 0/5] Select Certification Provider")
    print("-" * 70)
    print("Available providers:")
    for i, provider_name in enumerate(PROVIDERS.keys(), 1):
        print(f"  {i}. {provider_name}")
    
    provider_choice = input(f"\nSelect provider (1-{len(PROVIDERS)} or name) [1 for AWS]: ").strip().lower() or "1"
    
    provider_map = {str(i): name for i, name in enumerate(PROVIDERS.keys(), 1)}
    provider_name = provider_map.get(provider_choice, provider_choice)
    
    # Get provider instance
    try:
        provider = get_provider(provider_name)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)
    
    print(f"✓ Using {provider.name} provider")
    
    # Step 1: Certification Name
    print("\n[Step 1/5] Certification Information")
    print("-" * 70)
    print(f"Available {provider.name} certifications:")
    for i, cert in enumerate(provider.get_available_certifications()[:5], 1):
        print(f"  {i}. {cert}")
    if len(provider.get_available_certifications()) > 5:
        print(f"  ... and {len(provider.get_available_certifications()) - 5} more")
    
    cert_name = input(f"\n{provider.name} certification name: ").strip()
    if not cert_name:
        cert_name = provider.get_available_certifications()[0]
    
    if not provider.validate_certification_name(cert_name):
        print(f"⚠ Warning: '{cert_name}' may not be a valid {provider.name} certification")
    
    # Step 2: Question Numbers
    print("\n[Step 2/5] Question Configuration")
    print("-" * 70)
    questions_per_csv = int(input("Total questions to generate [10]: ") or "10")
    num_options = 4  # Always 4 options
    
    # Step 3: Time Duration
    print("\n[Step 3/5] Exam Duration")
    print("-" * 70)
    exam_minutes = input("Exam duration in minutes [180]: ").strip() or "180"
    try:
        exam_minutes = int(exam_minutes)
    except ValueError:
        print("⚠ Invalid number, using 180 minutes")
        exam_minutes = 180
    exam_duration = f"{exam_minutes} minutes"
    
    # Step 4: Exam Guide Upload
    print("\n[Step 4/5] Exam Guide Upload")
    print("-" * 70)
    pdf_path = input("Path to exam guide PDF (optional, press Enter to skip): ").strip()
    pdf_content = None
    extracted_domains = []
    domain_details = {}
    topics = None
    
    if pdf_path and os.path.exists(pdf_path):
        print(f"✓ Found PDF: {pdf_path}")
        try:
            with open(pdf_path, 'rb') as f:
                pdf_content = f.read()
            print(f"✓ Loaded {len(pdf_content)} bytes from PDF")
            
            print("\n  Extracting domains from PDF...")
            extraction_result = provider.extract_domains_from_pdf(pdf_path)
            extracted_domains = extraction_result.get("domains", [])
            domain_details = extraction_result.get("details", {})
            
            print(f"\n  Found {len(extracted_domains)} domains in {provider.name} exam guide:")
            for domain in extracted_domains[:8]:
                print(f"    - {domain}")
            
            if extracted_domains:
                use_pdf_domains = input("\nUse extracted domains from PDF? (y/n) [y]: ").strip().lower() or "y"
                if use_pdf_domains == "y":
                    topics = extracted_domains
                    print(f"✓ Using {len(topics)} domains from PDF")
            
        except Exception as e:
            print(f"⚠ Could not read PDF: {e}")
            domain_details = {}
    elif pdf_path:
        print(f"⚠ PDF file not found: {pdf_path}")
    else:
        print("⊘ No PDF provided (optional)")
    
    # Use defaults if no PDF domains
    if not topics:
        print("\n[Topics Configuration]")
        print("-" * 70)
        topics_input = input("Enter topics (comma-separated) or press Enter for defaults: ").strip()
        if topics_input:
            topics = [t.strip() for t in topics_input.split(',')]
        else:
            topics = [
                "Core Architecture",
                "Security & Compliance",
                "Cost Optimization",
                "Performance & Scalability"
            ]
    
    # Calculate questions per topic
    questions_per_topic = max(1, questions_per_csv // len(topics))
    actual_total = len(topics) * questions_per_topic
    
    # Step 5: Model Selection
    print("\n[Step 5/5] Model Selection")
    print("-" * 70)
    print("Available models:")
    print("  1. mistral (Fast, recommended) [default]")
    print("  2. llama2 (Higher quality)")
    print("  3. neural-chat (Q&A specialist)")
    print("  4. gpt-oss (Powerful reasoning)")
    
    model_choice = input("Select model (1-4 or name) [1]: ").strip().lower() or "1"
    
    model_map = {
        "1": "mistral", "mistral": "mistral",
        "2": "llama2", "llama2": "llama2",
        "3": "neural-chat", "neural-chat": "neural-chat",
        "4": "gpt-oss", "gpt-oss": "gpt-oss"
    }
    model = model_map.get(model_choice, "mistral")
    
    # Summary
    print("\n" + "=" * 70)
    print("CONFIGURATION SUMMARY")
    print("=" * 70)
    print(f"  Provider: {provider.name}")
    print(f"  Certification: {cert_name}")
    print(f"  Exam Duration: {exam_duration}")
    print(f"  Total Questions: {actual_total} (requested: {questions_per_csv})")
    print(f"  Topics/Domains: {len(topics)}")
    print(f"  Questions per Topic: {questions_per_topic}")
    print(f"  Options per Question: {num_options}")
    print(f"  Model: {model}")
    if pdf_content:
        print(f"  Exam Guide: {pdf_path} ({len(pdf_content)} bytes)")
    else:
        print(f"  Exam Guide: None")
    print("=" * 70)
    
    confirm = input("\nProceed with generation? (y/n) [y]: ").strip().lower() or "y"
    if confirm != "y":
        print("Cancelled.")
        sys.exit(0)
    
    # Initialize generator
    print(f"\n✓ Initializing {model} generator...")
    generator = OllamaQuestionGenerator(model_name=model)
    
    # Generate questions
    print(f"\n[Generating {actual_total} Questions]")
    print("=" * 70)
    print(f"Starting generation with {model}...")
    print("(Make sure Ollama is running)\n")
    
    questions = generator.generate_bulk_questions(
        certification=cert_name,
        provider_name=provider.name,
        topics=topics,
        questions_per_topic=questions_per_topic,
        num_options=4,
        domain_details=domain_details,
        provider=provider
    )
    
    # Save results
    if questions:
        provider_short = provider.name.replace(" ", "").lower()[:3]
        cert_short = cert_name.replace(" ", "_").lower()[:15]
        output_file = f"{provider_short}_{cert_short}_{len(questions)}_questions.csv"
        
        generator.save_to_csv(questions, output_file)
        
        print("\n" + "=" * 70)
        print("GENERATION COMPLETE")
        print("=" * 70)
        print(f"✓ Provider: {provider.name}")
        print(f"✓ Generated {len(questions)} questions")
        print(f"✓ Output file: {output_file}")
        print(f"✓ Exam Duration: {exam_duration}")
        if pdf_content:
            print(f"✓ Exam Guide used: {os.path.basename(pdf_path)}")
        print("=" * 70)
        
    else:
        print("\n✗ Failed to generate questions. Check Ollama connection.")
        sys.exit(1)

if __name__ == "__main__":
    main()


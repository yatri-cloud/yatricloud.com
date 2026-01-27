#!/usr/bin/env python3
"""
Flask Server for Certification Question Generator
Connects frontend to backend question generation
"""

import sys
import os
from pathlib import Path
import json
from werkzeug.utils import secure_filename
import tempfile

# Add src/ and providers/ to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'providers'))

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from generate_questions_ollama import OllamaQuestionGenerator
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

# Import providers
try:
    from aws.provider import AWSProvider
    aws_provider = AWSProvider()
except Exception as e:
    print(f"⚠️  AWSProvider not available: {e}")
    aws_provider = None

# ============================================================================
# Flask App Setup
# ============================================================================

app = Flask(__name__)
CORS(app)

# Configuration for file uploads
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# In-memory storage
courses_db = {}
uploaded_guides_db = {}  # Store extracted domains from uploaded PDFs

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============================================================================
# Health Check
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Backend is running",
        "ollama_available": OLLAMA_AVAILABLE,
        "available_providers": ["aws", "azure", "gcp"]
    })

# ============================================================================
# Provider Endpoints
# ============================================================================

@app.route('/api/providers', methods=['GET'])
def get_providers():
    """Get list of available providers"""
    return jsonify({
        "providers": ["aws", "azure", "gcp"],
        "count": 3
    })

@app.route('/api/providers/<provider>/certifications', methods=['GET'])
def get_certifications(provider):
    """Get certifications for a provider"""
    certifications = {
        "aws": [
            "Cloud Practitioner",
            "Solutions Architect Associate",
            "Solutions Architect Professional",
            "Developer Associate",
            "SysOps Administrator Associate",
            "Database Specialty",
            "Machine Learning Specialty"
        ],
        "azure": [
            "Azure Fundamentals",
            "Azure Administrator",
            "Azure Developer",
            "Azure Solutions Architect Expert",
            "Azure Security Engineer",
            "Azure Data Engineer"
        ],
        "gcp": [
            "Cloud Digital Leader",
            "Associate Cloud Engineer",
            "Professional Data Engineer",
            "Professional Cloud Architect",
            "Professional Cloud Security Engineer"
        ]
    }
    
    if provider not in certifications:
        return jsonify({"error": f"Unknown provider: {provider}"}), 404
    
    return jsonify({
        "provider": provider,
        "certifications": certifications[provider],
        "count": len(certifications[provider])
    })

@app.route('/api/providers/<provider>/certifications/<cert>/domains', methods=['GET'])
def get_domains(provider, cert):
    """Get exam domains for a certification"""
    if provider != "aws":
        return jsonify({"error": "Domains only available for AWS"}), 400
    
    if not aws_provider:
        return jsonify({"error": "AWS provider not available"}), 500
    
    # Pre-defined AWS domains based on certification type
    domains_map = {
        "Cloud Practitioner": [
            "Cloud Concepts",
            "Security and Compliance",
            "Cloud Technology and Services",
            "Billing, Pricing, and Support"
        ],
        "Solutions Architect Associate": [
            "Design Resilient Architectures",
            "Design High-Performing Architectures",
            "Design Secure Applications and Architectures",
            "Design Cost-Optimized Architectures"
        ],
        "Solutions Architect Professional": [
            "Design for Organizational Complexity",
            "Design for New Solutions",
            "Continuous Improvement for Existing Solutions",
            "Accelerate Workload Migration and Modernization"
        ],
        "Developer Associate": [
            "Develop with AWS Services",
            "Security",
            "Database",
            "Deployment and Updates",
            "Refactoring",
            "Monitoring and Troubleshooting"
        ],
        "SysOps Administrator Associate": [
            "System Monitoring and Maintenance",
            "Logging and Auditing",
            "Infrastructure Management",
            "Deployment, Provisioning, and Automation"
        ]
    }
    
    domains = domains_map.get(cert, [])
    
    return jsonify({
        "provider": provider,
        "certification": cert,
        "domains": domains,
        "count": len(domains)
    })

@app.route('/api/providers/models', methods=['GET'])
def get_models():
    """Get available Ollama models"""
    return jsonify({
        "models": ["mistral", "llama2", "neural-chat", "gpt-oss"],
        "default": "mistral"
    })

# ============================================================================
# PDF Exam Guide Upload Endpoints
# ============================================================================

@app.route('/api/exam-guides/upload', methods=['POST'])
def upload_exam_guide():
    """Upload exam guide PDF and extract domains"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        provider = request.form.get('provider', 'aws')
        certification = request.form.get('certification', '')
        
        if not certification:
            return jsonify({"error": "Certification name required"}), 400
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF files allowed"}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)
        
        print(f"📄 Uploaded PDF: {filename}")
        print(f"   Provider: {provider}, Certification: {certification}")
        
        # Default domains for different AWS certifications
        default_domains = {
            "Cloud Practitioner": [
                "Cloud Concepts",
                "Security and Compliance",
                "Cloud Technology and Services",
                "Billing, Pricing, and Support"
            ],
            "Solutions Architect": [
                "Design Resilient Architectures",
                "Design High-Performing Architectures",
                "Design Secure Applications and Architectures",
                "Design Cost-Optimized Architectures"
            ],
            "Solutions Architect Associate": [
                "Design Resilient Architectures",
                "Design High-Performing Architectures",
                "Design Secure Applications and Architectures",
                "Design Cost-Optimized Architectures"
            ],
            "Solutions Architect Professional": [
                "Design for Organizational Complexity",
                "Design for New Solutions",
                "Continuous Improvement for Existing Solutions",
                "Accelerate Workload Migration and Modernization"
            ],
            "Developer Associate": [
                "Develop with AWS Services",
                "Security",
                "Database",
                "Deployment and Updates",
                "Refactoring",
                "Monitoring and Troubleshooting"
            ]
        }
        
        extracted_domains = []
        
        try:
            # Try to extract domains using AWS provider
            if provider == "aws" and aws_provider:
                result = aws_provider.extract_domains_from_pdf(temp_path)
                extracted_domains = result.get("domains", [])
                print(f"✅ Extracted {len(extracted_domains)} domains from PDF")
            else:
                print(f"⚠️  Provider '{provider}' not supported for extraction")
        except Exception as e:
            print(f"⚠️  Domain extraction failed: {e}")
            print(f"   Using default domains for '{certification}'")
        
        # Use extracted domains or fallback to defaults
        domains_to_use = extracted_domains
        if not domains_to_use:
            # Try to match certification to get defaults
            for cert_key in default_domains.keys():
                if cert_key.lower() in certification.lower():
                    domains_to_use = default_domains[cert_key]
                    print(f"   Using default domains for '{cert_key}'")
                    break
        
        if not domains_to_use:
            # Ultimate fallback
            domains_to_use = default_domains.get("Solutions Architect Associate", [])
            print(f"   Using Solutions Architect Associate domains as fallback")
        
        # Store uploaded guide
        guide_key = f"{provider}_{certification.replace(' ', '_')}"
        uploaded_guides_db[guide_key] = {
            "provider": provider,
            "certification": certification,
            "domains": domains_to_use,
            "filename": filename
        }
        
        return jsonify({
            "success": True,
            "message": f"Uploaded! Using {len(domains_to_use)} domains",
            "guide_key": guide_key,
            "domains": domains_to_use,
            "extracted": len(extracted_domains) > 0
        }), 201
    
    except Exception as e:
        print(f"❌ Error uploading exam guide: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up temp file
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.route('/api/exam-guides', methods=['GET'])
def get_exam_guides():
    """Get list of uploaded exam guides"""
    guides = []
    for key, value in uploaded_guides_db.items():
        guides.append({
            "key": key,
            "provider": value["provider"],
            "certification": value["certification"],
            "domains_count": len(value["domains"]),
            "domains": value["domains"]
        })
    
    return jsonify({
        "guides": guides,
        "count": len(guides)
    })

@app.route('/api/exam-guides/<guide_key>/domains', methods=['GET'])
def get_exam_guide_domains(guide_key):
    """Get domains from a specific exam guide"""
    if guide_key not in uploaded_guides_db:
        return jsonify({"error": "Exam guide not found"}), 404
    
    guide = uploaded_guides_db[guide_key]
    return jsonify({
        "certification": guide["certification"],
        "domains": guide["domains"],
        "details": guide["details"]
    })


# ============================================================================
# Course Endpoints
# ============================================================================

@app.route('/api/courses', methods=['POST'])
def create_course():
    """Generate a new certification course with questions"""
    try:
        data = request.json
        provider = data.get('provider', 'aws')
        certification = data.get('certification', 'Cloud Practitioner')
        num_questions = data.get('num_questions', 5)
        exam_duration = data.get('exam_duration_minutes', 180)
        model = data.get('model', 'mistral')
        
        # Check if domains were uploaded from PDF
        guide_key = f"{provider}_{certification}"
        if guide_key in uploaded_guides_db:
            # Use uploaded domains from PDF
            available_domains = uploaded_guides_db[guide_key]["domains"]
            print(f"✅ Using {len(available_domains)} domains extracted from uploaded PDF")
        else:
            # Fall back to default domains
            domains_map = {
                "Cloud Practitioner": [
                    "Cloud Concepts",
                    "Security and Compliance",
                    "Cloud Technology and Services",
                    "Billing, Pricing, and Support"
                ],
                "Solutions Architect Associate": [
                    "Design Resilient Architectures",
                    "Design High-Performing Architectures",
                    "Design Secure Applications and Architectures",
                    "Design Cost-Optimized Architectures"
                ],
                "Solutions Architect Professional": [
                    "Design for Organizational Complexity",
                    "Design for New Solutions",
                    "Continuous Improvement for Existing Solutions",
                    "Accelerate Workload Migration and Modernization"
                ],
                "Developer Associate": [
                    "Develop with AWS Services",
                    "Security",
                    "Database",
                    "Deployment and Updates",
                    "Refactoring",
                    "Monitoring and Troubleshooting"
                ],
                "SysOps Administrator Associate": [
                    "System Monitoring and Maintenance",
                    "Logging and Auditing",
                    "Infrastructure Management",
                    "Deployment, Provisioning, and Automation"
                ]
            }
            
            available_domains = domains_map.get(certification, ["General AWS Knowledge"])
            print(f"ℹ️  Using {len(available_domains)} default domains for {certification}")
        
        questions_data = []
        
        # Try to generate real questions using Ollama
        if OLLAMA_AVAILABLE:
            try:
                print(f"🔄 Generating {num_questions} questions for {certification}...")
                generator = OllamaQuestionGenerator(model_name=model)
                
                # Generate questions using exam domains
                for i in range(num_questions):
                    # Rotate through domains
                    domain = available_domains[i % len(available_domains)]
                    print(f"  Generating question {i+1}/{num_questions} from domain: {domain}...")
                    try:
                        question = generator.generate_question(
                            certification=certification,
                            topic=domain,
                            num_options=4
                        )
                        
                        # Convert to expected format
                        # Extract option text and explanations - handle both string and object formats
                        raw_options = question.get("options", [])
                        options_list = []
                        explanations_list = []
                        
                        for opt in raw_options:
                            if isinstance(opt, dict):
                                options_list.append(opt.get("text", str(opt)))
                                explanations_list.append(opt.get("explanation", ""))
                            else:
                                options_list.append(str(opt))
                                explanations_list.append("")
                        
                        # Ensure exactly 4 options
                        while len(options_list) < 4:
                            options_list.append(f"Option {len(options_list) + 1}")
                            explanations_list.append("")
                        options_list = options_list[:4]
                        explanations_list = explanations_list[:4]
                        
                        # Get correct answer index(es)
                        correct_idx = question.get("correct_answer_index", 0)
                        
                        questions_data.append({
                            "id": i + 1,
                            "question": question.get("question", f"Question {i+1}"),
                            "question_type": "multiple-choice",
                            "options": options_list,
                            "option_explanations": explanations_list,
                            "correct_option": correct_idx,
                            "correct_answers": [correct_idx],
                            "explanation": question.get("overall_explanation", f"Explanation for question {i+1}"),
                            "overall_explanation": question.get("overall_explanation", f"Explanation for question {i+1}"),
                            "domain": domain
                        })
                    except Exception as e:
                        print(f"  ⚠️  Error generating question {i+1}: {e}")
                        domain = available_domains[i % len(available_domains)]
                        # Fallback to sample question
                        questions_data.append({
                            "id": i + 1,
                            "question": f"Sample Question {i+1}: What is the correct answer?",
                            "question_type": "multiple-choice",
                            "options": [f"Option {chr(65+j)}" for j in range(4)],
                            "option_explanations": [f"This is explanation for option {chr(65+j)}" for j in range(4)],
                            "correct_option": 0,
                            "correct_answers": [0],
                            "explanation": f"This is the explanation for question {i+1}",
                            "overall_explanation": f"This is the explanation for question {i+1}",
                            "domain": domain
                        })
                
                print(f"✅ Generated {len(questions_data)} questions")
            except Exception as e:
                print(f"❌ Ollama generation failed: {e}")
                print("⚠️  Falling back to sample questions...")
                # Fallback to sample questions
                for i in range(num_questions):
                    domain = available_domains[i % len(available_domains)]
                    questions_data.append({
                        "id": i + 1,
                        "question": f"Sample Question {i+1}: What is the correct answer?",
                        "question_type": "multiple-choice",
                        "options": [f"Option {chr(65+j)}" for j in range(4)],
                        "option_explanations": [f"Explanation for option {chr(65+j)}" for j in range(4)],
                        "correct_option": 0,
                        "correct_answers": [0],
                        "explanation": f"This is the explanation for question {i+1}",
                        "overall_explanation": f"This is the explanation for question {i+1}",
                        "domain": domain
                    })
        else:
            print("⚠️  Ollama not available, using sample questions...")
            # Fallback to sample questions
            for i in range(num_questions):
                domain = available_domains[i % len(available_domains)]
                questions_data.append({
                    "id": i + 1,
                    "question": f"Sample Question {i+1}: What is the correct answer?",
                    "question_type": "multiple-choice",
                    "options": [f"Option {chr(65+j)}" for j in range(4)],
                    "option_explanations": [f"Explanation for option {chr(65+j)}" for j in range(4)],
                    "correct_option": 0,
                    "correct_answers": [0],
                    "explanation": f"This is the explanation for question {i+1}",
                    "overall_explanation": f"This is the explanation for question {i+1}",
                    "domain": domain
                })
        
        # Create course object
        course_id = f"{provider}-{certification.replace(' ', '-')}-{len(courses_db)}"
        course = {
            "id": course_id,
            "title": f"{certification} - {num_questions} Questions",
            "provider": provider,
            "certification": certification,
            "num_questions": num_questions,
            "exam_duration": f"{exam_duration} minutes",
            "model_used": model,
            "questions": questions_data
        }
        
        # Store in memory
        courses_db[course_id] = course
        
        return jsonify(course), 201
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Get all generated courses"""
    return jsonify({
        "courses": list(courses_db.values()),
        "count": len(courses_db)
    })

@app.route('/api/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get a specific course"""
    if course_id not in courses_db:
        return jsonify({"error": "Course not found"}), 404
    return jsonify(courses_db[course_id])

@app.route('/api/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete a course"""
    if course_id not in courses_db:
        return jsonify({"error": "Course not found"}), 404
    del courses_db[course_id]
    return jsonify({"message": "Course deleted", "id": course_id})

# ============================================================================
# Auth Endpoints (Placeholder)
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Placeholder login endpoint"""
    data = request.json
    return jsonify({
        "token": "dummy-token-123",
        "user": {
            "id": "1",
            "email": data.get('email', 'user@example.com'),
            "name": "Test User"
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Placeholder registration endpoint"""
    data = request.json
    return jsonify({
        "token": "dummy-token-123",
        "user": {
            "id": "1",
            "email": data.get('email'),
            "name": data.get('name')
        }
    })

@app.route('/api/auth/verify', methods=['GET'])
def verify_token():
    """Verify authentication token"""
    return jsonify({"valid": True})

# ============================================================================
# User Endpoints (Placeholder)
# ============================================================================

@app.route('/api/users/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    return jsonify({
        "id": "1",
        "name": "Test User",
        "email": "user@example.com",
        "enrolled_courses": []
    })

@app.route('/api/users/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    data = request.json
    return jsonify({
        "message": "Profile updated",
        "user": data
    })

# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Server error"}), 500

# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    import sys
    port = int(os.getenv('PORT', 8000))
    
    print("=" * 70)
    print("Starting Certification Question Generator API Server")
    print("=" * 70)
    print(f"Ollama Available: {OLLAMA_AVAILABLE}")
    print(f"API will be available at: http://localhost:{port}")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 70)
    
    app.run(host="0.0.0.0", port=port, debug=True)


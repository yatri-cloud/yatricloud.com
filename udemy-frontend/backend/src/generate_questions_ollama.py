import pandas as pd
import requests
import json
import time
from typing import List, Dict

class OllamaQuestionGenerator:
    """Generate AWS certification questions using Ollama local models"""
    
    def __init__(self, model_name: str = "mistral", ollama_url: str = "http://localhost:11434"):
        """
        Initialize the question generator
        
        Args:
            model_name: Ollama model to use (e.g., 'mistral', 'llama2', 'neural-chat')
            ollama_url: URL of Ollama server
        """
        self.model = model_name
        self.url = ollama_url
        self.api_endpoint = f"{ollama_url}/api/generate"
        
    def generate_question(self, certification: str, topic: str, num_options: int = 4, context: str = None) -> Dict:
        """
        Generate a single multiple-choice question using Ollama
        
        Args:
            certification: AWS certification name
            topic: Specific topic/domain
            num_options: Number of answer options (ALWAYS 4 for this task)
            context: Rich context from exam guide (tasks, knowledge items)
            
        Returns:
            Dictionary with question, options, and metadata
        """
        # Force 4 options regardless of input
        num_options = 4
        
        prompt = f"""Generate a professional AWS certification exam question for the "{certification}" exam.

Topic/Domain: {topic}
{f'Context: {context}' if context else ''}

Number of answer options: EXACTLY 4 (no more, no less)

CRITICAL REQUIREMENTS:
- Return VALID JSON ONLY (no markdown, no extra text)
- Start with {{ and end with }}
- Include EXACTLY 4 options
- Only one correct answer

{{
    "question": "A detailed, realistic scenario-based question testing AWS knowledge",
    "options": [
        {{"text": "Option 1 - Plausible but incorrect", "explanation": "Why this is incorrect or less optimal"}},
        {{"text": "Option 2 - Plausible but incorrect", "explanation": "Why this is incorrect or less optimal"}},
        {{"text": "Option 3 - CORRECT answer", "explanation": "Why this is correct and best practice"}},
        {{"text": "Option 4 - Plausible but incorrect", "explanation": "Why this is incorrect or less optimal"}}
    ],
    "correct_answer_index": 2,
    "overall_explanation": "Detailed explanation covering key AWS concepts and why the correct answer is best"
}}

Question characteristics:
- Scenario-based and realistic
- Tests advanced AWS architecture knowledge
- Options are plausible and make candidates think
- Clear, unambiguous correct answer
- Explanations are detailed and educational
- Do NOT use code examples unless absolutely necessary
- Focus on architectural decisions and tradeoffs"""

        try:
            response = requests.post(self.api_endpoint, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.5,
            }, timeout=120)
            
            response.raise_for_status()
            result = response.json()
            
            generated_text = result.get('response', '').strip()
            
            try:
                json_start = generated_text.find('{')
                json_end = generated_text.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_str = generated_text[json_start:json_end]
                    json_str = json_str.replace('\n', ' ')
                    
                    question_data = json.loads(json_str)
                    
                    # Validate structure and ensure exactly 4 options
                    if 'question' in question_data and 'options' in question_data:
                        # Enforce exactly 4 options
                        options = question_data.get('options', [])
                        if len(options) != 4:
                            # Trim or pad to 4 options
                            question_data['options'] = options[:4] if len(options) > 4 else options
                        
                        return question_data
                    else:
                        return None
            except json.JSONDecodeError:
                return None
                
        except requests.exceptions.ConnectionError:
            print(f"Error: Cannot connect to Ollama at {self.url}")
            return None
        except requests.exceptions.Timeout:
            print(f"Timeout: Ollama took too long")
            return None
        except Exception as e:
            return None
    
    def generate_bulk_questions(self, certification: str, provider_name: str, topics: List[str], 
                               questions_per_topic: int = 5, 
                               num_options: int = 4,
                               domain_details: Dict = None,
                               provider = None) -> List[Dict]:
        """
        Generate multiple questions across different topics
        
        Args:
            certification: Certification name
            provider_name: Cloud provider name (AWS, Azure, Google Cloud)
            topics: List of topics/domains
            questions_per_topic: Number of questions per topic
            num_options: Number of answer options (ignored, always 4)
            domain_details: Dictionary with domain context from exam guide
            provider: Provider instance for context generation
            
        Returns:
            List of generated questions
        """
        all_questions = []
        total = len(topics) * questions_per_topic
        
        for i, topic in enumerate(topics):
            # Get rich context for this domain
            context = None
            if provider and domain_details and topic in domain_details:
                context = provider.get_domain_context(topic)
            elif domain_details and topic in domain_details:
                domain_info = domain_details[topic]
                context_parts = []
                if domain_info.get("weighting"):
                    context_parts.append(f"This domain comprises {domain_info['weighting']}% of the exam")
                if domain_info.get("tasks"):
                    task_names = [t['name'] for t in domain_info.get('tasks', [])[:3]]
                    context_parts.append(f"Focus on: {', '.join(task_names)}")
                context = ". ".join(context_parts) if context_parts else None
            
            for j in range(questions_per_topic):
                current = (i * questions_per_topic) + j + 1
                print(f"Generating question {current}/{total}: {topic}...")
                
                # Add provider context to the prompt
                full_context = f"{provider_name} - {context}" if context else f"{provider_name} certification"
                
                question = self.generate_question(certification, topic, num_options=4, context=full_context)
                if question:
                    question['domain'] = topic
                    question['certification'] = certification
                    question['provider'] = provider_name
                    all_questions.append(question)
                else:
                    print(f"  Skipped (generation failed)")
                
                time.sleep(0.5)
        
        return all_questions
    
    def save_to_csv(self, questions: List[Dict], filename: str = "generated_questions.csv"):
        """
        Save generated questions to CSV in the template format
        
        Args:
            questions: List of question dictionaries
            filename: Output CSV filename
        """
        rows = []
        
        for q in questions:
            try:
                options = q.get('options', [])
                correct_idx = q.get('correct_answer_index', 0)
                
                # Build row with question data
                row = {
                    'Question': q.get('question', ''),
                    'Question Type': 'multiple-choice',
                    'Correct Answers': correct_idx + 1,  # Convert to 1-indexed
                    'Overall Explanation': q.get('overall_explanation', ''),
                    'Domain': q.get('domain', 'Unspecified')
                }
                
                # Add options and explanations (up to 6)
                for opt_idx, option in enumerate(options[:6]):
                    row[f'Answer Option {opt_idx + 1}'] = option.get('text', '')
                    row[f'Explanation {opt_idx + 1}'] = option.get('explanation', '')
                
                # Pad remaining options if less than 6
                for opt_idx in range(len(options), 6):
                    row[f'Answer Option {opt_idx + 1}'] = ''
                    row[f'Explanation {opt_idx + 1}'] = ''
                
                rows.append(row)
            except Exception as e:
                print(f"Error processing question: {e}")
                continue
        
        # Define column order
        columns = [
            'Question', 'Question Type',
            'Answer Option 1', 'Explanation 1',
            'Answer Option 2', 'Explanation 2',
            'Answer Option 3', 'Explanation 3',
            'Answer Option 4', 'Explanation 4',
            'Answer Option 5', 'Explanation 5',
            'Answer Option 6', 'Explanation 6',
            'Correct Answers', 'Overall Explanation', 'Domain'
        ]
        
        df = pd.DataFrame(rows, columns=columns)
        df.to_csv(filename, index=False)
        print(f"\nSaved {len(rows)} questions to {filename}")
        
        return df


def main():
    """Example usage"""
    
    # Initialize generator with Mistral (recommended for questions)
    generator = OllamaQuestionGenerator(model_name="mistral")
    
    # Define topics for AWS Solutions Architect Associate
    topics = [
        "Design High-Performing Architectures",
        "Design Resilient Architectures",
        "Design Secure Architectures",
        "Design Cost-Optimized Architectures",
        "EC2 and Auto Scaling"
    ]
    
    # Generate questions
    print("Starting question generation with Ollama (Mistral)...")
    print("Make sure Ollama is running: ollama serve\n")
    
    questions = generator.generate_bulk_questions(
        certification="AWS Solutions Architect Associate",
        topics=topics,
        questions_per_topic=2,  # Start small, increase for more
        num_options=4
    )
    
    # Save to CSV
    if questions:
        generator.save_to_csv(questions, "ollama_generated_questions.csv")
        print(f"\nGenerated {len(questions)} questions successfully!")
    else:
        print("No questions were generated. Check Ollama connection.")


if __name__ == "__main__":
    main()

import pandas as pd

# Define columns
columns = [
    'Question', 'Question Type', 'Answer Option 1', 'Explanation 1', 
    'Answer Option 2', 'Explanation 2', 'Answer Option 3', 'Explanation 3', 
    'Answer Option 4', 'Explanation 4', 'Answer Option 5', 'Explanation 5', 
    'Answer Option 6', 'Explanation 6', 'Correct Answers', 'Overall Explanation', 'Domain'
]

# Helper to normalize each row to exactly 17 columns
def normalize_row(row):
    # Keep only the first 2 elements (Question, Type)
    base = row[:2]
    
    # Extract answers and explanations
    answers = row[2:-3]  # everything except Question, Type, Correct, Overall Explanation, Domain
    correct_answers = row[-3]
    overall_explanation = row[-2]
    domain = row[-1]
    
    # Pad answers/explanations to 6 pairs
    while len(answers) < 12:
        answers.append(None)
    
    # Trim answers if somehow longer than 12
    answers = answers[:12]
    
    # Combine everything
    return base + answers + [correct_answers, overall_explanation, domain]

# The 65 Questions Data - enter the 65 data questions


# Normalize all rows
data_normalized = [normalize_row(row) for row in data]

# Create DataFrame
df = pd.DataFrame(data_normalized, columns=columns)

# Save CSV
df.to_csv('fixed_devops_pt4.csv', index=False)
print("CSV successfully created: fixed_devops_pt4.csv")
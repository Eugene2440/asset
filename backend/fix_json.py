import json

file_path = "backend/firebase-service-account.json"

# Read the file content
with open(file_path, 'r') as f:
    data = json.load(f)

# Replace literal \n with actual newlines in the private_key
data['private_key'] = data['private_key'].replace('\\n', '\n')

# Write back to the file
with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)
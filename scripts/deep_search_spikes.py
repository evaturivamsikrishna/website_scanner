import json
import os
import sys

def deep_search(obj, target_values, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            deep_search(v, target_values, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            deep_search(v, target_values, f"{path}[{i}]")
    else:
        if obj in target_values:
            print(f"Found {obj} at {path}")

def search_file(filepath, target_values):
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        print(f"Searching {filepath}...")
        deep_search(data, target_values)
    except json.JSONDecodeError as e:
        print(f"Error reading {filepath}: {e}")

if __name__ == "__main__":
    # Allow command-line arguments for search values
    search_values = sys.argv[1:] if len(sys.argv) > 1 else [5541, 6337, "5541", "6337"]
    
    search_file('data/results.json', search_values)
    search_file('dashboard/data/results.json', search_values)

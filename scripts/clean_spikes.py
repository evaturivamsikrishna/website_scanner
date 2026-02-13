import json
import os

SPIKE_THRESHOLD = 1000  # Configure spike threshold here

def clean_file(filepath, threshold=SPIKE_THRESHOLD):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r') as f:
        data = json.load(f)

    if 'trends' not in data:
        print(f"No trends in {filepath}")
        return

    original_count = len(data['trends'])
    # Remove entries with more broken links than threshold
    data['trends'] = [t for t in data['trends'] if t.get('brokenLinks', 0) < threshold]
    new_count = len(data['trends'])

    if original_count != new_count:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Cleaned {filepath}: Removed {original_count - new_count} spikes (>= {threshold}).")
    else:
        print(f"No spikes found in {filepath}.")

if __name__ == "__main__":
    clean_file('data/results.json')
    clean_file('dashboard/data/results.json')

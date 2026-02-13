import json
import os

SPIKE_THRESHOLD = 1000  # Configure spike threshold here

def find_spikes(filepath, threshold=SPIKE_THRESHOLD):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r') as f:
        data = json.load(f)

    if 'trends' not in data:
        return

    print(f"Checking {filepath} (threshold: {threshold})...")
    spikes = []
    for i, t in enumerate(data['trends']):
        bl = t.get('brokenLinks', 0)
        if bl > threshold:
            spikes.append((i, bl, t.get('date')))
            print(f"Found spike at index {i}: {bl} broken links on {t.get('date')}")
    
    return spikes

if __name__ == "__main__":
    find_spikes('data/results.json')
    find_spikes('dashboard/data/results.json')

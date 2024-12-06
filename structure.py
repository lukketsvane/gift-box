import os
import shutil
from pathlib import Path

def get_base_font_name(filename):
    # Remove file extension
    name = os.path.splitext(filename)[0]
    # Split by hyphen and take the first part
    base_name = name.split('-')[0].strip()
    # Handle special cases
    special_cases = ["Ace", "Butler", "Cleon", "Dalmation", "ETC", "Mixy", "MollySans", "Nord", "Roxborough"]
    if any(case in base_name for case in special_cases):
        base_name = " ".join(name.split('-')[0:2]).strip()
    # Remove common weight and style indicators
    indicators = ['Bold', 'Italic', 'Light', 'Regular', 'Medium', 'Thin', 'Black', 'Heavy', 'Semi']
    for indicator in indicators:
        base_name = base_name.replace(indicator, '').strip()
    return base_name.strip()

def merge_font_families(source_dirs, target_dir):
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Merging font families to {target_path}")

    font_families = {}

    for source_dir in source_dirs:
        source_path = Path(source_dir)
        print(f"Processing directory: {source_path}")
        
        for root, _, files in os.walk(source_path):
            for file in files:
                if file.endswith(('.woff', '.woff2')):
                    full_path = Path(root) / file
                    base_name = get_base_font_name(file)
                    
                    if base_name not in font_families:
                        font_families[base_name] = []
                    
                    font_families[base_name].append(full_path)

    for family, files in font_families.items():
        family_dir = target_path / family
        family_dir.mkdir(exist_ok=True)
        
        for file in files:
            new_path = family_dir / file.name
            if not new_path.exists():
                shutil.copy2(str(file), str(new_path))
                print(f"Copied {file.name} to {family_dir}")
            else:
                print(f"Skipped {file.name} (already exists in {family_dir})")

    print("Font family merging completed successfully!")

if __name__ == "__main__":
    woff_dir = '/workspaces/gift-box/font_pipeline/processed_fonts/woff/'
    woff2_dir = '/workspaces/gift-box/font_pipeline/processed_fonts/woff2/'
    target_directory = '/workspaces/gift-box/gift-box/public/fonts/'

    source_directories = [woff_dir, woff2_dir]

    try:
        merge_font_families(source_directories, target_directory)
    except Exception as e:
        print(f"Error merging font families: {e}")


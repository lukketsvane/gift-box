import os
import json

def generate_font_metadata(root_dir):
    font_metadata = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.woff'):
                relative_path = os.path.relpath(root, root_dir)
                font_name = os.path.splitext(file)[0]
                font_metadata.append({
                    "name": font_name,
                    "file": os.path.join(relative_path, file).replace('\\', '/')
                })
    
    return font_metadata

def save_metadata_to_json(metadata, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

def main():
    fonts_dir = 'gift-box/public/fonts'
    output_file = 'gift-box/public/fonts/font_metadata.json'

    if not os.path.exists(fonts_dir):
        print(f"Error: The directory {fonts_dir} does not exist.")
        return

    font_metadata = generate_font_metadata(fonts_dir)
    
    if not font_metadata:
        print("No .woff font files found in the specified directory.")
        return

    save_metadata_to_json(font_metadata, output_file)
    print(f"Successfully generated {output_file} with {len(font_metadata)} font entries.")

if __name__ == "__main__":
    main()


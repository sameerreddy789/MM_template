import sys
from rembg import remove
from PIL import Image

def remove_background(input_path, output_path):
    print(f"Removing background from {input_path}...")
    try:
        input_img = Image.open(input_path)
        # Using rembg to smartly remove the background using AI
        output_img = remove(input_img)
        output_img.save(output_path, "PNG")
        print(f"Successfully saved transparent image to {output_path}")
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python use_rembg.py <input> <output>")
        sys.exit(1)
    remove_background(sys.argv[1], sys.argv[2])

from PIL import Image
import numpy as np
import os

def process_clouds(input_path, output_dir):
    # Load image and ensure RGB
    img = Image.open(input_path).convert("RGB")
    np_img = np.array(img)
    
    # Calculate luminance (brightness) for each pixel
    # Weights for perceived brightness: 0.299 R, 0.587 G, 0.114 B
    luminance = np.dot(np_img[...,:3], [0.299, 0.587, 0.114]).astype(np.uint8)
    
    # Create new RGBA image: pure white color, alpha = luminance
    # This perfectly removes black background and keeps soft cloud edges!
    h, w = np_img.shape[:2]
    new_img_data = np.zeros((h, w, 4), dtype=np.uint8)
    new_img_data[..., 0] = 255 # R
    new_img_data[..., 1] = 255 # G
    new_img_data[..., 2] = 255 # B
    
    # Boost the alpha slightly to make the clouds denser, but cap at 255
    alpha = np.clip(luminance * 1.2, 0, 255).astype(np.uint8)
    new_img_data[..., 3] = alpha # A
    
    transparent_img = Image.fromarray(new_img_data, "RGBA")
    
    # Split into 4 quadrants
    mid_x, mid_y = w // 2, h // 2
    
    quadrants = [
        transparent_img.crop((0, 0, mid_x, mid_y)),          # Top-Left
        transparent_img.crop((mid_x, 0, w, mid_y)),          # Top-Right
        transparent_img.crop((0, mid_y, mid_x, h)),          # Bottom-Left
        transparent_img.crop((mid_x, mid_y, w, h))           # Bottom-Right
    ]
    
    # Save the 4 clouds, auto-cropping empty space
    for i, quad in enumerate(quadrants):
        bbox = quad.getbbox()
        if bbox:
            cropped = quad.crop(bbox)
            output_path = os.path.join(output_dir, f"cloud_{i+1}.png")
            cropped.save(output_path, "PNG")
            print(f"Saved {output_path}")

if __name__ == "__main__":
    process_clouds("public/images/landing/cloud4.png", "public/images/landing/")

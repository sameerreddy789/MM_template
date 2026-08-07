from PIL import Image
import sys

def remove_black_background(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Process pixels
    pixels = img.load()
    
    # We want to remove dark pixels.
    # To act like "screen" mode but baked into alpha:
    # A = max(R, G, B)
    # New RGB = (R/A, G/A, B/A) if A > 0 else (0,0,0)
    # But since the background might not be pure black (e.g. a grid),
    # let's try a threshold. If a pixel is very dark, make it transparent.
    
    # Wait, the user mentioned a grid. If the grid is dark grey,
    # we can remove all pixels whose brightness is below a threshold.
    # But that might make hard edges.
    
    # Let's use the baked screen method, with a slight adjustment for the grid:
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Brightness based on luminance or max channel
            brightness = max(r, g, b)
            
            # If it's a very dark grid, let's say brightness < 20
            # we make it completely transparent
            if brightness < 30:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # To make it blend smoothly, we can map brightness to alpha
                # A = max(R, G, B)
                # But since the grid is < 30, we can subtract 30 and scale
                new_a = int(max(0, min(255, (brightness - 30) * (255 / (255 - 30)))))
                
                if new_a == 0:
                    pixels[x, y] = (0, 0, 0, 0)
                else:
                    # Unpremultiply RGB so that when it's drawn with transparency,
                    # the colors remain vibrant
                    scale = 255.0 / new_a if new_a > 0 else 0
                    # However, if we do this, some colors might exceed 255.
                    # Just setting alpha to brightness works very well for neon on black.
                    # Let's keep original RGB, just modify alpha.
                    pixels[x, y] = (r, g, b, new_a)

    print(f"Saving to {output_path}...")
    img.save(output_path, "PNG")
    print("Done!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_black.py <input> <output>")
        sys.exit(1)
    remove_black_background(sys.argv[1], sys.argv[2])

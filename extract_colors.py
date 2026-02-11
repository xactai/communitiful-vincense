from PIL import Image
import collections

def extract_dominant_colors(image_path, num_colors=5):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        img = img.resize((150, 150)) # Resize for speed
        colors = img.getcolors(150 * 150) # Get colors up to max pixel count

        # Sort by count (most frequent)
        sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
        
        dominant_hex = []
        for count, color in sorted_colors:
            if len(dominant_hex) >= num_colors:
                break
            
            # Filter out transparent or near-white/black
            r, g, b, a = color
            if a < 50: continue # Skip transparent
            if r > 240 and g > 240 and b > 240: continue # Skip white-ish
            if r < 15 and g < 15 and b < 15: continue # Skip black-ish

            hex_code = '#{:02x}{:02x}{:02x}'.format(r, g, b)
            dominant_hex.append(hex_code)
            
        return dominant_hex

    except Exception as e:
        print(f"Error: {e}")
        return []

img_path = "src/assets/VinCense Logo.png"
colors = extract_dominant_colors(img_path)
print("Dominant Colors:", colors)

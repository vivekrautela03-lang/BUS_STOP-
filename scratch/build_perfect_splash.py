import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Load source image (1376 x 768)
src = Image.open('assets/splash_bg.jpg').convert('RGBA')
orig_w, orig_h = src.size

# Symmetrical crop to center the bus stop (bus + shelter):
# Bus: x=440 to 800
# Shelter: x=790 to 1150
# Center = (440 + 1150) / 2 = 795
# Crop from x = 215 to 1375 (width = 1160, height = 768)
# Left margin before bus: 440 - 215 = 225px
# Right margin after shelter: 1375 - 1150 = 225px -> EXACT EQUAL MARGINS!
crop = src.crop((215, 0, 1375, 768))

# Resize to standard full HD 1920 x 1080
canvas = crop.resize((1920, 1080), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(canvas)

# ---------------------------------------------------------------------------
# 1. CLEAN UP THE ROAD ASPHALT (where old cropped text was)
# In 1920x1080 coordinates:
# The road is around y = 920 to 1060, x = 600 to 1200
# ---------------------------------------------------------------------------
# Sample clean asphalt from x = 1100 to 1300, y = 950 to 1050
clean_asphalt = canvas.crop((1120, 940, 1320, 1040))
clean_asphalt_blur = clean_asphalt.filter(ImageFilter.GaussianBlur(1.5))

# Create a smooth patch over the old road text area (x = 700 to 1100, y = 920 to 1060)
for px in range(700, 1100, 180):
    patch = clean_asphalt_blur.copy()
    # Add slight random noise/grain to look natural
    canvas.paste(patch, (px, 930))

# Smoothly blend the road patch edges with a Gaussian blur mask
road_mask = Image.new('L', (450, 120), 0)
mask_draw = ImageDraw.Draw(road_mask)
mask_draw.rounded_rectangle([10, 10, 440, 110], radius=30, fill=220)
road_mask = road_mask.filter(ImageFilter.GaussianBlur(15))

# ---------------------------------------------------------------------------
# 2. DRAW PERFECT CENTERED GOLDEN DOTS & ROAD TAGLINE
# Exact horizontal center: x = 960!
# ---------------------------------------------------------------------------
dot_y = 965
dot_radius = 6
dot_gap = 22
dot_color = (245, 166, 35, 255)
dot_border = (40, 32, 22, 255)

for i, offset in enumerate([-dot_gap, 0, dot_gap]):
    cx = 960 + offset
    draw.ellipse([cx - dot_radius - 1, dot_y - dot_radius - 1, cx + dot_radius + 1, dot_y + dot_radius + 1], fill=dot_border)
    draw.ellipse([cx - dot_radius, dot_y - dot_radius, cx + dot_radius, dot_y + dot_radius], fill=dot_color)

# Road tagline: "Every journey starts somewhere."
font_road = ImageFont.truetype(r"C:\Windows\Fonts\segoeprb.ttf", 20)
tagline = "Every journey starts somewhere."
bbox = draw.textbbox((0, 0), tagline, font=font_road)
text_w = bbox[2] - bbox[0]
draw.text((960 - text_w // 2, 990), tagline, fill=(35, 28, 20, 255), font=font_road)

# ---------------------------------------------------------------------------
# 3. FIX BUS DESTINATION LED SIGN (Front of bus)
# Bus front sign is around x = 750 to 900, y = 560 to 595
# ---------------------------------------------------------------------------
# Draw sleek dark amber LED background
draw.rounded_rectangle([755, 560, 895, 595], radius=4, fill=(28, 24, 20, 255))
font_bus_led = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 16)
bus_text = "BUS STOP"
bus_bbox = draw.textbbox((0, 0), bus_text, font=font_bus_led)
bus_tw = bus_bbox[2] - bus_bbox[0]
# Amber LED glow text
draw.text((825 - bus_tw // 2, 568), bus_text, fill=(255, 175, 45, 255), font=font_bus_led)

# ---------------------------------------------------------------------------
# 4. FIX SIGNPOST WOODEN PLANKS
# The signpost is on the right around x = 1680 to 1910, y = 170 to 520
# 5 planks with authentic Himalayan towns:
# 1: Dehradun ➔
# 2: Mussoorie ➔
# 3: Rishikesh ➔
# 4: Haridwar ➔
# 5: New Places ➔
# ---------------------------------------------------------------------------
font_sign = ImageFont.truetype(r"C:\Windows\Fonts\segoeprb.ttf", 15)

signs = [
    {"y": 182, "h": 46, "text": "Dehradun ➔", "shape": "arrow_right", "x1": 1705, "x2": 1895},
    {"y": 245, "h": 42, "text": "Mussoorie ➔", "shape": "round", "x1": 1720, "x2": 1885},
    {"y": 305, "h": 46, "text": "Rishikesh ➔", "shape": "arrow_right", "x1": 1710, "x2": 1905},
    {"y": 370, "h": 44, "text": "Haridwar ➔", "shape": "round", "x1": 1705, "x2": 1875},
    {"y": 435, "h": 46, "text": "New Places ➔", "shape": "arrow_right", "x1": 1690, "x2": 1900},
]

for s in signs:
    x1, y1, x2, y2 = s["x1"], s["y"], s["x2"], s["y"] + s["h"]
    # Wooden plank background: warm light cedar/pine wood color
    wood_fill = (226, 212, 188, 255)
    wood_border = (50, 40, 30, 255)
    
    if s["shape"] == "arrow_right":
        # Pointed wooden sign
        pts = [
            (x1, y1),
            (x2 - 20, y1),
            (x2, y1 + (y2 - y1) // 2),
            (x2 - 20, y2),
            (x1, y2)
        ]
        draw.polygon(pts, fill=wood_fill, outline=wood_border, width=2)
    else:
        # Rounded plank
        draw.rounded_rectangle([x1, y1, x2, y2], radius=6, fill=wood_fill, outline=wood_border, width=2)
    
    # Text on plank
    stext = s["text"]
    sbbox = draw.textbbox((0, 0), stext, font=font_sign)
    stw = sbbox[2] - sbbox[0]
    sth = sbbox[3] - sbbox[1]
    tx = x1 + 16
    ty = y1 + ((y2 - y1) - sth) // 2 - 2
    draw.text((tx, ty), stext, fill=(45, 35, 25, 255), font=font_sign)

# Convert to RGB and save directly to assets/splash_bg.jpg
final_rgb = canvas.convert('RGB')
final_rgb.save('assets/splash_bg.jpg', quality=96)
print("Successfully generated assets/splash_bg.jpg with bus stop centered at mid!")

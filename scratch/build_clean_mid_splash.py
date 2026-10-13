import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Load original 1376 x 768 file
src = Image.open('assets/screen3_hd.jpg').convert('RGBA')

# 1. Clean the road in original coordinates FIRST before cropping!
# In 1376x768 coordinates:
# Old text is at x = 580 to 800, y = 660 to 740.
# Clean asphalt sample is at x = 250 to 450, y = 630 to 730:
asphalt_patch = src.crop((230, 630, 480, 730))

# Blend seamlessly over (570, 650)
mask_orig = Image.new('L', (250, 100), 0)
m_draw = ImageDraw.Draw(mask_orig)
m_draw.ellipse([15, 10, 235, 90], fill=255)
mask_orig = mask_orig.filter(ImageFilter.GaussianBlur(12))

src.paste(asphalt_patch, (570, 650), mask_orig)

# 2. Symmetrical crop to center the bus stop (bus + shelter):
# Crop x = 215 to 1375 (width = 1160, height = 768)
crop = src.crop((215, 0, 1375, 768))

# Resize to 1920x1080 Full HD
canvas = crop.resize((1920, 1080), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(canvas)

# 3. DRAW CRISP, PERFECT GOLDEN DOTS & TAGLINE AT EXACT CENTER (x = 960)
dot_y = 965
dot_radius = 6.5
dot_gap = 24

for offset in [-dot_gap, 0, dot_gap]:
    cx = 960 + offset
    draw.ellipse([cx - dot_radius - 1.5, dot_y - dot_radius - 1.5, cx + dot_radius + 1.5, dot_y + dot_radius + 1.5], fill=(35, 26, 16, 255))
    draw.ellipse([cx - dot_radius, dot_y - dot_radius, cx + dot_radius, dot_y + dot_radius], fill=(245, 166, 35, 255))

font_road = ImageFont.truetype(r"C:\Windows\Fonts\segoeprb.ttf", 21)
road_text = "Every journey starts somewhere."
rb_box = draw.textbbox((0, 0), road_text, font=font_road)
rtw = rb_box[2] - rb_box[0]

# Subtle text shadow for natural depth on asphalt
draw.text((960 - rtw // 2 + 1, 989 + 1), road_text, fill=(255, 255, 255, 140), font=font_road)
draw.text((960 - rtw // 2, 989), road_text, fill=(38, 28, 18, 255), font=font_road)

# 4. FIX BUS DESTINATION SIGN (Front of bus)
draw.rounded_rectangle([755, 558, 896, 595], radius=4, fill=(24, 20, 16, 255), outline=(48, 40, 32, 255))
font_bus = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 15)
bt = "BUS STOP"
bb = draw.textbbox((0, 0), bt, font=font_bus)
btw = bb[2] - bb[0]
draw.text((825 - btw // 2, 568), bt, fill=(255, 180, 50, 255), font=font_bus)

# 5. FIX SIGNPOST PLANKS
font_plank = ImageFont.truetype(r"C:\Windows\Fonts\segoeprb.ttf", 16)
wood_bg = (222, 202, 176, 255)
wood_border = (66, 50, 32, 255)
wood_text = (43, 31, 19, 255)

planks = [
    {"shape": "arrow", "x1": 1675, "y1": 165, "x2": 1910, "y2": 242, "text": "Dehradun"},
    {"shape": "round", "x1": 1690, "y1": 245, "x2": 1888, "y2": 305, "text": "Mussoorie"},
    {"shape": "arrow", "x1": 1680, "y1": 310, "x2": 1918, "y2": 378, "text": "Rishikesh"},
    {"shape": "round", "x1": 1690, "y1": 380, "x2": 1885, "y2": 444, "text": "Haridwar"},
    {"shape": "arrow", "x1": 1672, "y1": 446, "x2": 1920, "y2": 520, "text": "New Places"},
]

def draw_arrow_symbol(dr, x, y, size, fill):
    dr.line([(x, y), (x + size, y)], fill=fill, width=3)
    dr.polygon([(x + size, y), (x + size - 6, y - 5), (x + size - 6, y + 5)], fill=fill)

for p in planks:
    x1, y1, x2, y2 = p["x1"], p["y1"], p["x2"], p["y2"]
    
    if p["shape"] == "arrow":
        arrow_head = 24
        pts = [
            (x1, y1),
            (x2 - arrow_head, y1),
            (x2, y1 + (y2 - y1) // 2),
            (x2 - arrow_head, y2),
            (x1, y2)
        ]
        draw.polygon(pts, fill=wood_bg, outline=wood_border, width=2)
    else:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=8, fill=wood_bg, outline=wood_border, width=2)
    
    label = p["text"]
    tb = draw.textbbox((0, 0), label, font=font_plank)
    tw = tb[2] - tb[0]
    th = tb[3] - tb[1]
    
    text_x = x1 + 18
    text_y = y1 + ((y2 - y1) - th) // 2 - 2
    draw.text((text_x, text_y), label, fill=wood_text, font=font_plank)
    
    arrow_x = text_x + tw + 10
    arrow_y = y1 + (y2 - y1) // 2
    draw_arrow_symbol(draw, arrow_x, arrow_y, 14, wood_text)

# Save result directly to assets/splash_bg.jpg
canvas.convert('RGB').save('assets/splash_bg.jpg', quality=96)
print("Updated assets/splash_bg.jpg successfully with seamless road!")

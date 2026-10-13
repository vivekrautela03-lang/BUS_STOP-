import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# 1. Load source images
splash = Image.open('assets/splash_bg.jpg').convert('RGBA')
login = Image.open('assets/login_bg.jpg').convert('RGBA')

W, H = 1920, 1080

# In splash_bg (1376 x 768):
# Let's upscale splash to 1920x1080 first
splash_hd = splash.resize((W, H), Image.Resampling.LANCZOS)

# In splash_hd:
# Bus is approx x = 614 to 1116
# Shelter is approx x = 1100 to 1604
# Combined bus + shelter center is around x = 1110!
# On a 1920 wide image, center should be x = 960!
# That means the bus stop is shifted to the right by 1110 - 960 = 150 pixels!
# If we shift the bus stop to the center (by panning or shifting left by 150px):
# The bus + shelter will be at [960 - 495, 960 + 495] = [465, 1455]!
# Exactly in the middle of 1920!

# Let's create a shifted canvas where the bus stop is at the exact center:
shift_x = 150 # shift left by 150px
canvas = Image.new('RGBA', (W, H))

# We can paste splash_hd shifted left by 150px
# The right edge will need filling of 150px of trees/sky:
# Let's see: splash_hd from x=150 to 1920 goes to canvas at x=0 to 1770.
canvas.paste(splash_hd.crop((shift_x, 0, W, H)), (0, 0))

# For the rightmost 150px (x=1770 to 1920), we can mirror or extend the lush green trees and fence from splash_hd:
right_edge = splash_hd.crop((W - 160, 0, W, H))
right_flipped = right_edge.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
canvas.paste(right_flipped, (W - 150, 0))

# Smooth the seam at x = 1770
seam_mask = Image.new('L', (40, H), 0)
draw_mask = ImageDraw.Draw(seam_mask)
for i in range(40):
    alpha = int(255 * (i / 40))
    draw_mask.line([(i, 0), (i, H)], fill=alpha)

# Now, in this centered canvas:
# Bus: x = 464 to 966
# Shelter: x = 950 to 1454
# Center of the entire bus stop: EXACTLY x = 960 (50% MID)!

# 2. Fix the AI text on the signpost on the right (approx x = 1270 to 1430, y = 140 to 450):
# Let's inspect the wooden planks on the signpost and paint clean signs:
# Signs: "Dehradun ->", "Mussoorie ->", "Rishikesh ->", "Haridwar ->"
draw = ImageDraw.Draw(canvas)

# Let's check coordinates and save a preview
canvas.convert('RGB').save('scratch/canvas_mid_preview.jpg', quality=95)
print("Saved scratch/canvas_mid_preview.jpg")

from PIL import Image, ImageFilter, ImageDraw, ImageFont
import numpy as np

# Load splash image
img = Image.open('assets/splash_bg.jpg').convert('RGB')
w, h = img.size

# Let's analyze where the bus stop shelter is:
# Shelter is from x = 790 to x = 1150
# Bus is from x = 440 to x = 800
# Logo is from x = 500 to x = 850
# If the user wants "show bus stop at mid":
# We want the bus stop shelter to be centered in the canvas!
# If shelter center is at x = 970:
# We can create a 1376x768 image where x = 970 is at the center (x = 688).
# That means shifting by 970 - 688 = 282 pixels to the left!

# Let's test a crop/shift:
# If we shift the image left by 200px:
# The bus is at (440 - 200) = 240 to (800 - 200) = 600
# The shelter is at (790 - 200) = 590 to (1150 - 200) = 950
# The center of the shelter is at (590 + 950)/2 = 770 (very close to center 688!)
# The center of the bus+shelter combined is: (240 + 950)/2 = 595!
# Together, the bus and shelter span x = 240 to 950, which sits beautifully balanced in the middle of a 1376px canvas!
print(f"Original: {w}x{h}")

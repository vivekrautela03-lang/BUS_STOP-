from PIL import Image

img = Image.open('assets/splash_bg.jpg')
w, h = img.size

# Original is 1376 x 768
# If center is x = 790 (bus + shelter midpoint):
# Let's crop a 16:9 window:
# Aspect ratio 16:9 -> if crop_w = 1100, crop_h = 1100 / (16/9) = 618.75
crop_w = 1080
crop_h = int(crop_w * (9 / 16)) # 607

# Center x = 800, Center y = 400
left = int(800 - crop_w / 2) # 260
right = left + crop_w        # 1340
top = int(390 - crop_h / 2)  # 86
bottom = top + crop_h       # 693

# Let's also create a full-height version:
# If height is full 768:
# To center at x = 790, we need width to extend equally left and right.
# From 790 to right edge (1376) is 586px.
# From 790 to left (790 - 586) is 204px.
# So cropping x from 204 to 1376 gives width 1172, height 768!
# Center of [204, 1376] is EXACTLY 790!
crop_full_h = img.crop((204, 0, 1376, 768))

# Resize to standard 16:9 1920x1080 using high quality Lanczos:
centered_1080p = crop_full_h.resize((1920, 1080), Image.Resampling.LANCZOS)
centered_1080p.save('scratch/bus_stop_mid_1080p.jpg', quality=95)

print("Saved scratch/bus_stop_mid_1080p.jpg")

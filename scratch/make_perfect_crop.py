from PIL import Image

# Load original 1376 x 768 splash image
img = Image.open('assets/splash_bg.jpg')
w, h = img.size

# In 1376x768 coordinates:
# 300 / 1920 * 1376 = 215.
# Let's crop from x = 215 to 1376:
# Left margin before bus (bus is at 440): 440 - 215 = 225px.
# Right margin after shelter (shelter ends at 1150): 1376 - 1150 = 226px.
# Left margin = 225px, Right margin = 226px!
# EXACT SYMMETRY!

crop_perfect = img.crop((215, 0, 1376, 768))

# Resize to standard 1920x1080
centered_img = crop_perfect.resize((1920, 1080), Image.Resampling.LANCZOS)
centered_img.save('scratch/bus_stop_perfect_mid.jpg', quality=95)
print("Saved scratch/bus_stop_perfect_mid.jpg")

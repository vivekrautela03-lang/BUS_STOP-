from PIL import Image

orig = Image.open('assets/media_1791209571106.jpg')
print("Original uploaded image size:", orig.size)

# Let's upscale and compare with splash_bg
# Orig width and height
w, h = orig.size
print(f"Aspect ratio: {w / h:.3f}")

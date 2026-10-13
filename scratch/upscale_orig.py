from PIL import Image

orig = Image.open('assets/media_1791209571106.jpg')
upscaled = orig.resize((1920, 1080), Image.Resampling.LANCZOS)
upscaled.save('scratch/orig_upscaled.jpg', quality=95)
print("Saved orig_upscaled.jpg")

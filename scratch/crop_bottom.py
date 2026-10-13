from PIL import Image

img = Image.open('assets/splash_bg.jpg')
w, h = img.size
bottom_crop = img.crop((0, 300, w, h))
bottom_crop.save('scratch/bottom_crop.jpg')
print("Saved bottom crop")

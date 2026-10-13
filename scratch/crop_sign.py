from PIL import Image

img = Image.open('scratch/bus_stop_perfect_mid.jpg')
# Crop around signpost:
# Width is 1920, signpost is on the right side around x = 1650 to 1920, y = 150 to 520
sign_crop = img.crop((1650, 160, 1920, 520))
sign_crop.save('scratch/sign_crop.jpg')
print("Saved scratch/sign_crop.jpg")

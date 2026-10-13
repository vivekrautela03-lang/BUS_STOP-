from PIL import Image

img = Image.open('scratch/bus_stop_perfect_mid.jpg')
# Crop bus front
# Bus is around x = 500 to 1100, y = 500 to 800
bus_front = img.crop((680, 540, 950, 620))
bus_front.save('scratch/bus_front.jpg')
print("Saved scratch/bus_front.jpg")

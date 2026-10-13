from PIL import Image

img = Image.open('scratch/bus_stop_perfect_mid.jpg')
# Crop road center
# Width 1920, center is 960, bottom is y = 900 to 1080
road_center = img.crop((800, 920, 1120, 1060))
road_center.save('scratch/road_center.jpg')
print("Saved scratch/road_center.jpg")

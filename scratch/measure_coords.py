from PIL import Image

img = Image.open('assets/splash_bg.jpg')
w, h = img.size

# Let's crop into 4 horizontal slices to see where elements lie:
# Left: 0 to 450 (valley, river, trees)
# Mid-Left: 400 to 800 (yellow bus)
# Mid-Right: 750 to 1150 (bus stop shelter + bench)
# Far-Right: 1100 to 1376 (signpost + trees)

# Notice:
# Yellow bus is approx x = 450 to 800
# Bus stop shelter is approx x = 800 to 1150
# The center of the bus + shelter combined is approx: (450 + 1150)/2 = 800!
# In the original image of width 1376, the center of the image is 1376 / 2 = 688!
# So the bus + shelter is shifted to the right by (800 - 688) = +112 pixels!
# And the shelter alone is at x = 800 to 1150, which is heavily to the right!
print(f"Original image width: {w}, height: {h}")
print(f"Image center x: {w/2}")

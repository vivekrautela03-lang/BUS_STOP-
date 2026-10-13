from PIL import Image

img = Image.open('assets/splash_bg.jpg')
w, h = img.size

# Let's save a test crop where bus stop is centered
# Bus + shelter center is around x = 780.
# If we want a 16:9 image of width 1152 x 648 or scaled to 1376 x 768:
# Let's see: if center is at 780, to keep 16:9 (ratio 1.777),
# if height is 768, width would be 768 * 16/9 = 1365.
# If we want the shelter itself to be at the mid:
# Where is the shelter alone? Shelter alone is from x=780 to x=1150 (center around 965)!
# Where is the bus alone? Bus alone is from x=450 to x=800 (center around 625)!
# Where is the "BUS STOP" logo?
# Let's detect the text color (navy and yellow) in the sky:
sky_crop = img.crop((0, 0, w, 350))
sky_crop.save('scratch/sky_crop.jpg')

# Let's also save centered crops
# Option 1: Bus + Shelter centered (center = 800)
# Option 2: Shelter itself in the mid (center = 960)
print("Saved sky crop")

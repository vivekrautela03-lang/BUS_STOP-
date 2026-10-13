from PIL import Image

img = Image.open('assets/splash_bg.jpg')
w, h = img.size

# In splash_bg.jpg:
# Bus is from x = 440 to 800
# Shelter is from x = 790 to 1150 (width = 360, center = 970)
# If the shelter is in the dead center (x = mid):
# We need center x = 970.
# But right edge of image is 1376. 1376 - 970 = 406px.
# If we take 406px to the left of 970: 970 - 406 = 564.
# Then the crop is [564, 1376] (width = 812).
# Let's see what happens if we crop [564, 1376] and inspect it:
crop_shelter_mid = img.crop((564, 0, 1376, 768))
crop_shelter_mid.save('scratch/shelter_mid_test.jpg')
print("Saved shelter_mid_test.jpg")

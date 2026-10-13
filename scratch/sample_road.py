from PIL import Image

src = Image.open('assets/screen3_hd.jpg')
# In 1376x768 coordinates:
# Old text is at x = 500 to 800, y = 680 to 768.
# Where is pure clean road asphalt?
# At x = 200 to 450, y = 600 to 720! (Pure asphalt on the left curve, completely free of any text!)
# Let's crop that and inspect it:
asphalt_sample = src.crop((200, 620, 450, 720))
asphalt_sample.save('scratch/asphalt_sample.jpg')
print("Saved scratch/asphalt_sample.jpg")

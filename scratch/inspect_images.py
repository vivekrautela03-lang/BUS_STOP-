import os
from PIL import Image

splash_path = 'assets/splash_bg.jpg'
login_path = 'assets/login_bg.jpg'

splash = Image.open(splash_path)
login = Image.open(login_path)

print(f"Splash size: {splash.size}")
print(f"Login size: {login.size}")

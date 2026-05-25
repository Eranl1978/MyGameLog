from PIL import Image, ImageDraw, ImageFont
import os

def create_app_icon(size, maskable=False):
    """יצירת אייקון עם EGZ"""
    # צבעים
    bg_color = (15, 10, 30)  # Dark purple
    border_color = (100, 80, 200)  # Light purple
    text_color = (255, 200, 80)  # Gold
    
    if maskable:
        # Maskable icon - ממורכז בתוך מעגל
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # רקע עגול
        circle_size = int(size * 0.9)
        offset = (size - circle_size) // 2
        draw.ellipse([offset, offset, offset + circle_size, offset + circle_size], 
                     fill=bg_color)
    else:
        # Regular icon - עם פינות מעוגלות
        img = Image.new("RGBA", (size, size), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Border עיגול חיצוני
        border_width = max(1, size // 20)
        draw.rectangle([0, 0, size-1, size-1], outline=border_color, width=border_width)
    
    draw = ImageDraw.Draw(img)
    
    # טקסט EGZ
    font_size = max(20, size // 3)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "EGZ"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size // 10
    
    draw.text((x, y), text, fill=text_color, font=font)
    
    return img

print("🎮 יוצר אייקונים עבור EranGameZone...")

sizes = [192, 512]

for size in sizes:
    # Regular icon
    img = create_app_icon(size, maskable=False)
    img.save(f"icon-{size}.png", "PNG")
    print(f"✅ נוצר icon-{size}.png")
    
    # Maskable icon
    img = create_app_icon(size, maskable=True)
    img.save(f"icon-maskable-{size}.png", "PNG")
    print(f"✅ נוצר icon-maskable-{size}.png")

print("\n✨ כל האיקונים נוצרו בהצלחה!")
print("🚀 עכשיו תוכל להתקין את האפליקציה בטלפון")

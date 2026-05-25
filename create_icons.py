from PIL import Image, ImageDraw
import os

# הנתיב לתמונה שלך
img_path = "logo_image.png"  # החלף בשם הקובץ שלך
output_dir = "."

# תמונה מקורית
img = Image.open(img_path).convert("RGBA")

# יצירת icons בגדלים שונים
sizes = [192, 512]

for size in sizes:
    # Regular icon
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(f"icon-{size}.png", "PNG")
    print(f"✅ נוצר icon-{size}.png")
    
    # Maskable icon (עם padding)
    maskable = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # 10% padding מכל צד (80% של התמונה)
    new_size = int(size * 0.8)
    resized_maskable = img.resize((new_size, new_size), Image.Resampling.LANCZOS)
    offset = (size - new_size) // 2
    maskable.paste(resized_maskable, (offset, offset), resized_maskable)
    maskable.save(f"icon-maskable-{size}.png", "PNG")
    print(f"✅ נוצר icon-maskable-{size}.png")

print("\n✨ כל האיקונים נוצרו בהצלחה!")
print("👉 שים את התמונה של EGZ בתמונה בשם 'logo_image.png' באותה תיקייה")

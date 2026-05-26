from PIL import Image
import os

def create_icons_from_image(input_image_path, output_dir="."):
    """יצירת אייקונים מתמונה קיימת"""
    
    # טעינת התמונה המקורית
    img = Image.open(input_image_path).convert("RGBA")
    print(f"📸 טעינת תמונה: {input_image_path}")
    print(f"גודל מקורי: {img.size}")
    
    sizes = [192, 512]
    
    for size in sizes:
        # Regular icon - resize רגיל
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(f"icon-{size}.png", "PNG")
        print(f"✅ נוצר icon-{size}.png")
        
        # Maskable icon - עם padding (80% של התמונה)
        maskable = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        new_size = int(size * 0.8)
        resized_maskable = img.resize((new_size, new_size), Image.Resampling.LANCZOS)
        offset = (size - new_size) // 2
        maskable.paste(resized_maskable, (offset, offset), resized_maskable)
        maskable.save(f"icon-maskable-{size}.png", "PNG")
        print(f"✅ נוצר icon-maskable-{size}.png")
    
    print("\n✨ כל האייקונים נוצרו מהתמונה שלך!")

# חפש קובץ תמונה בתיקייה
image_files = [f for f in os.listdir(".") if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

if image_files:
    # השתמש בקובץ הראשון
    image_path = image_files[0]
    print(f"🎮 מצא תמונה: {image_path}")
    create_icons_from_image(image_path)
else:
    print("❌ לא מצא קובץ תמונה בתיקייה")
    print("⚠️ אנא שים את התמונה שלך (PNG/JPG) בתיקייה ותריץ שוב")
    print(f"📂 קבצים בתיקייה: {os.listdir('.')}")

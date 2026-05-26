from PIL import Image
import shutil
import os
from pathlib import Path

print("🎮 EranGameZone - Icon Generator")
print("=" * 50)

# חפש תמונות בDeskop או Downloads
user_home = Path.home()
search_paths = [
    user_home / "Desktop",
    user_home / "Downloads",
    Path("C:/EranGameZone")
]

found_images = []
for path in search_paths:
    if path.exists():
        images = list(path.glob("*.png")) + list(path.glob("*.jpg"))
        for img in images:
            found_images.append(img)

if found_images:
    print(f"\n📸 מצא {len(found_images)} תמונות:")
    for i, img in enumerate(found_images[:10], 1):
        size = os.path.getsize(img) / 1024  # KB
        print(f"{i}. {img.name} ({size:.1f} KB)")
    
    choice = input("\nבחר מספר (או הקלד שלא): ").strip()
    if choice.isdigit() and 0 < int(choice) <= len(found_images):
        selected = found_images[int(choice) - 1]
        dest = Path("C:/EranGameZone/egz-logo.png")
        shutil.copy(selected, dest)
        print(f"\n✅ הועתקה: {dest}")
else:
    print("❌ לא מצא תמונות")
    print("\n👉 אנא שים את התמונה בתיקייה ותריץ שוב")

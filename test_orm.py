import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurantApp.settings')
django.setup()

from backend.core.models import Item

try:
    print("Fetching items...")
    items = Item.objects.all()
    print(f"Found {items.count()} items.")
    for item in items[:5]:
        print(item.name)
except Exception as e:
    print(f"Error: {e}")

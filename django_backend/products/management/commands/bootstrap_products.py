from django.core.management.base import BaseCommand

from products.repository import get_collection


PRODUCTS = [
    (1, "Minimalist Laundry Hamper", "Hostel Essentials", 299, "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop"),
    (2, "Memory Foam Mattress Topper", "Hostel Essentials", 799, "https://www.hindustantimes.com/ht-img/img/2026/01/27/1600x900/logo/Memory_foam_mattress_topper_1769506996491_1769507001023.png"),
    (3, "Adjustable Desk Lamp", "Hostel Essentials", 499, "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop"),
    (4, "Stackable Storage Cubes", "Hostel Essentials", 499, "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop"),
    (5, "Compact Coffee Maker", "Hostel Essentials", 699, "https://images.unsplash.com/photo-1716623135997-690d6712b9a3?auto=format&fit=crop&fm=jpg&q=80&w=800"),
    (6, "Noise Cancelling Headphones", "Electronics", 1499, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"),
    (7, "Scientific Calculator", "Electronics", 399, "https://images.unsplash.com/photo-1574607407408-1e681c46041d?q=80&w=800&auto=format&fit=crop"),
    (8, "20,000mAh Power Bank", "Electronics", 699, "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?q=80&w=800&auto=format&fit=crop"),
    (9, "Ergonomic Wireless Mouse", "Electronics", 299, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop"),
    (10, "Surge Protector Power Strip", "Electronics", 299, "https://www.brennenstuhl.es/temp/explorer/files/shop_articles/es-ES/images/4007123150496_1159540376____application______019631______xx.300dpi.jpg"),
    (11, "Hardcover Ruled Notebook", "Stationery", 149, "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop"),
    (12, "Precision Gel Pens (Set of 6)", "Stationery", 60, "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop"),
    (13, "Minimalist Desk Organizer", "Stationery", 199, "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=800&auto=format&fit=crop"),
    (14, "Architect's Drafting Tools", "Stationery", 299, "https://images.unsplash.com/photo-1603901622056-0a5bee231395?auto=format&fit=crop&w=800&q=80"),
    (15, "Pastel Highlighters", "Stationery", 99, "https://sta-live-cdn.b-cdn.net/thumbnail/4b/0d/df/1673617267/STABILO_swing_cool_Pastel_header2_1920x1920.jpg"),
    (16, "All-Weather Hiking Backpack", "Trekking Essentials", 999, "https://images.unsplash.com/photo-1760715651666-c3e408bfdda7?auto=format&fit=crop&w=800&q=80"),
    (17, "Insulated Steel Water Bottle", "Trekking Essentials", 299, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop"),
    (18, "Heavy-Duty Trekking Boots", "Trekking Essentials", 1499, "https://www.nord-spur.co.uk/cdn/shop/collections/2_fe0e93c0-668a-40dc-936b-ad31c51a047c.png?v=1774950234&width=1080"),
    (19, "Magnetic Navigation Compass", "Trekking Essentials", 199, "https://www.vacation-dodecanese.com/images/how-to-choose-the-right-gear-for-your-mountain-adventure.jpeg"),
    (20, "Compact Survival Multi-Tool", "Trekking Essentials", 499, "https://images.unsplash.com/photo-1607456646472-824a797b26a4?auto=format&fit=crop&w=800&q=80"),
]


class Command(BaseCommand):
    help = "Insert the EquipU catalog only when the products collection is empty."

    def handle(self, *args, **options):
        collection = get_collection()
        if collection.count_documents({}, limit=1):
            self.stdout.write(self.style.WARNING("Products already exist; nothing was changed."))
            return

        collection.insert_many(
            [
                {
                    "productId": product_id,
                    "name": name,
                    "category": category,
                    "price": price,
                    "img": image,
                }
                for product_id, name, category, price, image in PRODUCTS
            ]
        )
        self.stdout.write(self.style.SUCCESS(f"Inserted {len(PRODUCTS)} products."))

from datetime import datetime, timezone

from bson import ObjectId


PRODUCT_FIELDS = ("productId", "name", "category", "price", "img")


def _cast_number(value, field_name):
    if isinstance(value, bool):
        raise ValueError(f"{field_name}: Cast to Number failed for value {value}")
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name}: Cast to Number failed for value {value}") from exc
    return int(number) if number.is_integer() else number


def validate_product_payload(payload):
    if not isinstance(payload, dict):
        raise ValueError("Product data must be a JSON object")

    missing = [
        field
        for field in PRODUCT_FIELDS
        if field not in payload or payload[field] is None or payload[field] == ""
    ]
    if missing:
        raise ValueError(f"Product validation failed: {missing[0]}: Path `{missing[0]}` is required")

    product = {
        "productId": _cast_number(payload["productId"], "productId"),
        "name": str(payload["name"]),
        "category": str(payload["category"]),
        "price": _cast_number(payload["price"], "price"),
        "img": str(payload["img"]),
    }
    return product


def json_safe(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    return value


def normalize_product_images(featured_img, raw_images=None):
    """Normalize featured image (first & compulsory) and optional additional gallery images."""
    featured = str(featured_img or "").strip()
    gallery = []
    if isinstance(raw_images, list):
        for item in raw_images:
            url = str(item or "").strip()
            if url and url not in gallery:
                gallery.append(url)

    if featured:
        images = [featured] + [url for url in gallery if url != featured]
    elif gallery:
        featured = gallery[0]
        images = gallery
    else:
        images = []

    return featured, images


def format_product(product):
    stock = product.get("stock")
    if stock is None:
        stock = 25  # Sensible campus default if unstated

    try:
        stock = max(0, int(stock))
    except (ValueError, TypeError):
        stock = 0

    in_stock = bool(product.get("inStock", True)) and (stock > 0)
    featured_img, images = normalize_product_images(product.get("img"), product.get("images"))

    return {
        "id": product["productId"],
        "name": product["name"],
        "category": product["category"],
        "price": f"₹{product['price']}",
        "rawPrice": product.get("price", 0),
        "img": featured_img,
        "images": images,
        "stock": stock,
        "sellerId": product.get("sellerId"),
        "sellerName": product.get("sellerName", "Cartly Campus Hub"),
        "sellerLocation": product.get("sellerLocation", "Central Campus Store"),
        "description": product.get("description", "Verified campus student essential."),
        "inStock": in_stock,
    }

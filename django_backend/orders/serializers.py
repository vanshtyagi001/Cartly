from datetime import datetime, timezone
import random


def generate_order_id() -> str:
    # Generates editorial style order ID like CT-74921
    number = random.randint(10000, 99999)
    return f"CT-{number}"


def format_order(order_doc: dict) -> dict:
    created_at = order_doc.get("createdAt")
    if isinstance(created_at, datetime):
        date_str = created_at.strftime("%B %d, %Y")
    else:
        date_str = str(created_at or "")

    total_val = float(order_doc.get("total", 0))

    return {
        "id": order_doc.get("orderId", str(order_doc.get("_id"))),
        "dbId": str(order_doc.get("_id")),
        "date": date_str,
        "total": f"₹{total_val:,.2f}",
        "rawTotal": total_val,
        "subtotal": float(order_doc.get("subtotal", 0)),
        "discountAmount": float(order_doc.get("discountAmount", 0)),
        "couponCode": order_doc.get("couponCode", ""),
        "tax": float(order_doc.get("tax", 0)),
        "status": order_doc.get("status", "Confirmed"),
        "paymentMethod": order_doc.get("paymentMethod", "Cash on Delivery"),
        "paymentStatus": order_doc.get("paymentStatus", "Pending (Cash on Delivery)"),
        "shippingAddress": order_doc.get("shippingAddress", {}),
        "items": order_doc.get("items", []),
        "userEmail": order_doc.get("userEmail", ""),
        "userName": order_doc.get("userName", ""),
    }

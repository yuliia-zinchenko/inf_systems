"""Static sample data shared by seed.py and load.py."""
import random

# Public sample videos (Google test bucket) — playable in the TagShop player.
VIDEO_URLS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
]

VIDEO_TOPICS = [
    "Огляд осінньої колекції", "Розпакування гаджетів", "Ранкова рутина догляду",
    "Облаштування робочого місця", "Кемпінг на вихідних", "Кухня за 15 хвилин",
    "Тренування вдома", "Образи для офісу", "Подарунки до свят", "Догляд за кімнатними рослинами",
]

PRODUCTS = [
    "Бездротові навушники", "Шкіряний рюкзак", "Керамічна чашка", "Настільна лампа",
    "Механічна клавіатура", "Кросівки для бігу", "Вовняний светр", "Термос 0.5 л",
    "Сироватка для обличчя", "Килимок для йоги", "Портативна колонка", "Сонцезахисні окуляри",
]

VARIANTS = ["card", "compact", "badge", "minimal"]
ACCENTS = ["fuchsia", "emerald", "sky", "amber", "rose", "white"]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
]

SEED_EMAIL_DOMAIN = "seed.tagshop.local"


def video_title() -> str:
    return f"{random.choice(VIDEO_TOPICS)} #{random.randint(1, 999)}"


def product_tag(n: int | None = None) -> dict:
    n = n if n is not None else random.randint(1, 10_000)
    return {
        "time": round(random.uniform(0, 120), 1),
        "duration": random.choice([3, 5, 5, 8, 10]),
        "title": random.choice(PRODUCTS),
        "imageUrl": f"https://picsum.photos/seed/tagshop{n}/400/400",
        "link": f"https://shop.example.com/product/{n}",
        "variant": random.choice(VARIANTS),
        "accentColor": random.choice(ACCENTS),
        "positionX": round(random.uniform(5, 95), 1),
        "positionY": round(random.uniform(5, 95), 1),
    }


def random_ip() -> str:
    return f"{random.randint(11, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

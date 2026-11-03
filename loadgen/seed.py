"""Seed the TagShop database directly through psycopg.

Creates users, videos, product tags and a history of analytics events spread
over the last SEED_DAYS days. Idempotent: refuses to run twice unless --reset
is given, which removes previously seeded users (and, via ON DELETE CASCADE,
their videos, tags, sessions and events).

    python seed.py            # seed once
    python seed.py --reset    # wipe seeded data and seed again
"""
import hashlib
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone

import bcrypt
import psycopg
from faker import Faker

import catalog

DSN = os.environ.get("DATABASE_URL", "postgresql://tagshop:tagshop@localhost:5433/tagshop")
USERS = int(os.environ.get("SEED_USERS", 25))
VIDEOS_PER_USER = int(os.environ.get("SEED_VIDEOS_PER_USER", 3))
TAGS_PER_VIDEO = int(os.environ.get("SEED_TAGS_PER_VIDEO", 4))
EVENTS = int(os.environ.get("SEED_EVENTS", 30_000))
DAYS = int(os.environ.get("SEED_DAYS", 14))
PASSWORD = os.environ.get("SEED_PASSWORD", "Password123!")
EMAIL_LIKE = f"%@{catalog.SEED_EMAIL_DOMAIN}"
# Only the numbered seed accounts mark the DB as seeded: load.py may already have
# signed up its own users in the same domain before the seed runs.
SEEDED_LIKE = f"user%@{catalog.SEED_EMAIL_DOMAIN}"

fake = Faker("uk_UA")
now = datetime.now(timezone.utc)


def past(days: float) -> datetime:
    """Random moment in the last `days` days, weighted towards daytime hours."""
    moment = now - timedelta(seconds=random.uniform(0, days * 86400))
    if moment.hour < 8 and random.random() < 0.6:
        moment += timedelta(hours=10)
    return min(moment, now)


def ip_hash() -> str:
    return hashlib.sha256(catalog.random_ip().encode()).hexdigest()[:32]


def main() -> None:
    reset = "--reset" in sys.argv
    started = time.perf_counter()
    with psycopg.connect(DSN) as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM users WHERE email LIKE %s", (SEEDED_LIKE,))
        existing = cur.fetchone()[0]
        if existing and not reset:
            print(f"Already seeded ({existing} users). Use --reset to re-seed.")
            return
        if reset:
            cur.execute("DELETE FROM users WHERE email LIKE %s", (EMAIL_LIKE,))
            print(f"Removed {cur.rowcount} seeded users (cascade).")

        # One hash for all seeded users: bcrypt at cost 12 is deliberately slow.
        password_hash = bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt(12)).decode()

        user_ids = []
        for i in range(1, USERS + 1):
            cur.execute(
                """INSERT INTO users (email, name, password_hash, email_verified, created_at)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (f"user{i}@{catalog.SEED_EMAIL_DOMAIN}", fake.name(), password_hash,
                 random.random() < 0.8, past(DAYS + 30)),
            )
            user_ids.append(cur.fetchone()[0])

        videos = []  # (video_id, [tag_ids])
        for user_id in user_ids:
            for _ in range(random.randint(1, VIDEOS_PER_USER * 2 - 1)):
                cur.execute(
                    """INSERT INTO videos (title, video_url, source_type, user_id, created_at)
                       VALUES (%s, %s, 'url', %s, %s) RETURNING id""",
                    (catalog.video_title(), random.choice(catalog.VIDEO_URLS), user_id, past(DAYS + 7)),
                )
                video_id = cur.fetchone()[0]
                tag_ids = []
                for _ in range(random.randint(1, TAGS_PER_VIDEO * 2 - 1)):
                    t = catalog.product_tag()
                    cur.execute(
                        """INSERT INTO product_tags (video_id, time_sec, duration_sec, title, image_url, link,
                                                     variant, accent_color, position_x, position_y)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (video_id, t["time"], t["duration"], t["title"], t["imageUrl"], t["link"],
                         t["variant"], t["accentColor"], t["positionX"], t["positionY"]),
                    )
                    tag_ids.append(cur.fetchone()[0])
                videos.append((video_id, tag_ids))

        # Popularity follows a long tail: a few videos get most of the traffic.
        weights = [random.paretovariate(1.2) for _ in videos]
        picks = random.choices(videos, weights=weights, k=EVENTS)
        with cur.copy(
            "COPY video_events (video_id, type, tag_id, user_agent, ip_hash, occurred_at) FROM STDIN"
        ) as copy:
            for video_id, tag_ids in picks:
                ua = random.choice(catalog.USER_AGENTS)
                when = past(DAYS)
                copy.write_row((video_id, "view", None, ua, ip_hash(), when))
                if tag_ids and random.random() < 0.25:
                    copy.write_row((video_id, "tag_click", random.choice(tag_ids), ua, ip_hash(),
                                    when + timedelta(seconds=random.uniform(2, 90))))

        conn.commit()

        cur.execute(
            """SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM videos),
                      (SELECT count(*) FROM product_tags), (SELECT count(*) FROM video_events)"""
        )
        u, v, t, e = cur.fetchone()
        print(f"Seeded {len(user_ids)} users, {len(videos)} videos in {time.perf_counter() - started:.1f}s.")
        print(f"Totals now: users={u} videos={v} product_tags={t} video_events={e}")
        print(f"Seed users sign in as user<N>@{catalog.SEED_EMAIL_DOMAIN} / {PASSWORD}")


if __name__ == "__main__":
    main()

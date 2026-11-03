"""User management CLI for the monitoring auth server.

    docker compose exec auth-service python manage.py list-users
    docker compose exec auth-service python manage.py create-user anna --role viewer
    docker compose exec auth-service python manage.py set-password anna
    docker compose exec auth-service python manage.py delete-user anna
"""
import argparse
import getpass
import sqlite3
import sys

import db


def ask_password() -> str:
    first = getpass.getpass("Пароль: ")
    if len(first) < 8:
        sys.exit("Пароль має містити щонайменше 8 символів")
    if getpass.getpass("Повторіть пароль: ") != first:
        sys.exit("Паролі не збігаються")
    return first


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list-users")
    create = sub.add_parser("create-user")
    create.add_argument("username")
    create.add_argument("--role", choices=db.ROLES, default="viewer")
    create.add_argument("--password", help="non-interactive; otherwise prompted")
    passwd = sub.add_parser("set-password")
    passwd.add_argument("username")
    passwd.add_argument("--password")
    delete = sub.add_parser("delete-user")
    delete.add_argument("username")
    args = parser.parse_args()

    db.init()
    if args.cmd == "list-users":
        for u in db.list_users():
            print(f"{u['id']:>3}  {u['username']:<20} {u['role']:<7} created {u['created_at']}  last login {u['last_login_at'] or '-'}")
    elif args.cmd == "create-user":
        try:
            db.create_user(args.username, args.password or ask_password(), args.role)
        except sqlite3.IntegrityError:
            sys.exit(f"Користувач {args.username} вже існує")
        print(f"Створено {args.username} ({args.role})")
    elif args.cmd == "set-password":
        if not db.set_password(args.username, args.password or ask_password()):
            sys.exit(f"Користувача {args.username} не знайдено")
        print("Пароль змінено")
    elif args.cmd == "delete-user":
        if not db.delete_user(args.username):
            sys.exit(f"Користувача {args.username} не знайдено")
        print(f"Видалено {args.username}; його сесії більше не діють")


if __name__ == "__main__":
    main()

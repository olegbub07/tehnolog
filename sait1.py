"""Локальный показ сайта для профориентации."""

from __future__ import annotations

import http.server
import os
import socketserver
import sys
import threading
import webbrowser

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        sys.stdout.write("  " + (format % args) + "\n")


def main() -> None:
    os.chdir(ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://127.0.0.1:{PORT}/"
        print()
        print("  Технолог пищевых производств")
        print(f"  {url}")
        print()
        print("  В классе: F — полный экран, стрелки — слайды")
        print("  Остановка: Ctrl+C")
        print()
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Остановлено.")


if __name__ == "__main__":
    main()

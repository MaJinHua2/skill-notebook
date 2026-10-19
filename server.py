#!/usr/bin/env python3
"""A read-only server with an explicit asset allowlist."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
from urllib.parse import urlsplit

PUBLIC = Path(__file__).resolve().parent / "public"
ASSETS = {"/": "index.html", "/index.html": "index.html", "/app.css": "app.css", "/app.js": "app.js", "/favicon.svg": "favicon.svg", "/catalog.json": "catalog.json"}


class Handler(BaseHTTPRequestHandler):
    server_version = "SkillNotes"
    sys_version = ""

    def do_HEAD(self):
        self.send_asset(head=True)

    def do_GET(self):
        self.send_asset()

    def send_asset(self, head=False):
        name = ASSETS.get(urlsplit(self.path).path)
        if not name:
            self.send_error(404, "Not found")
            return
        try:
            content = (PUBLIC / name).read_bytes()
        except OSError:
            self.send_error(503, "Asset unavailable")
            return
        mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", f"{mime}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")
        self.end_headers()
        if not head:
            self.wfile.write(content)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"技能导航站：http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

"""HTTP integration tests: only intended assets can be read."""
import importlib.util
from pathlib import Path
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

spec = importlib.util.spec_from_file_location("notes_server", Path(__file__).parents[1] / "server.py")
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class QuietHandler(server.Handler):
    def log_message(self, *args):
        pass


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http = server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        cls.worker = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.worker.start()
        cls.base = f"http://127.0.0.1:{cls.http.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.worker.join()

    def test_page_assets_head_and_uncached_catalog(self):
        for path in ["/", "/app.js", "/app.css", "/catalog.json", "/favicon.svg"]:
            with self.subTest(path=path), urlopen(self.base + path) as response:
                self.assertEqual(response.status, 200)
                self.assertEqual(response.headers["Cache-Control"], "no-store")
                self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
                self.assertGreater(len(response.read()), 0)
        with urlopen(Request(self.base + "/catalog.json", method="HEAD")) as response:
            self.assertEqual(response.read(), b"")

    def test_private_files_and_traversal_are_not_served(self):
        for path in ["/README.md", "/server.py", "/../README.md", "/%2e%2e/README.md", "/.catalog.lock", "/backups/"]:
            with self.subTest(path=path), self.assertRaises(HTTPError) as error:
                urlopen(self.base + path)
            self.assertEqual(error.exception.code, 404)

    def test_no_public_write_endpoint(self):
        for method in ["POST", "PUT", "PATCH", "DELETE"]:
            with self.subTest(method=method), self.assertRaises(HTTPError) as error:
                urlopen(Request(self.base + "/catalog.json", data=b"{}", method=method))
            self.assertEqual(error.exception.code, 501)


if __name__ == "__main__":
    unittest.main()

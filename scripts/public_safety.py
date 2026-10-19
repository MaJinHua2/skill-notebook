"""Conservative publication checks. Findings never include matched private values."""
import ipaddress
import re

PATTERNS = {
    "personal-path": re.compile(r"/(?:home|Users)/[A-Za-z0-9_.-]+|[A-Za-z]:\\Users\\[A-Za-z0-9_.-]+"),
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "chat-id": re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I),
    "access-token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})\b"),
    "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "credential-url": re.compile(r"https?://[^\s/@:]+:[^\s/@]+@"),
    "secret-assignment": re.compile(r'''(?i)(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)["']?\s*[:=]\s*["'][A-Za-z0-9_+/=-]{16,}["']'''),
}
IP_ADDRESS = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
DOCUMENTATION_NETWORKS = [ipaddress.ip_network(net) for net in ["192.0.2.0/24", "198.51.100.0/24", "203.0.113.0/24"]]


def findings(text):
    """Return (line, category) only. All-zero UUID prefixes are test fixtures."""
    result = set()
    for category, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            value = match.group()
            if category == "chat-id" and value.startswith("00000000-"):
                continue
            if category == "email" and value.endswith("@users.noreply.github.com"):
                continue
            result.add((text.count("\n", 0, match.start()) + 1, category))
    for match in IP_ADDRESS.finditer(text):
        try:
            address = ipaddress.ip_address(match.group())
        except ValueError:
            continue
        if address.is_loopback or address.is_unspecified or any(address in net for net in DOCUMENTATION_NETWORKS):
            continue
        result.add((text.count("\n", 0, match.start()) + 1, "network-address"))
    return sorted(result)


def assert_public(text):
    categories = sorted({category for _, category in findings(text)})
    if categories:
        raise ValueError("公开内容包含受保护的信息类别：" + ", ".join(categories))

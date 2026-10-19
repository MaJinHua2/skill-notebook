#!/usr/bin/env python3
"""Install user-local service and an explicit-only Codex skill from this checkout."""
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def systemd_quote(value):
    return str(value).replace("\\", "\\\\").replace('"', '\\"').replace("%", "%%")


def main():
    codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    target = codex_home / "skills" / "collect-skill-notes"
    source = ROOT / "skills" / "collect-skill-notes"
    if (target.exists() or target.is_symlink()) and target.resolve() != source:
        raise RuntimeError("已有同名技能指向其他位置；为保护原文件，安装已停止")
    template = (ROOT / "deploy" / "skill-notebook.service").read_text()
    working = str(ROOT).replace("%", "%%")
    if "\n" in working or "\r" in working:
        raise RuntimeError("项目路径包含不支持的换行符")
    rendered = template.replace("@WORKING_DIRECTORY@", working).replace("@PROJECT_ROOT@", systemd_quote(ROOT)).replace("@PYTHON@", systemd_quote(sys.executable))
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.is_symlink() and not target.exists():
        target.symlink_to(source, target_is_directory=True)
    service_dir = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config")) / "systemd" / "user"
    service_dir.mkdir(parents=True, exist_ok=True)
    (service_dir / "skill-notebook.service").write_text(rendered)
    subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
    subprocess.run(["systemctl", "--user", "enable", "skill-notebook.service"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["systemctl", "--user", "restart", "skill-notebook.service"], check=True)
    print("本地服务与主动收录技能已安装；服务地址为本机或局域网主机的 8765 端口。")


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"安装未完成：{type(error).__name__}；未输出私人路径或凭据。", file=sys.stderr)
        sys.exit(1)

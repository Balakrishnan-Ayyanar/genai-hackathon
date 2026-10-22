"""Restore WSL localhost:8088 -> Windows Nightshift without changing networking."""

import ipaddress
import socket
import subprocess
import time
from pathlib import Path


def main():
    try:
        with socket.create_connection(("127.0.0.1", 8088), timeout=1):
            print("Port 8088 is already listening. Run check_nightshift.py to verify it.")
            return
    except OSError:
        pass

    route = subprocess.check_output(["ip", "-4", "route", "get", "1.1.1.1"], text=True).split()
    guest = str(ipaddress.IPv4Address(route[route.index("src") + 1]))
    state = Path("/mnt/c/Users/fvn6xu/AppData/Local/Nightshift-wsl-tunnel")
    if not (state / "id_ed25519").is_file():
        raise SystemExit("Missing dedicated tunnel key; ask for tunnel setup again.")
    windows_state = r"C:\Users\fvn6xu\AppData\Local\Nightshift-wsl-tunnel"
    command = [
        "/mnt/c/Windows/System32/OpenSSH/ssh.exe", "-N", "-T",
        "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes",
        "-o", "ExitOnForwardFailure=yes", "-o", "ConnectTimeout=10",
        "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=3",
        "-o", "StrictHostKeyChecking=yes",
        "-o", "UserKnownHostsFile=" + windows_state + r"\known_hosts",
        "-o", "HostKeyAlias=nightshift-wsl-local",
        "-i", windows_state + r"\id_ed25519",
        "-R", "127.0.0.1:8088:127.0.0.1:8088", "bala@" + guest,
    ]
    log = Path(__file__).with_name("nightshift-tunnel.log")
    with log.open("ab") as output:
        process = subprocess.Popen(
            command, stdin=subprocess.DEVNULL, stdout=output, stderr=output,
            start_new_session=True,
        )
    for _ in range(40):
        try:
            with socket.create_connection(("127.0.0.1", 8088), timeout=0.3):
                print("Nightshift tunnel ready on http://127.0.0.1:8088/v1")
                return
        except OSError:
            if process.poll() is not None:
                raise SystemExit(f"Tunnel exited. Check {log}") from None
            time.sleep(0.3)
    process.terminate()
    raise SystemExit(f"Tunnel did not become ready. Check {log}")


if __name__ == "__main__":
    main()

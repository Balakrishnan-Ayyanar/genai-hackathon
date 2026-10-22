"""Check the Windows Nightshift Runtime directly from WSL without printing secrets."""

import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def main():
    env_file = Path(__file__).resolve().parents[1] / "zetaris-getting-started/.env.local"
    settings = {}
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            settings[key.strip()] = value.strip().strip("\"'")
    base = settings["METERLESS_BASE_URL"].rstrip("/")
    token = settings["METERLESS_RUNTIME_TOKEN"]
    if not token:
        raise ValueError("METERLESS_RUNTIME_TOKEN is missing")

    def request(path, bearer, body=None):
        headers = {
            "Authorization": "Bearer " + bearer,
            "meterless-app": "hackathon-setup-check",
            "meterless-scope": "user",
            "Content-Type": "application/json",
        }
        data = json.dumps(body).encode() if body is not None else None
        with urlopen(Request(base + path, data=data, headers=headers), timeout=180) as response:
            return json.load(response)

    try:
        request("/models", "invalid-setup-test-token")
    except HTTPError as error:
        if error.code not in (401, 403):
            raise
        print("PASS Runtime rejects an invalid token")
    else:
        raise ValueError("Runtime unexpectedly accepted an invalid token")

    models = request("/models", token).get("data", [])
    if not any(model.get("id", "").startswith("meterless/") for model in models):
        raise ValueError("Runtime did not advertise Meterless routes")
    print(f"PASS Authenticated model discovery: {len(models)} models/routes")
    reply = request("/chat/completions", token, {
        "model": settings.get("METERLESS_MODEL", "meterless/auto"),
        "messages": [{"role": "user", "content": "Reply with the single word: ready"}],
        "max_tokens": 64,
        "stream": False,
    })
    content = reply.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Runtime returned no text response")
    print("PASS Model response via WSL; model:", reply.get("model", "unknown"))
    print("Response:", content.replace(token, "<redacted>")[:200])


if __name__ == "__main__":
    try:
        main()
    except HTTPError as error:
        raise SystemExit(f"FAIL Runtime returned HTTP {error.code}") from None
    except (URLError, OSError):
        raise SystemExit("FAIL Runtime unreachable. Restart WSL to apply mirrored networking and keep Nightshift running.") from None
    except (ValueError, KeyError, IndexError):
        raise SystemExit("FAIL Check Runtime settings and the configured model lane.") from None

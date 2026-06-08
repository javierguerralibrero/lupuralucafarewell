#!/usr/bin/env python3
"""
Generates HeyGen talking photo videos for Dan and Raluca.
Uses HeyGen v3 API: upload photo -> generate video -> download.
"""

import urllib.request
import json
import time
import os
import io
from PIL import Image

HEYGEN_KEY = "sk_V2_hgu_koZa7RTpGcB_xFt7Kl26SZtb0vASPIMVpEpjTVamgzbQ"
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "../public/avatars")

# Voices chosen for character fit
DAN_VOICE_ID = "31e2fd6e7c924bc9be987ac4cfaac5e8"     # Warm William — closest to Forrest Gump style
RALUCA_VOICE_ID = "e85822bd14e144e8b6fe73da2fb1085c"  # Camila Vega Excited — female Spanish

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
DAN_PHOTO = os.path.join(SCRIPTS_DIR, "avatar_dan_nobg.png")
RALUCA_PHOTO = os.path.join(SCRIPTS_DIR, "avatar_raluca_nobg.png")

DAN_JOKES = [
    "Mama always said life is like a marathon — you never know what finish line you're gonna get.",
    "Mama always said moving to France is like a box of croissants — you never know which one's buttery enough.",
    "Mama always said you've got to put the past behind you before you can move forward… to the Côte d'Azur.",
    "Mama always said stupid is as stupid does — but moving to the French Riviera ain't stupid at all.",
]

RALUCA_JOKES = [
    "¡Fistro! ¡Nos vamos a Francia, pecador! ¡Cobarde de la calzada!",
    "¡No puedor creer! ¡Nos mudamos a la Costa Azul, jarl! ¡Qué nivel, macho!",
    "¡Amigo del señor! ¡Madrid nos querrá, pero Francia nos necesita, pecador!",
    "¡Fistro! ¡La gente de Madrid llora, pecador! ¡Hasta luego, maricón!",
]


def api_request(method, url, data=None, headers=None, raw_data=None, content_type=None):
    base_headers = {"x-api-key": HEYGEN_KEY, "accept": "application/json"}
    if headers:
        base_headers.update(headers)
    if content_type:
        base_headers["Content-Type"] = content_type
    elif data:
        base_headers["Content-Type"] = "application/json"

    body = raw_data if raw_data else (json.dumps(data).encode() if data else None)
    req = urllib.request.Request(url, data=body, headers=base_headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  HTTP {e.code}: {error_body}")
        return {"error": error_body, "code": e.code}


def prepare_photo(path, size=512):
    """Composite transparent PNG onto dark background, resize, return JPEG bytes."""
    img = Image.open(path).convert("RGBA")
    # Composite onto dark background matching site color
    bg = Image.new("RGBA", img.size, (10, 10, 10, 255))
    bg.paste(img, mask=img.split()[3])
    final = bg.convert("RGB").resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    final.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def upload_asset(photo_path, label):
    """Upload photo to HeyGen v3 assets, return asset_id."""
    print(f"  Uploading {label} photo...")
    img_bytes = prepare_photo(photo_path)

    boundary = "----HeyGenBoundary7xY9k"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{label.lower()}.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + img_bytes + f"\r\n--{boundary}--\r\n".encode()

    result = api_request(
        "POST",
        "https://api.heygen.com/v3/assets",
        raw_data=body,
        content_type=f"multipart/form-data; boundary={boundary}",
    )
    print(f"  Upload result: {result}")
    asset_id = result.get("data", {}).get("asset_id") or result.get("asset_id")
    if not asset_id:
        # Try alternate key paths
        asset_id = result.get("data", {}).get("id")
    return asset_id


def generate_video(asset_id, text, voice_id, title):
    """Submit video generation job, return video_id."""
    print(f"  Generating: {title[:50]}...")
    payload = {
        "type": "image",
        "title": title,
        "image": {"type": "asset_id", "asset_id": asset_id},
        "script": text,
        "voice_id": voice_id,
    }
    result = api_request("POST", "https://api.heygen.com/v3/videos", data=payload)
    print(f"  Generate result: {result}")
    video_id = result.get("data", {}).get("video_id") or result.get("video_id")
    return video_id


def wait_for_video(video_id, timeout=300):
    """Poll until video is complete, return download URL."""
    print(f"  Waiting for video {video_id}...", end="", flush=True)
    elapsed = 0
    while elapsed < timeout:
        time.sleep(10)
        elapsed += 10
        result = api_request("GET", f"https://api.heygen.com/v3/videos/{video_id}")
        status = result.get("data", {}).get("status") or result.get("status", "unknown")
        print(f" {status}", end="", flush=True)
        if status == "completed":
            print()
            return result.get("data", {}).get("video_url") or result.get("video_url")
        if status in ("failed", "error"):
            print(f"\n  FAILED: {result}")
            return None
    print("\n  TIMEOUT")
    return None


def download_video(url, path):
    print(f"  Downloading to {os.path.basename(path)}...")
    urllib.request.urlretrieve(url, path)
    size = os.path.getsize(path)
    print(f"  Saved {size // 1024}KB")


def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    # Upload photos
    print("\n=== Uploading photos ===")
    dan_asset = upload_asset(DAN_PHOTO, "dan")
    raluca_asset = upload_asset(RALUCA_PHOTO, "raluca")

    if not dan_asset or not raluca_asset:
        print("ERROR: Could not upload one or both photos. Check quota or API key.")
        return

    print(f"\nDan asset_id:    {dan_asset}")
    print(f"Raluca asset_id: {raluca_asset}")

    # Generate videos
    jobs = []

    print("\n=== Submitting Dan videos ===")
    for i, joke in enumerate(DAN_JOKES):
        vid_id = generate_video(dan_asset, joke, DAN_VOICE_ID, f"dan_joke_{i}")
        if vid_id:
            jobs.append({"id": vid_id, "filename": f"dan_{i}.mp4", "label": f"Dan joke {i}"})

    print("\n=== Submitting Raluca videos ===")
    for i, joke in enumerate(RALUCA_JOKES):
        vid_id = generate_video(raluca_asset, joke, RALUCA_VOICE_ID, f"raluca_joke_{i}")
        if vid_id:
            jobs.append({"id": vid_id, "filename": f"raluca_{i}.mp4", "label": f"Raluca joke {i}"})

    if not jobs:
        print("\nERROR: No videos were submitted. Likely a quota issue.")
        print("Add credits at https://app.heygen.com/settings?tab=billing")
        return

    # Download completed videos
    print(f"\n=== Waiting for {len(jobs)} videos ===")
    for job in jobs:
        print(f"\n[{job['label']}]")
        url = wait_for_video(job["id"])
        if url:
            download_video(url, os.path.join(PUBLIC_DIR, job["filename"]))
        else:
            print(f"  Skipping {job['filename']} — failed or timed out")

    print("\n=== Done ===")
    generated = [j["filename"] for j in jobs if os.path.exists(os.path.join(PUBLIC_DIR, j["filename"]))]
    print(f"Generated {len(generated)}/{len(jobs)} videos in public/avatars/")
    for f in generated:
        print(f"  - {f}")


if __name__ == "__main__":
    main()

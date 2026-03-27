"""Render all draw.io .drawio files to PNG using draw.io desktop CLI (headless)."""
import os
import glob
import subprocess
import shutil

def find_drawio_exe():
    """Find the draw.io desktop executable."""
    candidates = [
        shutil.which("draw.io"),
        shutil.which("drawio"),
        r"C:\Program Files\draw.io\draw.io.exe",
        r"C:\Program Files (x86)\draw.io\draw.io.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\draw.io\draw.io.exe"),
    ]
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return None

def render_with_puppeteer(drawio_path, out_path):
    """Fallback: use Node.js puppeteer to render SVG from drawio XML, then convert."""
    # This requires a more complex setup, skip for now
    return False

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    drawio_dir = os.path.join(base, "drawio")
    out_dir = os.path.join(base, "rendered")
    os.makedirs(out_dir, exist_ok=True)

    exe = find_drawio_exe()
    if not exe:
        print("draw.io desktop not found. Attempting alternative rendering...")
        # Try using the drawio CLI tool available in PATH
        drawio_cli = shutil.which("drawio")
        if drawio_cli:
            print(f"Found drawio CLI at: {drawio_cli}")
        else:
            print("No draw.io renderer available.")
            print("Draw.io XML files created successfully in diagrams/drawio/")
            print("To render manually:")
            print("  1. Open each .drawio file in draw.io (desktop or web)")
            print("  2. Export as PNG to diagrams/rendered/")
            return

    drawio_files = sorted(glob.glob(os.path.join(drawio_dir, "*.drawio")))
    for path in drawio_files:
        name = os.path.splitext(os.path.basename(path))[0]
        out_path = os.path.join(out_dir, f"{name}.png")
        print(f"Rendering {name}.drawio -> {name}.png ... ", end="")
        try:
            result = subprocess.run(
                [exe, "--export", "--format", "png", "--scale", "2",
                 "--output", out_path, path],
                capture_output=True, text=True, timeout=60
            )
            if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                print(f"OK ({os.path.getsize(out_path)} bytes)")
            else:
                print(f"FAILED: {result.stderr.strip()}")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    main()

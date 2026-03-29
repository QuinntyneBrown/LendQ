"""Render all PlantUML .puml files to PNG using the PlantUML online server."""
import os
import glob
import plantuml

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    puml_dir = os.path.join(base, "plantuml")
    out_dir = os.path.join(base, "rendered")
    os.makedirs(out_dir, exist_ok=True)

    server = plantuml.PlantUML(url="http://www.plantuml.com/plantuml/png/")

    puml_files = sorted(glob.glob(os.path.join(puml_dir, "*.puml")))
    for path in puml_files:
        name = os.path.splitext(os.path.basename(path))[0]
        out_path = os.path.join(out_dir, f"{name}.png")
        print(f"Rendering {name}.puml -> {name}.png ... ", end="")
        try:
            server.processes_file(path, outfile=out_path)
            if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                print(f"OK ({os.path.getsize(out_path)} bytes)")
            else:
                print("FAILED (empty output)")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    main()

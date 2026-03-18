import os

base_dir = r"C:\Users\김윤주\.gemini\antigravity\brain"

targets = [
    "c43c6d91-9223-4297-ada0-3fc81f960bbd",
    "776b6de1-f5a5-4a76-81af-d62a94afd24c",
    "b7bf04f6-ba4d-45bc-83c3-74dcbee347e4",
    "edd2fc73-d33d-484d-a36b-43a1a3de0fb1",
    "f478ec4a-12e6-4e40-aaa1-a0e23ff6c7dc"
]

with open("output_msgs.txt", "w", encoding="utf-8") as out:
    for t in targets:
        agent_dir = os.path.join(base_dir, t, ".system_generated", "logs")
        if os.path.exists(agent_dir):
            out.write(f"--- Conversation {t} ---\n")
            for f in os.listdir(agent_dir):
                if f.endswith(".txt"):
                    path = os.path.join(agent_dir, f)
                    try:
                        with open(path, "r", encoding="utf-8", errors="replace") as file:
                            content = file.read()
                            if "TD" in content or "목표" in content:
                                lines = content.split('\n')
                                for line in lines:
                                    if "USER:" in line or "USER REQUEST" in line or "TD목표" in line:
                                        out.write(f"[{f}] {line.strip()[:150]}\n")
                    except Exception as e:
                        out.write(f"Error {path}: {e}\n")

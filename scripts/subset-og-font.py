# ---------------------------------------------------------------------------
# Header: OG 이미지용 한글 글꼴 잘라내기.
#
# next/og는 woff2를 못 읽고, Pretendard 전체 OTF는 1.5MB가 넘는다. 이미지에 쓰는
# 글자는 수십 개뿐이라 그것만 남긴다(수십 KB). 문구는 lib/og-copy.ts에서 읽는다 —
# 여기에 문구를 따로 적으면 둘이 어긋난다.
#
#   pip install fonttools
#   python3 scripts/subset-og-font.py <Pretendard-Bold.otf가 있는 폴더>
#
# Pretendard OTF는 npm 패키지 pretendard의 dist/public/static/ 에 있다.
# ---------------------------------------------------------------------------
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if not src_dir or not (src_dir / "Pretendard-Bold.otf").exists():
    sys.exit("Pretendard-Bold.otf가 있는 폴더를 인자로 주세요.")

copy = (ROOT / "lib/og-copy.ts").read_text(encoding="utf-8")

def const(name: str) -> str:
    m = re.search(rf'export const {name} = "([^"]*)"', copy)
    if not m:
        sys.exit(f"lib/og-copy.ts에서 {name}을 찾지 못했어요.")
    return m.group(1)

chips = re.findall(r'"([^"]+)"', re.search(r"OG_CHIPS = \[([^\]]*)\]", copy).group(1))
jobs = {
    "Bold": "Tiera" + const("OG_TITLE"),
    "Medium": const("OG_SUBTITLE") + "".join(chips),
}

out = ROOT / "assets/og"
out.mkdir(parents=True, exist_ok=True)
manifest = {}
for weight, text in jobs.items():
    chars = "".join(sorted(set(text)))
    target = out / f"Pretendard-{weight}.subset.otf"
    subprocess.run(
        ["pyftsubset", str(src_dir / f"Pretendard-{weight}.otf"),
         f"--text={chars}", f"--output-file={target}", "--layout-features=*"],
        check=True,
    )
    manifest[weight] = chars
    print(f"{target.name}: {len(chars)}자, {target.stat().st_size // 1024}KB")

# 어떤 글자가 들어 있는지 옆에 남겨 둔다. 테스트가 이걸 보고 빠진 글자를 찾는다.
(out / "chars.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
# Footer: scripts/subset-og-font.py

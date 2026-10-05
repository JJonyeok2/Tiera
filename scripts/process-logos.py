# ---------------------------------------------------------------------------
# Header: 도구 로고 다듬기 — 크롭·정사각형·96px·팔레트 압축.
#
#   pip install pillow cairosvg
#   python3 scripts/process-logos.py <원본 폴더>
#
# 원본 폴더에는 <slug>.png|jpg|ico|svg 가 들어 있어야 한다. 결과는 public/logos/<slug>.png.
#
# 원본은 어디서 왔나 (2026-09-26):
#   각 서비스가 자기 사이트에 공개해 둔 파비콘·앱 아이콘이다. 이 작업 환경에서
#   서비스 도메인으로 직접 요청이 막혀 있어서, 대부분은 구글 파비콘 변환 서비스
#   (t1.gstatic.com/faviconV2 — 사이트가 선언한 아이콘을 받아 크기만 맞춰 준다)로
#   받았다. 한 번 받아 우리 서버에 두는 것이라 방문자 요청이 구글로 가지는 않는다.
#   해상도가 낮았던 것은 공식 페이지에서 직접 받았다:
#     claude, claude-code  claude.ai/apple-touch-icon.png (180px)
#     scispace             scispace.com/favicon.ico (실제로는 SVG)
#     heygen               헤더 로고(heygen-logo.png)에서 다이아몬드 마크만 크롭
#     github-copilot       Copilot 페이지의 octicon-copilot SVG (Primer Octicons)
#     google-flow          flow.google.com이 선언한 flow_favicon_b.png
#     zaemit               zaemit.kr 헤더 워드마크 SVG에서 'Z' 마크만 잘라냄 (파비콘과 같은 모양)
#   2026-10-05 추가분(wix·framer·google-ai-studio·bolt·replit·v0·base44)은 변환 서비스로
#   180~256px를 받았다.
#   clova-note는 구하지 못했다(사이트 접근 불가, 변환 서비스에도 없음) —
#   카드에서 첫 글자 타일로 나간다.
#
# **로고를 직접 그리거나 고치지 않는다.** 여기서 하는 건 여백 자르기와 크기
# 맞추기뿐이다. 색·모양은 원본 그대로다.
#
# 왜 96px인가: 카드 타일이 40px, 상세가 48px이다. 레티나(2배)에서 96px이면 충분하고,
# 128px에서 줄이니 42장 합계가 240KB → 81KB가 됐다(홈에서 전부 한 번에 뜬다).
# ---------------------------------------------------------------------------
import glob
import os
import sys

from PIL import Image

SIZE = 96
PAD = 13  # 글리프형 여백(px)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "logos")


def load(path: str) -> Image.Image:
    if path.endswith(".svg"):
        import io

        import cairosvg

        return Image.open(io.BytesIO(cairosvg.svg2png(url=path, output_width=256))).convert("RGBA")
    return Image.open(path).convert("RGBA")


def process(im: Image.Image) -> tuple[Image.Image, str]:
    # 1) 투명 여백을 잘라낸다.
    alpha = im.split()[3].point(lambda a: 255 if a > 8 else 0)
    im = im.crop(alpha.getbbox() or (0, 0, *im.size))
    w, h = im.size
    opaque = im.split()[3].point(lambda a: 255 if a > 200 else 0).histogram()[255] / (w * h)

    # 2-a) 타일형 — 자체 배경이 있는 앱 아이콘. 정사각형으로 꽉 채운다.
    if opaque >= 0.85 and 0.8 <= w / h <= 1.25:
        s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
        return im.resize((SIZE, SIZE), Image.LANCZOS), "tile"

    # 2-b) 글리프형 — 모양만 있는 아이콘. 가운데 두고 여백을 준다.
    #      화면에서는 흰 타일 위에 놓인다(ToolCard.tsx).
    inner = SIZE - PAD * 2
    scale = inner / max(w, h)
    g = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(g, ((SIZE - g.width) // 2, (SIZE - g.height) // 2), g)
    return out, "glyph"


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("원본 폴더를 인자로 주세요.")
    os.makedirs(OUT, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(sys.argv[1], "*"))):
        slug = os.path.basename(path).rsplit(".", 1)[0]
        out, kind = process(load(path))
        # 아이콘은 색 수가 적어서 256색 팔레트로 줄여도 눈으로 구분이 안 된다.
        out = out.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        out.save(os.path.join(OUT, f"{slug}.png"), optimize=True)
        print(f"{slug:18} {kind}")


if __name__ == "__main__":
    main()
# Footer: scripts/process-logos.py

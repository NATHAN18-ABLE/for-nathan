"""슬라이드용 사진 가공: 흑백 + 지정 비율로 자르기(초점 기준) + 선택적으로 둥근 모서리.
usage: python3 -I tools/prep_photos.py   (photos/src → photos/out)
"""
import os
from PIL import Image, ImageDraw, ImageOps, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, "photos", "src"), os.path.join(ROOT, "photos", "out")
DPI = 220

# 이름: (원본, 가로 인치, 세로 인치, 초점 x, 초점 y, 둥근 모서리 인치)
JOBS = {
    "A_card": ("A_portrait.jpg", 2.75, 2.75 * 1.586, 0.5, 0.42, 0.12),
    "B_tile": ("B_applepay.png", 1.85, 2.3, 0.5, 0.5, 0),
    "C_tile": ("C_smcc.jpg", 1.85, 2.3, 0.3, 0.5, 0),
    "D_tile": ("D_llm.jpg", 1.85, 2.3, 0.62, 0.5, 0),
    "E_tile": ("E_snu.jpg", 1.85, 2.3, 0.13, 0.5, 0),
    "B_panel": ("B_applepay.png", 3.4, 4.6, 0.5, 0.5, 0),
    "D_panel": ("D_llm.jpg", 5.4, 4.6, 0.6, 0.5, 0),
    "E_panel": ("E_snu.jpg", 4.3, 4.6, 0.32, 0.5, 0),
}


def crop_to(im, ratio, fx, fy):
    w, h = im.size
    if w / h > ratio:
        nw, nh = int(h * ratio), h
    else:
        nw, nh = w, int(w / ratio)
    x = min(max(int(fx * w - nw / 2), 0), w - nw)
    y = min(max(int(fy * h - nh / 2), 0), h - nh)
    return im.crop((x, y, x + nw, y + nh))


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, (src, wi, hi, fx, fy, r) in JOBS.items():
        path = os.path.join(SRC, src)
        if not os.path.exists(path):
            continue
        im = Image.open(path).convert("RGB")
        im = crop_to(im, wi / hi, fx, fy)
        im = im.resize((round(wi * DPI), round(hi * DPI)), Image.LANCZOS)
        g = ImageOps.grayscale(im)
        g = ImageOps.autocontrast(g, cutoff=1)
        g = ImageEnhance.Contrast(g).enhance(1.05)
        out = g.convert("RGB")
        if r:
            mask = Image.new("L", out.size, 0)
            ImageDraw.Draw(mask).rounded_rectangle([0, 0, out.size[0] - 1, out.size[1] - 1], radius=round(r * DPI), fill=255)
            out = out.convert("RGBA")
            out.putalpha(mask)
            out.save(os.path.join(OUT, name + ".png"))
        else:
            out.save(os.path.join(OUT, name + ".jpg"), quality=88)
        print(name, out.size)


if __name__ == "__main__":
    main()

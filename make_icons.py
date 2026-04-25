"""Render the Diamond Check icon to PNG/ICO at multiple sizes using Pillow.
No external SVG renderer needed - we draw primitives directly so output is crisp at every size."""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).parent

# Brand gradient endpoints (top-left -> bottom-right): indigo-500 -> indigo-700
C1 = (99, 102, 241)   # #6366f1
C2 = (67, 56, 202)    # #4338ca
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def render(size: int, maskable: bool = False) -> Image.Image:
    """Render icon at given pixel size. If maskable, fills entire canvas (no rounded corners)
    and shrinks artwork into the safe zone (PWA maskable icon spec: 80% safe zone)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Diagonal gradient background (drawn line by line along the anti-diagonal).
    # For each pixel, t = (x + y) / (2 * (size - 1)).
    # Render gradient by horizontal strips for speed (still acceptable up to 512).
    # Use per-pixel via a generated image.
    grad = Image.new("RGB", (size, size))
    px = grad.load()
    denom = max(1, 2 * (size - 1))
    for y in range(size):
        for x in range(size):
            t = (x + y) / denom
            px[x, y] = lerp(C1, C2, t)

    if maskable:
        # Full bleed background, no rounding.
        bg_mask = Image.new("L", (size, size), 255)
    else:
        # Rounded square mask. Corner radius scales like 14/64.
        radius = max(1, round(size * 14 / 64))
        bg_mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(bg_mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)

    img.paste(grad, (0, 0), bg_mask)

    # Foreground artwork is laid out in a 64x64 design grid, then scaled.
    # If maskable, shrink artwork to fit ~80% safe zone, centered.
    scale = size / 64
    if maskable:
        scale *= 0.78  # safe zone shrink
        offset = (size - 64 * scale) / 2
    else:
        offset = 0

    def P(x, y):
        return (offset + x * scale, offset + y * scale)

    fg = ImageDraw.Draw(img)

    # Diamond outline (faint white). Width scales.
    diamond_w = max(1, round(2.5 * scale))
    diamond = [P(32, 12), P(52, 32), P(32, 52), P(12, 32)]
    # Pillow has no per-stroke opacity, so blend by drawing onto an overlay.
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ovd = ImageDraw.Draw(overlay)
    ovd.line(diamond + [diamond[0]], fill=(255, 255, 255, round(255 * 0.35)), width=diamond_w, joint="curve")
    img.alpha_composite(overlay)

    # Checkmark (solid white, rounded caps/joins).
    check_w = max(2, round(4.5 * scale))
    check_pts = [P(21, 33), P(29, 41), P(44, 24)]
    fg.line(check_pts, fill=WHITE, width=check_w, joint="curve")
    # Round the caps by drawing circles at each endpoint and the joint.
    r = check_w / 2
    for pt in check_pts:
        fg.ellipse((pt[0] - r, pt[1] - r, pt[0] + r, pt[1] + r), fill=WHITE)

    return img


def main():
    sizes = [16, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512]
    pngs = {}
    for s in sizes:
        im = render(s)
        out = OUT / f"icon-{s}.png"
        im.save(out, "PNG", optimize=True)
        pngs[s] = im
        print(f"wrote {out.name}")

    # Apple touch icon (180x180, no transparency).
    apple = Image.new("RGB", (180, 180), (255, 255, 255))
    apple.paste(pngs[180], (0, 0), pngs[180])
    apple.save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    print("wrote apple-touch-icon.png")

    # Maskable icon for PWA (512).
    mask = render(512, maskable=True)
    mask.save(OUT / "icon-maskable-512.png", "PNG", optimize=True)
    print("wrote icon-maskable-512.png")

    # Multi-resolution .ico (replace pmp.ico).
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    pngs[256].save(OUT / "pmp.ico", format="ICO", sizes=ico_sizes)
    print("wrote pmp.ico (multi-res)")


if __name__ == "__main__":
    main()

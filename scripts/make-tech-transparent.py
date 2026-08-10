"""
Tech.png ships as RGB with no alpha and a solid pure-black field, so it renders
as a black rectangle in the hero flip container. The artwork is neon glow on
black, so alpha can be derived from luminance: pure black becomes transparent,
the glow keeps its natural falloff, and lit pixels stay fully opaque.

Writes public/images/landing/Tech_transparent.png. The original is not modified.
Re-run only if Tech.png is replaced.
"""

import struct
import zlib
from pathlib import Path

SRC = Path("public/images/landing/Tech.png")
DST = Path("public/images/landing/Tech_transparent.png")

# Luminance below LO is treated as background, above HI as solid artwork,
# in between it ramps so antialiased/glow edges stay soft.
LO, HI = 6, 44


def decode(path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a png"
    pos, idat = 8, bytearray()
    width = height = bit_depth = colour_type = None

    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        ctype = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + length]
        if ctype == b"IHDR":
            width, height, bit_depth, colour_type = struct.unpack(">IIBB", chunk[:10])
        elif ctype == b"IDAT":
            idat += chunk
        elif ctype == b"IEND":
            break
        pos += 12 + length

    assert bit_depth == 8, f"expected 8-bit, got {bit_depth}"
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour_type]
    raw = zlib.decompress(bytes(idat))

    stride = width * channels
    rows = []
    prev = bytearray(stride)
    i = 0
    for _ in range(height):
        f = raw[i]
        i += 1
        line = bytearray(raw[i : i + stride])
        i += stride

        if f == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x - channels]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                left = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                b = prev[x]
                c = prev[x - channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 255

        rows.append(line)
        prev = line

    return width, height, channels, rows


def encode(path, width, height, rows_rgba):
    def chunk(tag, payload):
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    body = bytearray()
    for row in rows_rgba:
        body.append(0)  # filter: none
        body += row

    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(body), 9))
        + chunk(b"IEND", b"")
    )


def main():
    width, height, channels, rows = decode(SRC)
    print(f"source {width}x{height} channels={channels}")

    # alpha lookup keyed on max(r,g,b)
    lut = bytes(
        0 if v <= LO else 255 if v >= HI else round((v - LO) * 255 / (HI - LO))
        for v in range(256)
    )

    out = []
    cleared = 0
    for row in rows:
        rgba = bytearray(width * 4)
        for x in range(width):
            s = x * channels
            r, g, b = row[s], row[s + 1], row[s + 2]
            a = lut[r if r >= g and r >= b else (g if g >= b else b)]
            d = x * 4
            rgba[d] = r
            rgba[d + 1] = g
            rgba[d + 2] = b
            rgba[d + 3] = a
            if a == 0:
                cleared += 1
        out.append(rgba)

    encode(DST, width, height, out)
    total = width * height
    print(f"wrote {DST}  fully transparent pixels: {cleared/total:.1%}")


if __name__ == "__main__":
    main()

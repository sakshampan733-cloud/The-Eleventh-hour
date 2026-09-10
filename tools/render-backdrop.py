"""Render the backdrop: a lit iridescent sphere in the corner, haze around it.

Pure stdlib. The sphere is shaded properly — surface normal, diffuse term,
Fresnel rim, specular highlight — and the shading value is then mapped
through the reference's palette rather than being painted grey. That is
why it reads as a lit object instead of a gradient: the colour follows the
geometry.
"""
import math, zlib, struct, random

W, H = 660, 1180                       # upscaled by the browser; it is soft
CX, CY, R = W*0.94, H*0.20, W*1.02     # upper-right, mostly off-frame

# the reference's ramp, dark -> lit
# Darker throughout, with the oxblood the reference has between the green
# body and the gold rim. More stops in the upper range so the lit band
# gradates instead of stepping.
RAMP = [
    (0.00, (0x02,0x05,0x04)),
    (0.14, (0x07,0x13,0x0C)),
    (0.28, (0x0F,0x24,0x17)),
    (0.42, (0x1B,0x38,0x22)),
    (0.54, (0x2A,0x48,0x2A)),
    (0.60, (0x4A,0x40,0x22)),
    (0.66, (0x77,0x36,0x1D)),
    (0.72, (0xA6,0x56,0x1E)),
    (0.79, (0xCE,0x86,0x26)),
    (0.86, (0xE4,0xAC,0x42)),
    (0.93, (0xF0,0xCA,0x74)),
    (1.00, (0xF6,0xDE,0xA6)),
]
def ramp(t):
    t = 0.0 if t < 0 else (1.0 if t > 1 else t)
    for i in range(len(RAMP)-1):
        a, ca = RAMP[i]; b, cb = RAMP[i+1]
        if t <= b:
            f = 0 if b == a else (t-a)/(b-a)
            f = f*f*(3-2*f)                      # smoothstep between stops
            return tuple(ca[k] + (cb[k]-ca[k])*f for k in range(3))
    return RAMP[-1][1]

# value noise -> fbm, for the fluid banding across the surface
random.seed(7)
G = 256
grid = [[random.random() for _ in range(G)] for _ in range(G)]
def vnoise(x, y):
    xi, yi = int(x) % G, int(y) % G
    xf, yf = x-int(x), y-int(y)
    u = xf*xf*(3-2*xf); v = yf*yf*(3-2*yf)
    a = grid[yi][xi];            b = grid[yi][(xi+1)%G]
    c = grid[(yi+1)%G][xi];      d = grid[(yi+1)%G][(xi+1)%G]
    return (a*(1-u)+b*u)*(1-v) + (c*(1-u)+d*u)*v
def fbm(x, y, oct=4):
    t, amp, f = 0.0, 0.5, 1.0
    for _ in range(oct):
        t += vnoise(x*f, y*f)*amp
        amp *= 0.5; f *= 2.0
    return t

LX, LY, LZ = -0.42, -0.72, 0.55        # light from upper-left
ln = math.sqrt(LX*LX+LY*LY+LZ*LZ); LX, LY, LZ = LX/ln, LY/ln, LZ/ln

rows = []
for py in range(H):
    row = bytearray()
    for px in range(W):
        dx, dy = px-CX, py-CY
        d2 = dx*dx + dy*dy
        if d2 < R*R:
            nz = math.sqrt(R*R - d2)
            nx, ny = dx/R, dy/R; nzn = nz/R
            diff = nx*LX + ny*LY + nzn*LZ
            diff = 0.0 if diff < 0 else diff
            fres = (1.0 - nzn)
            fres = fres*fres*fres
            # blinn-phong highlight
            hx, hy, hz = LX, LY, LZ+1.0
            hn = math.sqrt(hx*hx+hy*hy+hz*hz)
            spec = nx*hx/hn + ny*hy/hn + nzn*hz/hn
            spec = 0.0 if spec < 0 else spec**64
            # the fluid: noise bands riding the surface, densest near the rim
            n = fbm(px*0.0075 + nzn*2.2, py*0.0075 - nzn*1.6, 4)
            # The noise has to fade out where the light is strongest. Left uniform it
            # chops the molten band into flecks; the reference's lit edge is smooth
            # and the fluid variation lives in the body and the shadow.
            t = diff*0.80 + fres*0.30 + (n-0.5)*0.20*(1.0-diff*diff*0.96) - 0.03
            r, g, b = ramp(t)
            r += spec*86; g += spec*72; b += spec*44
        else:
            # haze: light thrown off the sphere into the room
            dist = math.sqrt(d2) - R
            glow = math.exp(-dist/(W*0.30))
            n = fbm(px*0.0055, py*0.0055, 3)
            t = glow*0.30 + (n-0.5)*0.12*glow
            r, g, b = ramp(t)
            # a second, cooler pool low-left so the frame is never empty
            ddx, ddy = px-W*0.02, py-H*0.92
            g2 = math.exp(-math.sqrt(ddx*ddx+ddy*ddy)/(W*0.52))
            r += g2*40; g += g2*15; b += g2*9
        row += bytes((min(255,max(0,int(r))), min(255,max(0,int(g))), min(255,max(0,int(b)))))
    rows.append(row)

raw = b''.join(b'\x00' + bytes(r) for r in rows)
def chunk(tag, data):
    return (struct.pack('>I', len(data)) + tag + data +
            struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))
png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(raw, 9))
       + chunk(b'IEND', b''))
open('field.png','wb').write(png)
print("  rendered %dx%d  %.0f KB" % (W, H, len(png)/1024))

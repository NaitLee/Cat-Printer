
/// <reference path="./image.d.ts" />

export function monoGrayscale(rgba: Uint32Array, brightness: i32, alpha_as_white: bool): Uint8ClampedArray {
    const mono = new Uint8ClampedArray(rgba.length);
    let r: f32 = 0.0, g: f32 = 0.0, b: f32 = 0.0, a: f32 = 0.0, m: f32 = 0.0, n: i32 = 0;
    for (let i: i32 = 0; i < mono.length; ++i) {
        n = rgba[i];
        // little endian
        r = <f32>(n & 0xff), g = <f32>(n >> 8 & 0xff), b = <f32>(n >> 16 & 0xff);
        a = <f32>(n >> 24 & 0xff) / 0xff;
        if (a < 1 && alpha_as_white) {
            a = 1 - a;
            r += (0xff - r) * a;
            g += (0xff - g) * a;
            b += (0xff - b) * a;
        } else { r *= a; g *= a; b *= a; }
        m = r * 0.2125 + g * 0.7154 + b * 0.0721;
        m += <f32>(brightness - 0x80) * (<f32>1 - m / 0xff) * (m / 0xff) * 2;
        mono[i] = <u8>m;
    }
    return mono;
}

/** Note: returns a `Uint32Array` */
export function monoToRgba(mono: Uint8ClampedArray): Uint32Array {
    const rgba = new Uint32Array(mono.length);
    for (let i: i32 = 0; i < mono.length; ++i) {
        // little endian
        rgba[i] = 0xff000000 | (mono[i] << 16) | (mono[i] << 8) | mono[i];
    }
    return rgba;
}

export function monoDirect(mono: Uint8ClampedArray, _w: i32, _h:i32): Uint8ClampedArray {
    for (let i: i32 = 0; i < mono.length; ++i) {
        mono[i] = mono[i] > 0x80 ? 0xff : 0x00;
    }
    return mono;
}

export function monoSteinberg(mono: Uint8ClampedArray, w: i32, h: i32): Uint8ClampedArray {
    let p: i32 = 0, m: i32, n: i32, o: i32;
    for (let j: i32 = 0; j < h; ++j) {
        for (let i: i32 = 0; i < w; ++i) {
            m = mono[p];
            n = mono[p] > 0x80 ? 0xff : 0x00;
            o = m - n;
            mono[p] = n;
            if (i >= 0 && i < w - 1 && j >= 0 && j < h)
                mono[p + 1] += <u8>(o * 7 / 16);
            if (i >= 1 && i < w && j >= 0 && j < h - 1)
                mono[p + w - 1] += <u8>(o * 3 / 16);
            if (i >= 0 && i < w && j >= 0 && j < h - 1)
                mono[p + w] += <u8>(o * 5 / 16);
            if (i >= 0 && i < w - 1 && j >= 0 && j < h - 1)
                mono[p + w + 1] += <u8>(o * 1 / 16);
            ++p;
        }
    }
    return mono;
}

export function monoHalftone(mono: Uint8ClampedArray, w: i32, h: i32): Uint8ClampedArray {
    const spot: i32 = 4;
    const spot_h: i32 = spot / 2 + 1;
    // const spot_d: i32 = spot * 2;
    const spot_s: i32 = spot * spot;
    let i: i32, j: i32, x: i32, y: i32, o: f64 = 0.0;
    for (j = 0; j < h - spot; j += spot) {
        for (i = 0; i < w - spot; i += spot) {
            for (x = 0; x < spot; ++x)
                for (y = 0; y < spot; ++y)
                    o += mono[(j + y) * w + i + x];
            o = (1 - o / spot_s / 0xff) * spot;
            for (x = 0; x < spot; ++x)
                for (y = 0; y < spot; ++y) {
                    mono[(j + y) * w + i + x] = Math.abs(x - spot_h) >= o || Math.abs(y - spot_h) >= o ? 0xff : 0x00;
                    // mono[(j + y) * w + i + x] = Math.abs(x - spot_h) + Math.abs(y - spot_h) >= o ? 0xff : 0x00;
                }
        }
        for (; i < w; ++i) mono[j * w + i] = 0xff;
    }
    for (; j < h; ++j)
        for (i = 0; i < w; ++i) mono[j * w + i] = 0xff;
    return mono;
}

export function monoToPbm(data: Uint8ClampedArray): Uint8ClampedArray {
    const length: i32 = (data.length / 8) | 0;
    const result = new Uint8ClampedArray(length);
    for (let i: i32 = 0, p: i32 = 0; i < data.length; ++p) {
        result[p] = 0;
        for (let d: u8 = 0; d < 8; ++i, ++d)
            result[p] |= data[i] & (0b10000000 >> d);
        result[p] ^= 0b11111111;
    }
    return result;
}

/** Note: takes & gives `Uint32Array` */
export function rotateRgba(before: Uint32Array, w: i32, h: i32): Uint32Array {
    /**
     *       w         h
     *    o------+   +---o
     *  h |      |   |   | w
     *    +------+   |   | after
     *     before    +---+
     */
    const after = new Uint32Array(before.length);
    for (let j: i32 = 0; j < h; j++) {
        for (let i: i32 = 0; i < w; i++) {
            after[j * w + i] = before[(w - i - 1) * h + j];
        }
    }
    return after;
}

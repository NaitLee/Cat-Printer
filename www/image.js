// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function monoGrayscale(rgba, brightness, alpha_as_white) {
    const mono = new Uint8ClampedArray(rgba.length);
    let r = 0.0, g = 0.0, b = 0.0, a = 0.0, m = 0.0, n = 0;
    for(let i = 0; i < mono.length; ++i){
        n = rgba[i];
        r = n & 0xff, g = n >> 8 & 0xff, b = n >> 16 & 0xff;
        a = (n >> 24 & 0xff) / 0xff;
        if (a < 1 && alpha_as_white) {
            a = 1 - a;
            r += (0xff - r) * a;
            g += (0xff - g) * a;
            b += (0xff - b) * a;
        } else {
            r *= a;
            g *= a;
            b *= a;
        }
        m = r * 0.2125 + g * 0.7154 + b * 0.0721;
        m += (brightness - 0x80) * (1 - m / 0xff) * (m / 0xff) * 2;
        mono[i] = m;
    }
    return mono;
}
function monoToRgba(mono) {
    const rgba = new Uint32Array(mono.length);
    for(let i = 0; i < mono.length; ++i){
        rgba[i] = 0xff000000 | mono[i] << 16 | mono[i] << 8 | mono[i];
    }
    return rgba;
}
function monoDirect(mono, _w, _h) {
    for(let i = 0; i < mono.length; ++i){
        mono[i] = mono[i] > 0x80 ? 0xff : 0x00;
    }
    return mono;
}
function monoSteinberg(mono, w, h) {
    let p = 0, m, n, o;
    for(let j = 0; j < h; ++j){
        for(let i = 0; i < w; ++i){
            m = mono[p];
            n = mono[p] > 0x80 ? 0xff : 0x00;
            o = m - n;
            mono[p] = n;
            if (i >= 0 && i < w - 1 && j >= 0 && j < h) mono[p + 1] += o * 7 / 16;
            if (i >= 1 && i < w && j >= 0 && j < h - 1) mono[p + w - 1] += o * 3 / 16;
            if (i >= 0 && i < w && j >= 0 && j < h - 1) mono[p + w] += o * 5 / 16;
            if (i >= 0 && i < w - 1 && j >= 0 && j < h - 1) mono[p + w + 1] += o * 1 / 16;
            ++p;
        }
    }
    return mono;
}
function monoHalftone(mono, w, h) {
    const spot = 4;
    const spot_h = 4 / 2 + 1;
    const spot_s = 4 * 4;
    let i, j, x, y, o = 0.0;
    for(j = 0; j < h - 4; j += spot){
        for(i = 0; i < w - 4; i += spot){
            for(x = 0; x < 4; ++x)for(y = 0; y < 4; ++y)o += mono[(j + y) * w + i + x];
            o = (1 - o / spot_s / 0xff) * spot;
            for(x = 0; x < 4; ++x)for(y = 0; y < 4; ++y){
                mono[(j + y) * w + i + x] = Math.abs(x - spot_h) >= o || Math.abs(y - spot_h) >= o ? 0xff : 0x00;
            }
        }
        for(; i < w; ++i)mono[j * w + i] = 0xff;
    }
    for(; j < h; ++j)for(i = 0; i < w; ++i)mono[j * w + i] = 0xff;
    return mono;
}
function monoToPbm(data) {
    const length = data.length / 8 | 0;
    const result = new Uint8ClampedArray(length);
    for(let i = 0, p = 0; i < data.length; ++p){
        result[p] = 0;
        for(let d = 0; d < 8; ++i, ++d)result[p] |= data[i] & 0b10000000 >> d;
        result[p] ^= 0b11111111;
    }
    return result;
}
function rotateRgba(before, w, h) {
    const after = new Uint32Array(before.length);
    for(let j = 0; j < h; j++){
        for(let i = 0; i < w; i++){
            after[j * w + i] = before[(w - i - 1) * h + j];
        }
    }
    return after;
}
// export { monoGrayscale as monoGrayscale };
// export { monoToRgba as monoToRgba };
// export { monoDirect as monoDirect };
// export { monoSteinberg as monoSteinberg };
// export { monoHalftone as monoHalftone };
// export { monoToPbm as monoToPbm };
// export { rotateRgba as rotateRgba };

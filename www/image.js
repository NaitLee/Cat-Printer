
/**
 * Convert colored image to grayscale.
 * @param {Uint8ClampedArray} image_data `data` property of an ImageData instance,  
 * i.e. `canvas.getContext('2d').getImageData(...).data`  
 * @param {Uint8ClampedArray} mono_data an `Uint8ClampedArray` that have the size `w * h`  
 * i.e. `image_data.length / 4`  
 * The result data will be here, as a 8-bit grayscale image data.
 * @param {number} w width of image
 * @param {number} h height of image
 * @param {number} t brightness, historically "threshold"
 * @param {boolean} transparencyAsWhite whether render opacity as white rather than black
 */
function monoGrayscale(image_data, mono_data, w, h, t, transparencyAsWhite) {
    let p, q, r, g, b, a, m;
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            p = j * w + i;
            q = p * 4;
            [r, g, b, a] = image_data.slice(q, q + 4);
            a /= 255;
            if (a < 1 && transparencyAsWhite) {
                a = 1 - a;
                r += (255 - r) * a;
                g += (255 - g) * a;
                b += (255 - b) * a;
            }
            else { r *= a; g *= a; b *= a; }
            m = Math.floor(r * 0.2125 + g * 0.7154 + b * 0.0721);
            m += (t - 128) * (1 - m / 255) * (m / 255) * 2;
            mono_data[p] = m;
        }
    }
}

/**
 * The most simple monochrome algorithm, any value bigger than threshold is white, otherwise black.
 * @param {Uint8ClampedArray} data the grayscale data, mentioned in `monoGrayscale`. **will be modified in-place**
 * @param {number} w width of image
 * @param {number} h height of image
 */
function monoDirect(data, w, h) {
    let p, i, j;
    for (j = 0; j < h; j++) {
        for (i = 0; i < w; i++) {
            p = j * w + i;
            data[p] = data[p] > 128 ? 255 : 0;
        }
    }
}

/**
 * The widely used Floyd Steinberg algorithm, the most "natual" one.
 * @param {Uint8ClampedArray} data the grayscale data, mentioned in `monoGrayscale`. **will be modified in-place**
 * @param {number} w width of image
 * @param {number} h height of image
 */
function monoSteinberg(data, w, h) {
    let p, m, n, o, i, j;
    function adjust(x, y, delta) {
        if (
            x < 0 || x >= w ||
            y < 0 || y >= h
        ) return;
        p = y * w + x;
        data[p] += delta;
    }
    for (j = 0; j < h; j++) {
        for (i = 0; i < w; i++) {
            p = j * w + i;
            m = data[p];
            n = m > 128 ? 255 : 0;
            o = m - n;
            data[p] = n;
            adjust(i + 1, j    , o * 7 / 16);
            adjust(i - 1, j + 1, o * 3 / 16);
            adjust(i    , j + 1, o * 5 / 16);
            adjust(i + 1, j + 1, o * 1 / 16);
        }
    }
}

/**
 * (Work in Progress...)
 */
function monoHalftone(data, w, h, t) {}

/**
 * Convert a monochrome image data to PBM mono image file data.  
 * Returns a Blob containing the file data.
 * @param {Uint8ClampedArray} data the data that have a size of `w * h`
 * @param {number} w width of image
 * @param {number} h height of image
 * @returns {Blob}
 */
function mono2pbm(data, w, h) {
    let result = new Uint8ClampedArray(data.length / 8);
    let slice, p, i;
    for (i = 0; i < result.length; i++) {
        p = i * 8;
        slice = data.slice(p, p + 8);
        // Merge 8 bytes to 1 byte, and negate the bits
        // assuming there's only 255 (0b11111111) or 0 (0b00000000) in the data
        result[i] = (
            slice[0] & 0b10000000 |
            slice[1] & 0b01000000 |
            slice[2] & 0b00100000 |
            slice[3] & 0b00010000 |
            slice[4] & 0b00001000 |
            slice[5] & 0b00000100 |
            slice[6] & 0b00000010 |
            slice[7] & 0b00000001
        ) ^ 0b11111111;
    }
    let pbm_data = new Blob([`P4\n${w} ${h}\n`, result]);
    return pbm_data;
}

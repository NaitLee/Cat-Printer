export declare function monoGrayscale(rgba: Uint32Array, brightness: i32, alpha_as_white: bool): Uint8ClampedArray;
/** Note: returns a `Uint32Array` */
export declare function monoToRgba(mono: Uint8ClampedArray): Uint32Array;
export declare function monoDirect(mono: Uint8ClampedArray, w: i32, h: i32): Uint8ClampedArray;
export declare function monoSteinberg(mono: Uint8ClampedArray, w: i32, h: i32): Uint8ClampedArray;
export declare function monoHalftone(mono: Uint8ClampedArray, w: i32, h: i32): Uint8ClampedArray;
export declare function monoToPbm(data: Uint8ClampedArray): Uint8ClampedArray;
/** Note: takes & gives `Uint32Array` */
export declare function rotateRgba(before: Uint32Array, w: i32, h: i32): Uint32Array;

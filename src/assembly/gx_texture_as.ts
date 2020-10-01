// http://www.mindcontrol.org/~hplus/graphics/expand-bits.html
@inline
function expand3to8(n: u8): u8 {
    return (n << (8 - 3)) | (n << (8 - 6)) | (n >>> (9 - 8));
}

@inline
function expand4to8(n: u8): u8 {
    return (n << 4) | n;
}

@inline
function expand5to8(n: u8): u8 {
    return (n << (8 - 5)) | (n >>> (10 - 8));
}

@inline
function expand6to8(n: u8): u8 {
    return (n << (8 - 6)) | (n >>> (12 - 8));
}

@inline
function get(offs: u32): u8 {
    return load<u8>(offs);
}

@inline
function set(offs: u32, b: u8): void {
    store<u8>(offs, b);
}

@inline
function get32(offs: u32): u32 {
    return load<u32>(offs);
}

@inline
function set32(offs: u32, u: u32): void {
    store<u32>(offs, u);
}

@inline
function get16be(offs: u32): u16 {
    return bswap(load<u16>(offs));
}

export function decode_I4(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 8) {
        for (let xx: u32 = 0; xx < w; xx += 8) {
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++, srcOffs++) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let ii: u8 = get(pSrc + (srcOffs >>> 1));
                    let i4: u8 = ii >>> ((srcOffs & 1) ? 0 : 4) & 0x0F;
                    let i: u8 = expand4to8(i4);
                    set32(dstOffs, <u32>i * 0x01010101);
                }
            }
        }
    }
}

export function decode_I8(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 4) {
        for (let xx: u32 = 0; xx < w; xx += 8) {
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 8; x++, srcOffs++) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let i = get(pSrc + srcOffs);
                    set32(dstOffs, <u32>i * 0x01010101);
                }
            }
        }
    }
}

export function decode_IA4(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 4) {
        for (let xx: u32 = 0; xx < w; xx += 8) {
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 8; x++, srcOffs++) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let ia: u8 = get(pSrc + srcOffs);
                    let a: u8 = expand4to8(ia >>> 4);
                    let i: u8 = expand4to8(ia & 0x0F);
                    set32(dstOffs, (<u32>i * 0x00010101) | (<u32>a << 24));
                }
            }
        }
    }
}

export function decode_IA8(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 4) {
        for (let xx: u32 = 0; xx < w; xx += 4) {
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++, srcOffs += 0x02) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let a: u8 = get(pSrc + srcOffs + 0);
                    let i: u8 = get(pSrc + srcOffs + 1);
                    set32(dstOffs, (<u32>i * 0x00010101) | (<u32>a << 24));
                }
            }
        }
    }
}

export function decode_RGB565(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 4) {
        for (let xx: u32 = 0; xx < w; xx += 4) {
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++, srcOffs += 0x02) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let p: u16 = get16be(pSrc + srcOffs);
                    set(dstOffs + 0, expand5to8(<u8>(p >>> 11) & 0x1F));
                    set(dstOffs + 1, expand6to8(<u8>(p >>> 5) & 0x3F));
                    set(dstOffs + 2, expand5to8(<u8>(p & 0x1F)));
                    set(dstOffs + 3, 0xFF);
                }
            }
        }
    }
}

export function decode_RGB5A3(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 4) {
        for (let xx: u32 = 0; xx < w; xx += 4) {
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++, srcOffs += 0x02) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let p: u16 = get16be(pSrc + srcOffs);
                    if (p & 0x8000) {
                        // RGB5
                        set(dstOffs + 0, expand5to8(<u8>(p >>> 10) & 0x1F));
                        set(dstOffs + 1, expand5to8(<u8>(p >>> 5) & 0x1F));
                        set(dstOffs + 2, expand5to8(<u8>(p & 0x1F)));
                        set(dstOffs + 3, 0xFF);
                    } else {
                        // A3RGB4
                        set(dstOffs + 0, expand4to8(<u8>(p >>> 8) & 0x0F));
                        set(dstOffs + 1, expand4to8(<u8>(p >>> 4) & 0x0F));
                        set(dstOffs + 2, expand4to8(<u8>(p & 0x0F)));
                        set(dstOffs + 3, expand3to8(<u8>(p >>> 12)));
                    }
                }
            }
        }
    }
}

export function decode_RGBA8(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    let srcOffs: u32 = 0;
    for (let yy: u32 = 0; yy < h; yy += 4) {
        for (let xx: u32 = 0; xx < w; xx += 4) {
            for (let y: u32 = 0; y < 4; y++) {
                for (let x: u32 = 0; x < 4; x++, srcOffs += 0x02) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let inOffs = pSrc + srcOffs;
                    set(dstOffs + 3, get(inOffs + 0));
                    set(dstOffs + 0, get(inOffs + 1));
                }
            }
            for (let y: u32 = 0; y < 4; y++) {
                for (let x: u32 = 0; x < 4; x++, srcOffs += 0x02) {
                    if (xx + x >= w || yy + y >= h)
                        continue;
                    let dstPixel: u32 = (w * (yy + y)) + xx + x;
                    let dstOffs = pDst + dstPixel * 4;
                    let inOffs = pSrc + srcOffs;
                    set(dstOffs + 1, get(inOffs + 0));
                    set(dstOffs + 2, get(inOffs + 1));
                }
            }
        }
    }
}

// GX uses a HW approximation of 3/8 + 5/8 instead of 1/3 + 2/3.
@inline
function s3tcblend(a: u32, b: u32): u8 {
    // return (a*3 + b*5) / 8;
    let tmp = (((a << 1) + a) + ((b << 2) + b)) >>> 3;
    return <u8>tmp;
}

@inline
function halfblend(a: u32, b: u32): u8 {
    let tmp = (a + b) >>> 1;
    return <u8>tmp;
}

export function decode_CMPR(pScratch: u32, pDst: u32, pSrc: u32, w: u32, h: u32): void {
    // CMPR swizzles macroblocks to be in a 2x2 grid of UL, UR, BL, BR.
    let colorTable = pScratch;

    let srcOffs = pSrc;
    for (let yy: u32 = 0; yy < h; yy += 8) {
        let stride = yy * w;
        for (let xx: u32 = 0; xx < w; xx += 8) {
            let stride0 = stride + xx;
            for (let yb: u32 = 0; yb < 8; yb += 4) {
                let stride1 = stride0 + yb * w;
                for (let xb: u32 = 0; xb < 8; xb += 4, srcOffs += 0x08) {
                    if (xx + xb >= w || yy + yb >= h)
                        continue;

                    // CMPR difference: Big-endian color1/2
                    let color1 = get16be(srcOffs + 0x00);
                    let color2 = get16be(srcOffs + 0x02);

                    // Fill in first two colors in color table.
                    set(colorTable + 0, expand5to8(<u8> ((color1 >>> 11) & 0x1F)));
                    set(colorTable + 1, expand6to8(<u8> ((color1 >>> 5) & 0x3F)));
                    set(colorTable + 2, expand5to8(<u8> (color1 & 0x1F)));
                    set(colorTable + 3, 0xFF);

                    set(colorTable + 4, expand5to8(<u8> ((color2 >>> 11) & 0x1F)));
                    set(colorTable + 5, expand6to8(<u8> ((color2 >>> 5) & 0x3F)));
                    set(colorTable + 6, expand5to8(<u8> (color2 & 0x1F)));
                    set(colorTable + 7, 0xFF);

                    if (color1 > color2) {
                        // Predict gradients.
                        set(colorTable + 8,  s3tcblend(get(colorTable + 4), get(colorTable + 0)));
                        set(colorTable + 9,  s3tcblend(get(colorTable + 5), get(colorTable + 1)));
                        set(colorTable + 10, s3tcblend(get(colorTable + 6), get(colorTable + 2)));
                        set(colorTable + 11, 0xFF);

                        set(colorTable + 12, s3tcblend(get(colorTable + 0), get(colorTable + 4)));
                        set(colorTable + 13, s3tcblend(get(colorTable + 1), get(colorTable + 5)));
                        set(colorTable + 14, s3tcblend(get(colorTable + 2), get(colorTable + 6)));
                        set(colorTable + 15, 0xFF);
                    } else {
                        set(colorTable + 8,  halfblend(get(colorTable + 0), get(colorTable + 4)));
                        set(colorTable + 9,  halfblend(get(colorTable + 1), get(colorTable + 5)));
                        set(colorTable + 10, halfblend(get(colorTable + 2), get(colorTable + 6)));
                        set(colorTable + 11, 0xFF);

                        // CMPR difference: GX fills with an alpha 0 midway point here.
                        set(colorTable + 12, get(colorTable + 8));
                        set(colorTable + 13, get(colorTable + 9));
                        set(colorTable + 14, get(colorTable + 10));
                        set(colorTable + 15, 0x00);
                    }

                    let stride2 = stride1 + xb;
                    for (let y = 0; y < 4; y++) {
                        let bits = get(srcOffs + 0x04 + y);
                        let stride3 = stride2 + y * w;
                        for (let x = 0; x < 4; x++) {
                            let dstPx = stride3 + x;
                            let dstOffs = pDst + dstPx * 4;
                            let colorIdx = (bits >>> 6) & 0x03;
                            let colorOffset = colorTable + colorIdx * 4;
                            set32(dstOffs, get32(colorOffset));
                            bits <<= 2;
                        }
                    }
                }
            }
        }
    }
}

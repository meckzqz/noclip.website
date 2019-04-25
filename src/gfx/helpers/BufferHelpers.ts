
// Gfx version of BufferCoalescer, etc.

import ArrayBufferSlice from "../../ArrayBufferSlice";
import { assert, align } from "../../util";
import { GfxBuffer, GfxDevice, GfxBufferUsage, GfxBufferFrequencyHint } from "../platform/GfxPlatform";

export interface GfxCoalescedBuffer {
    buffer: GfxBuffer;
    wordOffset: number;
    wordCount: number;
}

export interface GfxCoalescedBuffers {
    vertexBuffer: GfxCoalescedBuffer;
    indexBuffer: GfxCoalescedBuffer;
}

export function coalesceBuffer(device: GfxDevice, usage: GfxBufferUsage, datas: ArrayBufferSlice[]): GfxCoalescedBuffer[] {
    let dataLength = 0;
    for (let i = 0; i < datas.length; i++) {
        dataLength += datas[i].byteLength;
        dataLength = align(dataLength, 4);
    }

    const wordCount = dataLength / 4;
    const buffer = device.createBuffer(wordCount, usage, GfxBufferFrequencyHint.STATIC);
    const hostAccessPass = device.createHostAccessPass();

    const coalescedBuffers: GfxCoalescedBuffer[] = [];

    let wordOffset: number = 0;
    for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        const size = align(data.byteLength, 4);
        const wordCount: number = size / 4;
        coalescedBuffers.push({ buffer, wordOffset, wordCount });
        hostAccessPass.uploadBufferData(buffer, wordOffset, data.createTypedArray(Uint8Array));
        wordOffset += wordCount;
    }

    device.submitPass(hostAccessPass);
    return coalescedBuffers;
}

export class GfxBufferCoalescer {
    public coalescedBuffers: GfxCoalescedBuffers[];
    private vertexBuffer: GfxBuffer | null = null;
    private indexBuffer: GfxBuffer | null = null;

    constructor(device: GfxDevice, vertexDatas: ArrayBufferSlice[], indexDatas: ArrayBufferSlice[]) {
        assert(vertexDatas.length === indexDatas.length);

        // Don't do anything if we have no data to care about.
        if (vertexDatas.length === 0)
            return;

        const vertexCoalescedBuffers = coalesceBuffer(device, GfxBufferUsage.VERTEX, vertexDatas);
        const indexCoalescedBuffers = coalesceBuffer(device, GfxBufferUsage.INDEX, indexDatas);

        const coalescedBuffers = [];
        for (let i = 0; i < vertexCoalescedBuffers.length; i++) {
            const vertexBuffer = vertexCoalescedBuffers[i];
            const indexBuffer = indexCoalescedBuffers[i];
            coalescedBuffers.push({ vertexBuffer, indexBuffer });
        }

        this.coalescedBuffers = coalescedBuffers;
        this.vertexBuffer = this.coalescedBuffers[0].vertexBuffer.buffer;
        this.indexBuffer = this.coalescedBuffers[0].indexBuffer.buffer;
    }

    public destroy(device: GfxDevice): void {
        if (this.vertexBuffer !== null)
            device.destroyBuffer(this.vertexBuffer);
        if (this.indexBuffer !== null)
            device.destroyBuffer(this.indexBuffer);
    }
}

export function makeStaticDataBuffer(device: GfxDevice, usage: GfxBufferUsage, data: ArrayBuffer): GfxBuffer {
    const gfxBuffer = device.createBuffer(align(data.byteLength, 4) / 4, usage, GfxBufferFrequencyHint.STATIC);
    const hostAccessPass = device.createHostAccessPass();
    hostAccessPass.uploadBufferData(gfxBuffer, 0, new Uint8Array(data));
    device.submitPass(hostAccessPass);
    return gfxBuffer;
}

export function makeStaticDataBufferFromSlice(device: GfxDevice, usage: GfxBufferUsage, data: ArrayBufferSlice): GfxBuffer {
    const gfxBuffer = device.createBuffer(align(data.byteLength, 4) / 4, usage, GfxBufferFrequencyHint.STATIC);
    const hostAccessPass = device.createHostAccessPass();
    hostAccessPass.uploadBufferData(gfxBuffer, 0, data.createTypedArray(Uint8Array));
    device.submitPass(hostAccessPass);
    return gfxBuffer;
}

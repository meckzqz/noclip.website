
import ArrayBufferSlice from "../../ArrayBufferSlice";
import { assert } from "../../util";
import { DataStream } from "./DataStream";
import * as DC_PVRT from './PVRT';

export interface AFSContainer {
    name: string;
    textures: DC_PVRT.PVR_Texture[];
}

interface AFSChunkHeader {
    offset: number;
    size: number;
}

interface AFSHeader {
    datas : AFSChunkHeader[];
}

function readDataHeaderItem(stream: DataStream) : AFSChunkHeader {
    const itemOffset = stream.readUint32();
    const itemSize = stream.readUint32();

    return { offset: itemOffset, size: itemSize };
}

function readDataHeader(stream: DataStream): AFSHeader {
    
    const magic = stream.readString(4);
    assert(magic === "AFS\0");

    const headerCount = stream.readUint32();

    const headerItems: AFSChunkHeader[] = [];
    for(let i=0; i < headerCount; ++i) {
        const item = readDataHeaderItem(stream);
        headerItems.push(item);
    }

    return {datas: headerItems};
}

const enum ChunkType {
    GBIX,
    PTEX,
}

function peekParser(stream: DataStream): ChunkType | null {
    // Verify the magic bytes without updating the internal offset
    const magic = stream.readString(4, 0);

    if (magic === "GBIX")
        return ChunkType.GBIX;
    else if (magic == "PTEX") 
        return ChunkType.PTEX;
    else
        return null;
}

export function parse(buffer: ArrayBufferSlice, name: string): AFSContainer {

    const stream = new DataStream(buffer);
 
    const header = readDataHeader(stream);
    let textures: DC_PVRT.PVR_Texture[] = [];

    for (let i=0; i<header.datas.length; ++i) {

        const textureBlobOffset = header.datas[i].offset;
        const textureBlobSize = header.datas[i].size;
        const textureBlobEnd = textureBlobOffset + textureBlobSize;

        stream.offs = textureBlobOffset;

        if (peekParser(stream) === ChunkType.PTEX) {
            // todo: parse initial ptex chunk
            stream.offs += 4096;
        }

        let blobIndex = 0;

        while (stream.offs < textureBlobEnd) {
            // Align current file offset to 32-bits
            stream.offs = (stream.offs + 31) & ~31;

            if (peekParser(stream) !== ChunkType.GBIX)
                break;
        
            const uniqueName = `${name}_${i}_${blobIndex}`;

            console.log(`parsing ${uniqueName} at ${stream.offs}`);
            ++blobIndex;

            try {
                const texture = DC_PVRT.parseFromStream(stream, uniqueName);
                textures.push(texture);
            } catch (e) {
                console.warn(`Failed to parse ${uniqueName}:`, e);
            }
        }
    }

    return {name, textures};
}

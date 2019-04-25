
import { mat4, vec3 } from 'gl-matrix';

import ArrayBufferSlice from '../ArrayBufferSlice';
import { nArray, assert } from '../util';
import { MaterialParams, PacketParams, GXTextureHolder, GXShapeHelperGfx, GXRenderHelperGfx, GXMaterialHelperGfx, ColorKind, ub_MaterialParams } from '../gx/gx_render';

import { MREA, Material, Surface, UVAnimationType, MaterialSet, AreaLight } from './mrea';
import * as Viewer from '../viewer';
import { AABB, squaredDistanceFromPointToAABB } from '../Geometry';
import { TXTR } from './txtr';
import { CMDL } from './cmdl';
import { TextureMapping } from '../TextureHolder';
import { GfxDevice, GfxFormat, GfxSampler, GfxMipFilterMode, GfxTexFilterMode, GfxWrapMode } from '../gfx/platform/GfxPlatform';
import { GfxCoalescedBuffers, GfxBufferCoalescer } from '../gfx/helpers/BufferHelpers';
import { GfxRenderInst, makeSortKey, GfxRendererLayer, setSortKeyDepthKey } from '../gfx/render/GfxRenderer';
import { computeViewMatrixSkybox, computeViewMatrix, texEnvMtx } from '../Camera';
import { LoadedVertexData, LoadedVertexPacket } from '../gx/gx_displaylist';
import { GXMaterialHacks, Color, lightSetWorldPositionViewMatrix, lightSetWorldDirectionNormalMatrix } from '../gx/gx_material';
import { LightParameters, WorldLightingOptions } from './script';
import { colorMult, colorCopy, colorFromRGBA } from '../Color';

const fixPrimeUsingTheWrongConventionYesIKnowItsFromMayaButMayaIsStillWrong = mat4.fromValues(
    1, 0,  0, 0,
    0, 0, -1, 0,
    0, 1,  0, 0,
    0, 0,  0, 1,
);

// Cheap way to scale up.
const posScale = 1;
const posMtx = mat4.create();
mat4.mul(posMtx, fixPrimeUsingTheWrongConventionYesIKnowItsFromMayaButMayaIsStillWrong, mat4.fromScaling(mat4.create(), [posScale, posScale, posScale]));

const posMtxSkybox = mat4.clone(fixPrimeUsingTheWrongConventionYesIKnowItsFromMayaButMayaIsStillWrong);

export class RetroTextureHolder extends GXTextureHolder<TXTR> {
    public addMaterialSetTextures(device: GfxDevice, materialSet: MaterialSet): void {
        this.addTextures(device, materialSet.textures);
    }
}

export const enum RetroPass {
    MAIN = 0x01,
    SKYBOX = 0x02,
}

export class ActorLights {
    public ambient: Color = new Color;
    public lights: AreaLight[] = [];

    constructor(actorBounds: AABB, lightParams: LightParameters, mrea: MREA) {
        // DisableWorld indicates the actor doesn't use any area lights (including ambient ones)
        if (lightParams.options === WorldLightingOptions.DisableWorld) {
            colorFromRGBA(this.ambient, 0, 0, 0, 1);
        } else {
            const layerIdx = lightParams.layerIdx;
            const layer = mrea.lightLayers[layerIdx];
            colorMult(this.ambient, layer.ambientColor, lightParams.ambient);

            class ActorLight {
                sqDist: number;
                light: AreaLight;
            }
            let actorLights: ActorLight[] = [];

            for (let i = 0; i < layer.lights.length; i++) {
                const light = layer.lights[i];
                const sqDist = squaredDistanceFromPointToAABB(light.gxLight.Position, actorBounds);

                if (sqDist < (light.radius * light.radius))
                    actorLights.push({ sqDist, light });
            }

            actorLights.sort((a, b) => a.sqDist - b.sqDist);

            for (let i = 0; i < actorLights.length && i < lightParams.maxAreaLights && i < 8; i++)
                this.lights.push(actorLights[i].light);
        }
    }
}

const viewMatrixScratch = mat4.create();
const modelMatrixScratch = mat4.create();
const bboxScratch = new AABB();

class SurfaceData {
    public shapeHelper: GXShapeHelperGfx;

    constructor(device: GfxDevice, renderHelper: GXRenderHelperGfx, public surface: Surface, coalescedBuffers: GfxCoalescedBuffers, public bbox: AABB) {
        this.shapeHelper = new GXShapeHelperGfx(device, renderHelper, coalescedBuffers, surface.loadedVertexLayout, surface.loadedVertexData);
    }

    public destroy(device: GfxDevice) {
        this.shapeHelper.destroy(device);
    }
}

class SurfaceInstance {
    private renderInst: GfxRenderInst;
    private materialTextureKey: number;
    public packetParams = new PacketParams();

    constructor(device: GfxDevice,
        renderHelper: GXRenderHelperGfx,
        public surfaceData: SurfaceData,
        public materialInstance: MaterialInstance,
        public materialGroupInstance: MaterialGroupInstance,
        public modelMatrix: mat4,
        public actorLights: ActorLights | null)
    {
        this.renderInst = this.surfaceData.shapeHelper.buildRenderInst(renderHelper.renderInstBuilder, materialInstance.templateRenderInst);
        renderHelper.renderInstBuilder.pushRenderInst(this.renderInst);
        this.materialTextureKey = materialInstance.textureKey;
    }

    public prepareToRender(renderHelper: GXRenderHelperGfx, viewerInput: Viewer.ViewerRenderInput, isSkybox: boolean, visible: boolean): boolean {
        let posModelMtx;

        if (isSkybox) {
            posModelMtx = posMtxSkybox;
            mat4.mul(modelMatrixScratch, posModelMtx, this.modelMatrix);
        } else {
            posModelMtx = posMtx;
            mat4.mul(modelMatrixScratch, posModelMtx, this.modelMatrix);

            if (visible) {
                bboxScratch.transform(this.surfaceData.bbox, modelMatrixScratch);
                visible = viewerInput.camera.frustum.contains(bboxScratch);
            }
        }

        if ((this.surfaceData.surface as any).visible === false)
            visible = false;

        if (visible) {
            const viewMatrix = viewMatrixScratch;

            if (isSkybox)
                computeViewMatrixSkybox(viewMatrix, viewerInput.camera);
            else
                computeViewMatrix(viewMatrix, viewerInput.camera);

            mat4.mul(this.packetParams.u_PosMtx[0], viewMatrix, modelMatrixScratch);
            this.surfaceData.shapeHelper.fillPacketParams(this.packetParams, this.renderInst, renderHelper);
            this.renderInst.sortKey = setSortKeyDepthKey(this.renderInst.sortKey, this.materialTextureKey);
        }

        this.renderInst.visible = visible;
        return this.renderInst.visible;
    }
}

const matrixScratch2 = mat4.create();
const materialParams = new MaterialParams();
class MaterialGroupInstance {
    public materialHelper: GXMaterialHelperGfx;
    public hasPreparedToRender: boolean = false;
    public gfxSampler: GfxSampler;

    constructor(device: GfxDevice, renderHelper: GXRenderHelperGfx, public material: Material, materialHacks?: GXMaterialHacks) {
        this.materialHelper = new GXMaterialHelperGfx(device, renderHelper, this.material.gxMaterial, materialHacks);
        const layer = this.material.isTransparent ? GfxRendererLayer.TRANSLUCENT : GfxRendererLayer.OPAQUE;
        this.materialHelper.templateRenderInst.sortKey = makeSortKey(layer, this.materialHelper.programKey);

        this.gfxSampler = device.createSampler({
            minFilter: GfxTexFilterMode.BILINEAR,
            magFilter: GfxTexFilterMode.BILINEAR,
            mipFilter: GfxMipFilterMode.LINEAR,
            minLOD: 0,
            maxLOD: 100,
            wrapS: GfxWrapMode.REPEAT,
            wrapT: GfxWrapMode.REPEAT,
        });
    }

    public destroy(device: GfxDevice) {
        this.materialHelper.destroy(device);
        device.destroySampler(this.gfxSampler);
    }

    public prepareToRender(renderHelper: GXRenderHelperGfx, viewerInput: Viewer.ViewerRenderInput, modelMatrix: mat4 | null, isSkybox: boolean, actorLights: ActorLights | null): void {
        if (this.hasPreparedToRender)
            return;

        this.fillMaterialParamsData(materialParams, viewerInput, modelMatrix, isSkybox, actorLights);
        this.materialHelper.fillMaterialParams(materialParams, renderHelper);
        this.hasPreparedToRender = true;
    }

    public fillMaterialParamsData(materialParams: MaterialParams, viewerInput: Viewer.ViewerRenderInput, modelMatrix: mat4 | null, isSkybox: boolean, actorLights: ActorLights | null): void {
        colorFromRGBA(materialParams.u_Color[ColorKind.MAT0], 1, 1, 1, 1);

        if (isSkybox) {
            colorFromRGBA(materialParams.u_Color[ColorKind.AMB0], 1, 1, 1, 1);
        } else {
            if (actorLights !== null)
                colorCopy(materialParams.u_Color[ColorKind.AMB0], actorLights.ambient);

            const viewMatrix = matrixScratch2;
            mat4.mul(viewMatrix, viewerInput.camera.viewMatrix, posMtx);

            for (let i = 0; i < 8; i++) {
                if (actorLights !== null && i < actorLights.lights.length) {
                    const light = actorLights.lights[i].gxLight;
                    materialParams.u_Lights[i].copy(light);
                    lightSetWorldPositionViewMatrix(materialParams.u_Lights[i], viewMatrix, light.Position[0], light.Position[1], light.Position[2]);
                    lightSetWorldDirectionNormalMatrix(materialParams.u_Lights[i], viewMatrix, light.Direction[0], light.Direction[1], light.Direction[2]);
                } else {
                    materialParams.u_Lights[i].reset();
                }
            }
        }

        for (let i = 0; i < 4; i++)
            colorCopy(materialParams.u_Color[ColorKind.CPREV + i], this.material.colorRegisters[i]);
        for (let i = 0; i < 4; i++)
            colorCopy(materialParams.u_Color[ColorKind.K0 + i], this.material.colorConstants[i]);

        const animTime = ((viewerInput.time / 1000) % 900);
        for (let i = 0; i < 8; i++) {
            const texMtx = materialParams.u_TexMtx[i];
            const postMtx = materialParams.u_PostTexMtx[i];
            mat4.identity(texMtx);
            mat4.identity(postMtx);

            const uvAnimation = this.material.uvAnimations[i];
            if (!uvAnimation)
                continue;

            switch (uvAnimation.type) {
            case UVAnimationType.UV_SCROLL: {
                const transS = animTime * uvAnimation.scaleS + uvAnimation.offsetS;
                const transT = animTime * uvAnimation.scaleT + uvAnimation.offsetT;
                texMtx[12] = transS;
                texMtx[13] = transT;
                break;
            }
            case UVAnimationType.ROTATION: {
                const theta = animTime * uvAnimation.scale + uvAnimation.offset;
                const cosR = Math.cos(theta);
                const sinR = Math.sin(theta);
                texMtx[0] =  cosR;
                texMtx[4] =  sinR;
                texMtx[12] = (1.0 - (cosR - sinR)) * 0.5;

                texMtx[1] = -sinR;
                texMtx[5] =  cosR;
                texMtx[13] = (1.0 - (sinR + cosR)) * 0.5;
                break;
            }
            case UVAnimationType.FLIPBOOK_U: {
                const n = uvAnimation.step * uvAnimation.scale * (uvAnimation.offset + animTime);
                const trans = Math.floor(uvAnimation.numFrames * (n % 1.0)) * uvAnimation.step;
                texMtx[12] = trans;
                break;
            }
            case UVAnimationType.FLIPBOOK_V: {
                const n = uvAnimation.step * uvAnimation.scale * (uvAnimation.offset + animTime);
                const trans = Math.floor(uvAnimation.numFrames * (n % 1.0)) * uvAnimation.step;
                texMtx[13] = trans;
                break;
            }
            case UVAnimationType.INV_MAT_SKY:
                mat4.invert(texMtx, viewerInput.camera.viewMatrix);
                if (modelMatrix !== null)
                    mat4.mul(texMtx, texMtx, modelMatrix);
                texMtx[12] = 0;
                texMtx[13] = 0;
                texMtx[14] = 0;
                texEnvMtx(postMtx, 0.5, -0.5, 0.5, 0.5);
                break;
            case UVAnimationType.INV_MAT:
                mat4.invert(texMtx, viewerInput.camera.viewMatrix);
                if (modelMatrix !== null)
                    mat4.mul(texMtx, texMtx, modelMatrix);
                texEnvMtx(postMtx, 0.5, -0.5, 0.5, 0.5);
                break;
            case UVAnimationType.MODEL_MAT:
                if (modelMatrix !== null)
                    mat4.copy(texMtx, modelMatrix);
                else
                    mat4.identity(texMtx);
                texMtx[12] = 0;
                texMtx[13] = 0;
                texMtx[14] = 0;
                texEnvMtx(postMtx, 0.5, -0.5, modelMatrix[12] * 0.5, modelMatrix[13] * 0.5);
                break;
            case UVAnimationType.CYLINDER: {
                mat4.copy(texMtx, viewerInput.camera.viewMatrix);
                if (modelMatrix !== null)
                    mat4.mul(texMtx, texMtx, modelMatrix);
                texMtx[12] = 0;
                texMtx[13] = 0;
                texMtx[14] = 0;
                mat4.invert(matrixScratch2, viewerInput.camera.viewMatrix);
                const xy = ((matrixScratch2[12] + matrixScratch2[14]) * 0.025 * uvAnimation.phi) % 1.0;
                const z = (matrixScratch2[13] * 0.05 * uvAnimation.phi) % 1.0;
                const a = uvAnimation.theta * 0.5;
                texEnvMtx(postMtx, a, -a, xy, z);
                break;
            }
            }
        }
    }
}

const textureMappings = nArray(8, () => new TextureMapping());
class MaterialInstance {
    public templateRenderInst: GfxRenderInst;
    public textureKey: number;

    constructor(materialGroup: MaterialGroupInstance, renderHelper: GXRenderHelperGfx, public material: Material, materialSet: MaterialSet, textureHolder: RetroTextureHolder) {
        this.templateRenderInst = renderHelper.renderInstBuilder.newRenderInst(materialGroup.materialHelper.templateRenderInst);

        this.textureKey = 0;
        for (let i = 0; i < material.textureIndexes.length; i++) {
            const textureIndex = material.textureIndexes[i];

            if (textureIndex === -1)
                continue;

            const txtr = materialSet.textures[materialSet.textureRemapTable[textureIndex]];
            textureHolder.fillTextureMapping(textureMappings[i], txtr.name);
            textureMappings[i].gfxSampler = materialGroup.gfxSampler;

            const globalTexIndex = textureHolder.findTextureEntryIndex(txtr.name);
            this.textureKey = (this.textureKey | globalTexIndex << (30 - (i * 10))) >>> 0;
        }

        this.templateRenderInst.setSamplerBindingsFromTextureMappings(textureMappings);
    }
}

interface MergedSurface extends Surface {
    origSurfaces: Surface[];
}

function mergeSurfaces(surfaces: Surface[]): MergedSurface {
    // Assume that all surfaces have the same vertex layout and material...
    let totalIndexCount = 0;
    let totalVertexCount = 0;
    let packedVertexDataSize = 0;
    const packets: LoadedVertexPacket[] = [];
    for (let i = 0; i < surfaces.length; i++) {
        const surface = surfaces[i];
        assert(surface.loadedVertexData.indexFormat === GfxFormat.U16_R);
        assert(surface.loadedVertexData.indexData.byteLength === surface.loadedVertexData.totalIndexCount * 0x02);
        totalIndexCount += surface.loadedVertexData.totalIndexCount;
        totalVertexCount += surface.loadedVertexData.totalVertexCount;
        packedVertexDataSize += surface.loadedVertexData.packedVertexData.byteLength;

        for (let j = 0; j < surface.loadedVertexData.packets.length; j++) {
            const packet = surface.loadedVertexData.packets[j];
            const indexOffset = totalIndexCount + packet.indexOffset;
            const indexCount = packet.indexCount;
            const posNrmMatrixTable = packet.posNrmMatrixTable;
            packets.push({ indexOffset, indexCount, posNrmMatrixTable });
        }
    }

    const packedVertexData = new Uint8Array(packedVertexDataSize);
    const indexData = new Uint16Array(totalIndexCount);
    let indexDataOffs = 0;
    let packedVertexDataOffs = 0;
    let vertexOffset = 0;
    for (let i = 0; i < surfaces.length; i++) {
        const surface = surfaces[i];
        const surfaceIndexBuffer = new Uint16Array(surface.loadedVertexData.indexData);
        for (let j = 0; j < surfaceIndexBuffer.length; j++)
            indexData[indexDataOffs++] = vertexOffset + surfaceIndexBuffer[j];
        vertexOffset += surface.loadedVertexData.totalVertexCount;
        assert(vertexOffset <= 0xFFFF);

        packedVertexData.set(new Uint8Array(surface.loadedVertexData.packedVertexData), packedVertexDataOffs);
        packedVertexDataOffs += surface.loadedVertexData.packedVertexData.byteLength;
    }

    const newLoadedVertexData: LoadedVertexData = {
        indexFormat: GfxFormat.U16_R,
        indexData: indexData.buffer,
        packedVertexData: packedVertexData.buffer,
        totalIndexCount,
        totalVertexCount,
        packets,
        vertexId: 0,
    };

    return {
        materialIndex: surfaces[0].materialIndex,
        worldModelIndex: -1,
        loadedVertexLayout: surfaces[0].loadedVertexLayout,
        loadedVertexData: newLoadedVertexData,
        origSurfaces: surfaces,
    }
}

export class MREARenderer {
    private bufferCoalescer: GfxBufferCoalescer;
    private materialGroupInstances: MaterialGroupInstance[] = [];
    private materialInstances: MaterialInstance[] = [];
    private surfaceData: SurfaceData[] = [];
    private surfaceInstances: SurfaceInstance[] = [];
    private actors: CMDLRenderer[] = [];
    public visible: boolean = true;

    constructor(device: GfxDevice, renderHelper: GXRenderHelperGfx, public textureHolder: RetroTextureHolder, public name: string, public mrea: MREA) {
        this.translateModel(device, renderHelper);
        this.translateActors(device, renderHelper);
    }

    private translateModel(device: GfxDevice, renderHelper: GXRenderHelperGfx): void {
        const materialSet = this.mrea.materialSet;

        this.textureHolder.addMaterialSetTextures(device, materialSet);

        // First, create our group commands. These will store UBO buffer data which is shared between
        // all groups using that material.
        for (let i = 0; i < materialSet.materials.length; i++) {
            const material = materialSet.materials[i];
            if (this.materialGroupInstances[material.groupIndex] === undefined)
                this.materialGroupInstances[material.groupIndex] = new MaterialGroupInstance(device, renderHelper, material, { lightingFudge: (p) => 'vec4(0, 0, 0, 1)' });
        }

        // Now create the material commands.
        this.materialInstances = materialSet.materials.map((material) => {
            const materialGroupCommand = this.materialGroupInstances[material.groupIndex];
            return new MaterialInstance(materialGroupCommand, renderHelper, material, materialSet, this.textureHolder);
        });

        // Gather all surfaces.
        const surfaces: Surface[] = [];
        for (let i = 0; i < this.mrea.worldModels.length; i++) {
            for (let j = 0; j < this.mrea.worldModels[i].geometry.surfaces.length; j++) {
                const materialCommand = this.materialInstances[this.mrea.worldModels[i].geometry.surfaces[j].materialIndex];
                if (materialCommand.material.isOccluder)
                    continue;
                surfaces.push(this.mrea.worldModels[i].geometry.surfaces[j]);
            }
        }

        // Sort by material.
        surfaces.sort((a, b) => a.materialIndex - b.materialIndex);

        // Merge surfaces with the same material.
        const vertexDatas: ArrayBufferSlice[] = [];
        const indexDatas: ArrayBufferSlice[] = [];

        const mergedSurfaces: Surface[] = [];
        for (let i = 0; i < surfaces.length;) {
            let firstSurfaceIndex = i;

            const materialIndex = surfaces[firstSurfaceIndex].materialIndex;
            const materialCommand = this.materialInstances[materialIndex];

            // Transparent objects should not be merged.
            const canMerge = !materialCommand.material.isTransparent;
            if (canMerge) {
                while (i < surfaces.length && surfaces[i].materialIndex === materialIndex)
                    i++;
                mergedSurfaces.push(mergeSurfaces(surfaces.slice(firstSurfaceIndex, i)));
            } else {
                mergedSurfaces.push(surfaces[i++]);
            }
        }

        for (let i = 0; i < mergedSurfaces.length; i++) {
            vertexDatas.push(new ArrayBufferSlice(mergedSurfaces[i].loadedVertexData.packedVertexData));
            indexDatas.push(new ArrayBufferSlice(mergedSurfaces[i].loadedVertexData.indexData));
        }

        this.bufferCoalescer = new GfxBufferCoalescer(device, vertexDatas, indexDatas);
        for (let i = 0; i < mergedSurfaces.length; i++) {
            const surface = mergedSurfaces[i];

            let bbox: AABB;
            if (surface.worldModelIndex >= 0) {
                // Unmerged, simple case.
                bbox = this.mrea.worldModels[surface.worldModelIndex].bbox;
            } else {
                const mergedSurface = surface as MergedSurface;
                bbox = new AABB();
                for (let j = 0; j < mergedSurface.origSurfaces.length; j++)
                    bbox.union(bbox, this.mrea.worldModels[mergedSurface.origSurfaces[j].worldModelIndex].bbox);
            }

            const surfaceData = new SurfaceData(device, renderHelper, surface, this.bufferCoalescer.coalescedBuffers[i], bbox);
            const materialCommand = this.materialInstances[mergedSurfaces[i].materialIndex];
            const materialGroupCommand = this.materialGroupInstances[materialCommand.material.groupIndex];
            const instance = new SurfaceInstance(device, renderHelper, surfaceData, materialCommand, materialGroupCommand, mat4.create(), null);
            this.surfaceInstances.push(instance);
        }
    }

    private translateActors(device: GfxDevice, renderHelper: GXRenderHelperGfx): void {
        for (let i = 0; i < this.mrea.scriptLayers.length; i++) {
            const scriptLayer = this.mrea.scriptLayers[i];

            for (let j = 0; j < scriptLayer.entities.length; j++) {
                const ent = scriptLayer.entities[j];

                if (ent.active && ent.model) {
                    const aabb = new AABB();
                    aabb.transform(ent.model.bbox, ent.modelMatrix);

                    const actorLights = new ActorLights(aabb, ent.lightParams, this.mrea);
                    // TODO(jstpierre): Add a ModelCache.
                    const cmdlData = new CMDLData(device, renderHelper, ent.model);
                    this.actors.push(new CMDLRenderer(device, renderHelper, this.textureHolder, actorLights, ent.name, ent.modelMatrix, cmdlData));
                }
            }
        }
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
    }

    public prepareToRender(renderHelper: GXRenderHelperGfx, viewerInput: Viewer.ViewerRenderInput): void {
        // First, prep our material groups to be updated.
        for (let i = 0; i < this.materialGroupInstances.length; i++)
            this.materialGroupInstances[i].hasPreparedToRender = false;

        // Update our surfaces.
        for (let i = 0; i < this.surfaceInstances.length; i++) {
            const surfaceInstance = this.surfaceInstances[i];
            const surfaceVisible = surfaceInstance.prepareToRender(renderHelper, viewerInput, false, this.visible);

            if (surfaceVisible) {
                const surface = surfaceInstance.surfaceData.surface;
                const material = this.materialInstances[surface.materialIndex].material;
                const materialGroupCommand = this.materialGroupInstances[material.groupIndex];
                materialGroupCommand.prepareToRender(renderHelper, viewerInput, null, false, null);
            }
        }

        // Update our actors
        for (let i = 0; i < this.actors.length; i++)
           this.actors[i].prepareToRender(renderHelper, viewerInput, this.visible);
    }

    public destroy(device: GfxDevice): void {
        this.materialGroupInstances.forEach((cmd) => cmd.destroy(device));
        this.bufferCoalescer.destroy(device);
        for (let i = 0; i < this.actors.length; i++)
            this.actors[i].destroy(device);
        for (let i = 0; i < this.surfaceData.length; i++)
            this.surfaceData[i].destroy(device);
    }
}

export class CMDLData {
    private bufferCoalescer: GfxBufferCoalescer;
    public surfaceData: SurfaceData[] = [];

    constructor(device: GfxDevice, renderHelper: GXRenderHelperGfx, public cmdl: CMDL) {
        const vertexDatas: ArrayBufferSlice[] = [];
        const indexDatas: ArrayBufferSlice[] = [];

        // Coalesce surface data.
        const surfaces = this.cmdl.geometry.surfaces;
        for (let i = 0; i < surfaces.length; i++) {
            vertexDatas.push(new ArrayBufferSlice(surfaces[i].loadedVertexData.packedVertexData));
            indexDatas.push(new ArrayBufferSlice(surfaces[i].loadedVertexData.indexData));
        }

        this.bufferCoalescer = new GfxBufferCoalescer(device, vertexDatas, indexDatas);

        for (let i = 0; i < surfaces.length; i++) {
            const coalescedBuffers = this.bufferCoalescer.coalescedBuffers[i];
            this.surfaceData[i] = new SurfaceData(device, renderHelper, surfaces[i], coalescedBuffers, this.cmdl.bbox);
        }
    }

    public destroy(device: GfxDevice): void {
        this.bufferCoalescer.destroy(device);
        for (let i = 0; i < this.surfaceData.length; i++)
            this.surfaceData[i].destroy(device);
    }
}

// TODO(jstpierre): Dedupe.
export class CMDLRenderer {
    private materialGroupInstances: MaterialGroupInstance[] = [];
    private materialInstances: MaterialInstance[] = [];
    private surfaceInstances: SurfaceInstance[] = [];
    private templateRenderInst: GfxRenderInst;
    public visible: boolean = true;
    public isSkybox: boolean = false;

    constructor(device: GfxDevice, renderHelper: GXRenderHelperGfx, public textureHolder: RetroTextureHolder, public actorLights: ActorLights, public name: string, public modelMatrix: mat4, public cmdlData: CMDLData) {
        this.translateModel(device, renderHelper);
    }

    private translateModel(device: GfxDevice, renderHelper: GXRenderHelperGfx): void {
        const materialSet = this.cmdlData.cmdl.materialSets[0];

        this.templateRenderInst = renderHelper.renderInstBuilder.pushTemplateRenderInst();

        this.textureHolder.addMaterialSetTextures(device, materialSet);

        // First, create our group commands. These will store UBO buffer data which is shared between
        // all groups using that material.
        for (let i = 0; i < materialSet.materials.length; i++) {
            const material = materialSet.materials[i];
            if (this.materialGroupInstances[material.groupIndex] === undefined)
                this.materialGroupInstances[material.groupIndex] = new MaterialGroupInstance(device, renderHelper, material);
        }

        // Now create the material commands.
        this.materialInstances = materialSet.materials.map((material) => {
            const materialGroupCommand = this.materialGroupInstances[material.groupIndex];
            return new MaterialInstance(materialGroupCommand, renderHelper, material, materialSet, this.textureHolder);
        });

        for (let i = 0; i < this.cmdlData.surfaceData.length; i++) {
            const surfaceData = this.cmdlData.surfaceData[i];
            const surface = surfaceData.surface;
            const materialCommand = this.materialInstances[surface.materialIndex];
            const materialGroupCommand = this.materialGroupInstances[materialCommand.material.groupIndex];

            // Don't render occluders.
            if (materialCommand.material.isOccluder)
                continue;

            this.surfaceInstances.push(new SurfaceInstance(device, renderHelper, surfaceData, materialCommand, materialGroupCommand, this.modelMatrix, this.actorLights));
        }

        renderHelper.renderInstBuilder.popTemplateRenderInst();
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
    }

    public prepareToRender(renderHelper: GXRenderHelperGfx, viewerInput: Viewer.ViewerRenderInput, visible: boolean = true): void {
        if (visible)
            visible = this.visible;

        this.templateRenderInst.passMask = this.isSkybox ? RetroPass.SKYBOX : RetroPass.MAIN;

        // First, prep our material groups to be updated.
        for (let i = 0; i < this.materialGroupInstances.length; i++)
            this.materialGroupInstances[i].hasPreparedToRender = false;

        // Update our surfaces.
        for (let i = 0; i < this.surfaceInstances.length; i++) {
            const surfaceInstance = this.surfaceInstances[i];
            const surfaceVisible = surfaceInstance.prepareToRender(renderHelper, viewerInput, this.isSkybox, visible);

            if (surfaceVisible) {
                const surface = surfaceInstance.surfaceData.surface;
                const material = this.materialInstances[surface.materialIndex].material;
                const materialGroupCommand = this.materialGroupInstances[material.groupIndex];
                materialGroupCommand.prepareToRender(renderHelper, viewerInput, this.modelMatrix, this.isSkybox, this.actorLights);
            }
        }
    }

    public destroy(device: GfxDevice): void {
        this.materialGroupInstances.forEach((cmd) => cmd.destroy(device));
    }
}

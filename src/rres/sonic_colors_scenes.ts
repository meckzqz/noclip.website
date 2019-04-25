
import * as Viewer from '../viewer';
import * as U8 from './u8';
import * as BRRES from './brres';

import ArrayBufferSlice from "../ArrayBufferSlice";
import { vec3 } from "gl-matrix";
import { readString, assert, assertExists } from "../util";
import { GfxDevice, GfxHostAccessPass, GfxRenderPass } from '../gfx/platform/GfxPlatform';
import Progressable from '../Progressable';
import { fetchData } from '../fetch';
import { MDL0ModelInstance, RRESTextureHolder, MDL0Model } from './render';
import AnimationController from '../AnimationController';
import { GXRenderHelperGfx } from '../gx/gx_render';
import { BasicRenderTarget, standardFullClearRenderPassDescriptor, depthClearRenderPassDescriptor } from '../gfx/helpers/RenderTargetHelpers';
import { GfxRenderInstViewRenderer } from '../gfx/render/GfxRenderer';
import { GXMaterialHacks } from '../gx/gx_material';

interface MapEntry {
    index: number;
    filename: string;
    translation: vec3;
}

interface MapFile {
    entries: MapEntry[];
}

function parseMapFile(buffer: ArrayBufferSlice): MapFile {
    const view = buffer.createDataView();

    assert(readString(buffer, 0x18, 0x04) === 'BINA');
    const numMapEntries = view.getUint32(0x24, false);

    const entries: MapEntry[] = [];

    let mapEntryTableIdx = 0x2C;
    for (let i = 0; i < numMapEntries; i++) {
        const filenameOffs = 0x20 + view.getUint32(mapEntryTableIdx + 0x00);
        const filename = readString(buffer, filenameOffs);
        const index = view.getUint32(mapEntryTableIdx + 0x04);
        assert(index === i);
        const flags = view.getUint32(mapEntryTableIdx + 0x08);
        const translationX = view.getFloat32(mapEntryTableIdx + 0x0C);
        const translationY = view.getFloat32(mapEntryTableIdx + 0x10);
        const translationZ = view.getFloat32(mapEntryTableIdx + 0x14);
        const translation = vec3.fromValues(translationX, translationY, translationZ);
        entries.push({ index, filename, translation });
        mapEntryTableIdx += 0x18;
    }

    return { entries };
}

enum SonicColorsPass {
    SKYBOX = 0x01,
    MAIN = 0x02,
}

class SonicColorsRenderer implements Viewer.SceneGfx {
    public viewRenderer = new GfxRenderInstViewRenderer();
    public renderTarget = new BasicRenderTarget();

    public renderHelper: GXRenderHelperGfx;
    public textureHolder = new RRESTextureHolder();
    public animationController = new AnimationController();

    public modelInstances: MDL0ModelInstance[] = [];
    public modelData: MDL0Model[] = [];

    constructor(device: GfxDevice) {
        this.renderHelper = new GXRenderHelperGfx(device);
    }

    protected prepareToRender(hostAccessPass: GfxHostAccessPass, viewerInput: Viewer.ViewerRenderInput): void {
        this.renderHelper.fillSceneParams(viewerInput);
        for (let i = 0; i < this.modelInstances.length; i++)
            this.modelInstances[i].prepareToRender(this.renderHelper, viewerInput);
        this.renderHelper.prepareToRender(hostAccessPass);
    }

    public render(device: GfxDevice, viewerInput: Viewer.ViewerRenderInput): GfxRenderPass {
        this.animationController.setTimeInMilliseconds(viewerInput.time);

        const hostAccessPass = device.createHostAccessPass();
        this.prepareToRender(hostAccessPass, viewerInput);
        device.submitPass(hostAccessPass);

        this.viewRenderer.prepareToRender(device);

        this.renderTarget.setParameters(device, viewerInput.viewportWidth, viewerInput.viewportHeight);
        this.viewRenderer.setViewport(viewerInput.viewportWidth, viewerInput.viewportHeight);
        // First, render the skybox.
        const skyboxPassRenderer = this.renderTarget.createRenderPass(device, standardFullClearRenderPassDescriptor);
        this.viewRenderer.executeOnPass(device, skyboxPassRenderer, SonicColorsPass.SKYBOX);
        skyboxPassRenderer.endPass(null);
        device.submitPass(skyboxPassRenderer);
        // Now do main pass.
        const mainPassRenderer = this.renderTarget.createRenderPass(device, depthClearRenderPassDescriptor);
        this.viewRenderer.executeOnPass(device, mainPassRenderer, SonicColorsPass.MAIN);
        return mainPassRenderer;
    }

    public destroy(device: GfxDevice): void {
        this.textureHolder.destroy(device);
        this.viewRenderer.destroy(device);
        this.renderTarget.destroy(device);
        this.renderHelper.destroy(device);

        for (let i = 0; i < this.modelInstances.length; i++)
            this.modelInstances[i].destroy(device);

        for (let i = 0; i < this.modelData.length; i++)
            this.modelData[i].destroy(device);
    }
}

const materialHacks: GXMaterialHacks = {
    lightingFudge: (p) => `${p.ambSource} + 0.6`,
};

const pathBase = `sonic_colors/`;
class SonicColorsSceneDesc implements Viewer.SceneDesc {
    constructor(public id: string, public name: string) {
    }

    public createScene(device: GfxDevice, abortSignal: AbortSignal): Progressable<Viewer.SceneGfx> {
        const stageDir = `${pathBase}/${this.id}`;
        const commonArcPath = `${stageDir}/${this.id}_cmn.arc`;
        const texRRESPath = `${stageDir}/${this.id}_tex.brres`;
        return Progressable.all([fetchData(commonArcPath, abortSignal), fetchData(texRRESPath, abortSignal)]).then(([commonArcData, texRRESData]) => {
            const commonArc = U8.parse(commonArcData);
            const mapFile = parseMapFile(assertExists(commonArc.findFile(`arc/${this.id}_map.map.bin`)).buffer);
            const texRRES = BRRES.parse(texRRESData);

            const renderer = new SonicColorsRenderer(device);
            renderer.textureHolder.addRRESTextures(device, texRRES);

            return Progressable.all(mapFile.entries.map((entry) => {
                const path = `${stageDir}/${entry.filename}.arc`;
                return fetchData(path, abortSignal);
            })).then((entryArcDatas) => {
                const skyboxRRES = BRRES.parse(assertExists(commonArc.findFile(`arc/${this.id}_sky.brres`)).buffer);
                const motRRES = BRRES.parse(assertExists(commonArc.findFile(`arc/${this.id}_mot.brres`)).buffer);

                const skyboxModel = new MDL0Model(device, renderer.renderHelper, skyboxRRES.mdl0[0], materialHacks);
                const skyboxModelInstance = new MDL0ModelInstance(device, renderer.renderHelper, renderer.textureHolder, skyboxModel);
                skyboxModelInstance.isSkybox = true;
                skyboxModelInstance.passMask = SonicColorsPass.SKYBOX;
                renderer.modelData.push(skyboxModel);
                renderer.modelInstances.push(skyboxModelInstance);

                for (let i = 0; i < mapFile.entries.length; i++) {
                    const entry = mapFile.entries[i];
                    const entryArc = U8.parse(entryArcDatas[i]);
                    const dir = entryArc.findDir(`arc`);

                    for (let j = 0; j < dir.files.length; j++) {
                        const rres = BRRES.parse(dir.files[j].buffer);
                        assert(rres.mdl0.length === 1);
                        const modelData = new MDL0Model(device, renderer.renderHelper, rres.mdl0[0], materialHacks);
                        const modelInstance = new MDL0ModelInstance(device, renderer.renderHelper, renderer.textureHolder, modelData);
                        modelInstance.passMask = SonicColorsPass.MAIN;
                        modelInstance.bindRRESAnimations(renderer.animationController, motRRES);
                        // mat4.translate(modelInstance.modelMatrix, modelInstance.modelMatrix, entry.translation);
                        renderer.modelData.push(modelData);
                        renderer.modelInstances.push(modelInstance);
                    }
                }

                renderer.renderHelper.finishBuilder(device, renderer.viewRenderer);
                return renderer;
            });
        });
    }
}

const id = 'sonic_colors';
const name = "Sonic Colors";
const sceneDescs = [
    new SonicColorsSceneDesc("stg110", "stg110"),
    new SonicColorsSceneDesc("stg120", "stg120"),
    new SonicColorsSceneDesc("stg190", "stg190"),
    new SonicColorsSceneDesc("stg210", "stg210"),
    new SonicColorsSceneDesc("stg220", "stg220"),
    new SonicColorsSceneDesc("stg290", "stg290"),
    new SonicColorsSceneDesc("stg310", "stg310"),
    new SonicColorsSceneDesc("stg320", "stg320"),
    new SonicColorsSceneDesc("stg390", "stg390"),
    new SonicColorsSceneDesc("stg410", "stg410"),
    new SonicColorsSceneDesc("stg420", "stg420"),
    new SonicColorsSceneDesc("stg490", "stg490"),
    new SonicColorsSceneDesc("stg510", "stg510"),
    new SonicColorsSceneDesc("stg520", "stg520"),
    new SonicColorsSceneDesc("stg590", "stg590"),
    new SonicColorsSceneDesc("stg610", "stg610"),
    new SonicColorsSceneDesc("stg620", "stg620"),
    new SonicColorsSceneDesc("stg690", "stg690"),
    new SonicColorsSceneDesc("stg710", "stg710"),
    new SonicColorsSceneDesc("stg720", "stg720"),
    new SonicColorsSceneDesc("stg790", "stg790"),
];

export const sceneGroup: Viewer.SceneGroup = { id, name, sceneDescs };

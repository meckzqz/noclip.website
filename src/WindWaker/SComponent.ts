
import { clamp, MathConstants } from "../MathHelpers";

function clampAbs(v: number, min: number, max: number): number {
    return Math.sign(v) * clamp(Math.abs(v), min, max);
}

export function cLib_addCalc(src: number, target: number, speed: number, maxVel: number, minVel: number): number {
    const delta = (target - src);
    const vel = clampAbs(speed * delta, minVel, maxVel);
    if (Math.abs(vel) > Math.abs(delta))
        return target;
    else
        return src + vel;
}

export function cLib_addCalc2(src: number, target: number, speed: number, maxVel: number): number {
    return src + clampAbs(speed * (target - src), 0.0, maxVel);
}

export function cLib_addCalcAngleRad(src: number, target: number, speed: number, maxVel: number, minVel: number): number {
    const da = (target - src) % MathConstants.TAU;
    const delta = (2*da) % MathConstants.TAU - da;
    const vel = clampAbs(delta / speed, minVel, maxVel);
    if (Math.abs(vel) > Math.abs(delta))
        return target;
    else
        return src + vel;
}

export function cLib_addCalcAngleRad2(src: number, target: number, speed: number, maxVel: number): number {
    const da = (target - src) % MathConstants.TAU;
    const delta = (2*da) % MathConstants.TAU - da;
    const vel = clampAbs(delta / speed, 0.0, maxVel);
    if (Math.abs(vel) > Math.abs(delta))
        return target;
    else
        return src + vel;
}

export function cLib_addCalcAngleS2(src: number, target: number, speed: number, maxVel: number): number {
    // this is not accurate
    const da = (target - src) % 0xFFFF;
    const delta = (2*da) % 0xFFFF - da;
    const vel = clampAbs(delta / speed, 0.0, maxVel);
    if (Math.abs(vel) > Math.abs(delta))
        return target;
    else
        return src + vel;
}

export function cM_rndF(max: number): number {
    return Math.random() * max;
}

export function cM_rndFX(max: number): number {
    return 2.0 * (max * (Math.random() - 0.5));
}

export function cM_atan2s(y: number, x: number): number {
    return cM__Rad2Short(Math.atan2(y, x));
}

export function cM__Short2Rad(v: number): number {
    return v * (Math.PI / 0x8000);
}

export function cM__Rad2Short(v: number): number {
    return v * (0x8000 / Math.PI);
}

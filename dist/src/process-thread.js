"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imgToBin = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const jimp_1 = __importDefault(require("jimp"));
const path_1 = require("path");
const worker_threads_1 = require("worker_threads");
const const_1 = require("./const");
/**
 * 图片转地图画用二进制文件
 * @param image 图片Sharp对象
 * @param outDir 转换后二进制文件存放路径
 * @returns 转换后二进制文件路径
 */
async function imgToBin(image, fileName, outDir) {
    let width = image.getWidth();
    let height = image.getHeight();
    // 删除之前的缓存
    if ((0, fs_1.existsSync)(outDir))
        await (0, promises_1.rm)(outDir, { recursive: true, force: true });
    await (0, promises_1.mkdir)(outDir);
    // 使图片长宽对齐cutSize的倍数
    const widthRemain = width % const_1.cutSize;
    const heightRemain = height % const_1.cutSize;
    if (widthRemain || heightRemain) {
        const widthAdd = widthRemain ? const_1.cutSize - widthRemain : 0;
        const heightAdd = heightRemain ? const_1.cutSize - heightRemain : 0;
        width += widthAdd;
        height += heightAdd;
        const newBg = new jimp_1.default(width, height, 'white').blit(image, 0, 0);
        // logger.info({ w: newBg.getWidth(), h: newBg.getHeight() });
        image = newBg;
    }
    const tasks = [];
    const outFiles = [];
    const imgName = (0, path_1.basename)(fileName);
    // image.getBuffer('image/png', (_, v) => {
    //   writeFileSync(join(outDir, `${imgName}.png`), v);
    // });
    // 裁剪图片
    for (let ih = 0; ih < height / const_1.cutSize; ih += 1) {
        for (let iw = 0; iw < width / const_1.cutSize; iw += 1) {
            const x = const_1.cutSize * iw;
            const y = const_1.cutSize * ih;
            // logger.info({ x, y });
            // 需要clone 否则会影响原image
            const cutImg = image.clone().crop(x, y, const_1.cutSize, const_1.cutSize).opacity(0);
            const outFile = (0, path_1.resolve)((0, path_1.join)(outDir, `${imgName}-${iw}_${ih}`));
            outFiles.push(outFile);
            tasks.push((0, promises_1.writeFile)(outFile, cutImg.bitmap.data));
        }
    }
    await Promise.all(tasks);
    return outFiles;
}
exports.imgToBin = imgToBin;
if (!worker_threads_1.isMainThread) {
    const { size: [w, h], hAlign, vAlign, scaleMode, bitmap, processType, fileName, tmpFolder, } = worker_threads_1.workerData;
    const image = new jimp_1.default(bitmap);
    switch (processType) {
        case 0: {
            // 裁剪
            image.cover(w, h, hAlign | vAlign, scaleMode);
            break;
        }
        case 1: {
            // 拉伸
            image.resize(w, h, scaleMode);
            break;
        }
        case 2: {
            // 保留白边
            image
                .background(0xffffffff) // 设置背景颜色，默认是黑色，这里换成白色
                .contain(w, h, hAlign | vAlign, scaleMode);
            break;
        }
        // no default
    }
    worker_threads_1.parentPort?.postMessage({ type: 'pre-process', data: [] });
    imgToBin(image, fileName, tmpFolder).then((r) => worker_threads_1.parentPort?.postMessage({ type: 'ok', data: r }));
}
exports.default = {};

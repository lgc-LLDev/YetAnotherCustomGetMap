"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formFiles = exports.formGet = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const jimp_1 = __importDefault(require("jimp"));
const path_1 = require("path");
const worker_threads_1 = require("worker_threads");
const config_1 = require("./config");
const const_1 = require("./const");
const give_map_1 = require("./give-map");
const util_1 = require("./util");
/**
 * 图片处理表单
 * @param player 玩家
 * @param fileName 图片文件名，文件需在imgPath下
 */
async function formGet(player, fileName) {
    if (config_1.config.getPageOP && player.permLevel < 1) {
        player.tell('你无权执行此操作');
        return;
    }
    const isUrl = fileName.startsWith('http://') || fileName.startsWith('https://');
    const filePath = isUrl ? '' : (0, path_1.join)(const_1.imgPath, fileName);
    if (!isUrl && !(0, fs_1.existsSync)(filePath)) {
        player.tell('§c文件不存在');
        return;
    }
    let image;
    player.tell('读取图片信息……');
    try {
        const file = isUrl
            ? (await axios_1.default.get(fileName, { responseType: 'arraybuffer' })).data
            : filePath;
        image = await jimp_1.default.read(file);
    }
    catch (e) {
        logger.error('图片打开失败');
        logger.error((0, util_1.formatError)(e));
        player.tell(`§c图片打开失败！`);
        return;
    }
    fileName = isUrl ? String(Date.now()) : fileName;
    const width = image.getWidth();
    const height = image.getHeight();
    // 以图片最长边计算可能的地图大小
    const [smaller, bigger] = [width, height].sort((a, b) => a - b);
    const reversed = height === smaller; // 是否为横屏图片（最长边为宽）
    const scale = smaller / bigger;
    const biggerMaxPart = Math.ceil(bigger / const_1.cutSize);
    /** 可能的地图大小 [宽, 高] */
    const scales = [];
    for (let i = 1; i <= biggerMaxPart; i += 1) {
        let willPush = [Math.ceil(i * scale), i];
        if (reversed)
            willPush = willPush.reverse();
        scales.push(willPush);
    }
    // @ts-expect-error: TS2769
    player.sendForm(mc
        .newCustomForm()
        .setTitle(const_1.pluginName)
        .addLabel(`文件名：§b${fileName}\n` +
        `§r图片原始大小：§e${width} × ${height}\n` +
        `§a请选择图片处理的方式`)
        .addStepSlider('宽 × 高', scales.map((v) => {
        const [w, h] = v;
        return `§e${w} × ${h} §r（§6${w * h} §r个地图）`;
    }), scales.length - 1)
        .addStepSlider('图片处理方式', ['§e裁剪', '§e拉伸', '§e保留白边'])
        .addStepSlider('如果§6裁剪§r或§6保留白边§r，图片的§a水平§r位置居§e', ['§a左', '§e中', '§b右'], 1)
        .addStepSlider('如果§6裁剪§r或§6保留白边§r，图片的§b垂直§r位置居§e', ['§a上', '§e中', '§b下'], 1)
        .addStepSlider('插值模式', ['最近邻', '双线性', '双三次', '埃尔米特', '贝塞尔'], 2), (_, res) => setTimeout((0, util_1.callAsyncLogErr)(async () => {
        // logger.info(res);
        if (!res) {
            player.tell('表单已取消');
            return;
        }
        player.tell('处理图片中，请稍候……');
        const [, scaleIndex, processType, hAType, vAType, scaleTIndex] = res;
        const selectedScale = scales[scaleIndex];
        const size = selectedScale.map((x) => x * const_1.cutSize);
        const hAlign = [
            jimp_1.default.HORIZONTAL_ALIGN_LEFT,
            jimp_1.default.HORIZONTAL_ALIGN_CENTER,
            jimp_1.default.HORIZONTAL_ALIGN_RIGHT,
        ][hAType];
        const vAlign = [
            jimp_1.default.VERTICAL_ALIGN_TOP,
            jimp_1.default.VERTICAL_ALIGN_MIDDLE,
            jimp_1.default.VERTICAL_ALIGN_BOTTOM,
        ][vAType];
        const scaleMode = [
            jimp_1.default.RESIZE_NEAREST_NEIGHBOR,
            jimp_1.default.RESIZE_BILINEAR,
            jimp_1.default.RESIZE_BICUBIC,
            jimp_1.default.RESIZE_HERMITE,
            jimp_1.default.RESIZE_BEZIER,
        ][scaleTIndex];
        // 临时文件夹后跟玩家名，目的是多个玩家同时生成一张图时不会串文件
        const tmpFolder = (0, path_1.join)(const_1.tmpPath, `${(0, path_1.basename)(fileName, (0, path_1.extname)(fileName))}_${player.realName}`);
        await new Promise((resolve) => {
            const workerData = {
                size,
                hAlign,
                vAlign,
                scaleMode,
                bitmap: image.bitmap,
                processType,
                fileName,
                tmpFolder,
            };
            const worker = new worker_threads_1.Worker(`${__dirname}/process-thread.js`, {
                workerData,
            });
            worker.on('message', (msg) => {
                switch (msg.type) {
                    case 'pre-process': {
                        player.tell(`§a图片处理完毕！准备生成二进制文件……`);
                        break;
                    }
                    case 'ok': {
                        player.tell(`§a二进制文件生成完毕！`);
                        (0, give_map_1.giveMap)(player.xuid, msg.data, selectedScale);
                        resolve();
                    }
                    // no default
                }
            });
            worker.on('error', (e) => {
                const tip = `生成出错！\n${(0, util_1.formatError)(e)}`;
                logger.error(tip);
                player.tell(`§c${tip}`);
            });
        });
    })));
}
exports.formGet = formGet;
/**
 * 主表单，选择文件
 * @param player 玩家
 */
async function formFiles(player) {
    if (config_1.config.mainPageOP && player.permLevel < 1) {
        player.tell('你无权执行此操作');
        return;
    }
    const files = (await (0, promises_1.readdir)(const_1.imgPath, { withFileTypes: true }))
        .filter((v) => v.isFile())
        .map((v) => v.name);
    // const fileLength = files.length;
    if (!files.length) {
        player.sendModalForm(const_1.pluginName, '插件数据目录 img 文件夹下还没有文件哦，请添加文件后再来', '知道了', '知道了', util_1.emptyCallback);
        return;
    }
    /**
     * 列表表单，搜索结果也调用这个
     * @param list 要展示的表单按钮
     * @param hasSearchBtn 是否有搜索按钮
     * @param page 页数，从1开始
     */
    const listPage = async (list, hasSearchBtn = true, page = 1) => {
        const { pageLimit } = config_1.config;
        const listLength = list.length;
        if (page < 1)
            page = 1;
        const pageTotal = Math.ceil(listLength / pageLimit);
        if (page > pageTotal)
            page = pageTotal;
        /** 搜索表单 */
        const searchForm = async () => {
            const sendModalForm = (content) => {
                player.sendModalForm(const_1.pluginName, content, '确定', '退出', (0, util_1.callAsyncLogErr)(async (__, ok) => {
                    if (ok)
                        await searchForm();
                }));
            };
            // @ts-expect-error: TS2769
            player.sendForm(mc.newCustomForm().setTitle(const_1.pluginName).addInput('请输入搜索内容'), (0, util_1.callAsyncLogErr)(async (_, ret) => {
                if (!ret) {
                    await listPage(list, hasSearchBtn, page);
                    return;
                }
                const [str] = ret;
                if (!str.replace(/\s/g, '')) {
                    sendModalForm('请输入搜索内容！');
                    return;
                }
                const kwd = str.split(/\s/);
                const searched = files.filter((f) => {
                    for (const k of kwd)
                        if (!f.toLowerCase().includes(k.toLowerCase()))
                            return false;
                    return true;
                });
                if (searched.length === 0) {
                    sendModalForm('没有搜索到结果');
                    return;
                }
                await listPage(searched, false);
            }));
        };
        /** 跳页表单 */
        const jumpForm = async () => {
            // @ts-expect-error: TS2769
            player.sendForm(mc
                .newCustomForm()
                .setTitle(const_1.pluginName)
                .addSlider('请选择要跳转的页数', 1, pageTotal), (0, util_1.callAsyncLogErr)(async (_, ret) => {
                await listPage(list, hasSearchBtn, ret ? ret[0] : page);
            }));
        };
        // 主表单
        const btnPgUp = page > 1;
        const btnPgDn = page < pageTotal;
        const btnJump = pageTotal >= 2;
        const index = (page - 1) * pageLimit;
        const pageFiles = list.slice(index, index + pageLimit);
        const form = mc
            .newSimpleForm()
            .setTitle(const_1.pluginName + (hasSearchBtn ? '' : ' - 搜索结果'))
            .setContent(`§a页数 §e${page} §f/ §6${pageTotal} §7| §a总数 §e${listLength}`);
        // 搜索、跳页、翻页按钮的按钮添加与index计算
        let btnFileIndex = 0;
        let btnSearchIndex = 0;
        let btnJumpIndex = 0;
        let btnPgUpIndex = 0;
        if (hasSearchBtn) {
            form.addButton('§1搜索');
            btnSearchIndex = btnFileIndex;
            btnFileIndex += 1;
        }
        if (btnJump) {
            form.addButton('§1跳页');
            btnJumpIndex = btnFileIndex;
            btnFileIndex += 1;
        }
        if (btnPgUp) {
            form.addButton('§2<- 上一页');
            btnPgUpIndex = btnFileIndex;
            btnFileIndex += 1;
        }
        pageFiles.forEach((v) => {
            form.addButton(`§3${v}`);
        });
        if (btnPgDn) {
            form.addButton('§2下一页 ->');
        }
        player.sendForm(form, (0, util_1.callAsyncLogErr)(async (_, formIndex) => {
            if (formIndex === undefined)
                return;
            // 文件列表上方按钮index判断
            if (formIndex === btnSearchIndex && hasSearchBtn) {
                await searchForm();
                return;
            }
            if (formIndex === btnJumpIndex && btnJump) {
                await jumpForm();
                return;
            }
            if (formIndex === btnPgUpIndex && btnPgUp) {
                await listPage(list, hasSearchBtn, page - 1);
                return;
            }
            // 文件列表与下一页按钮index判断
            const fileIndex = formIndex - btnFileIndex;
            // logger.info(fileIndex);
            if (pageFiles.length < fileIndex + 1) {
                // 本页文件列表长度之外的按钮为下一页按钮
                await listPage(list, hasSearchBtn, page + 1);
                return;
            }
            await formGet(player, pageFiles[fileIndex]);
        }));
    };
    /** 主表单 */
    const main = async () => {
        await listPage(files);
    };
    await main();
}
exports.formFiles = formFiles;

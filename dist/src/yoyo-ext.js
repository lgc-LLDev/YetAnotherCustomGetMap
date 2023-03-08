"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const const_1 = require("./const");
const util_1 = require("./util");
const config_1 = require("./config");
let globalYoyo = null;
async function getPicLink(ev, arg) {
    const { message, group_id } = ev;
    const { client } = globalYoyo;
    const imageList = message.filter((v) => v.type === 'image');
    if (!imageList.length) {
        client.sendGroupMsg(group_id, '请在消息后带一张图片');
        return;
    }
    const [{ url }] = imageList;
    if (!url)
        return;
    let picName = arg || String(Date.now());
    try {
        const res = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        const { data, headers } = res;
        // console.log(headers);
        const extName = headers['content-type'].split('/').pop();
        picName += `.${extName}`;
        const picPath = (0, path_1.join)(const_1.imgPath, picName);
        if ((0, fs_1.existsSync)(picPath)) {
            client.sendGroupMsg(group_id, '图片路径下已有同名文件');
            return;
        }
        await (0, promises_1.writeFile)(picPath, data);
    }
    catch (e) {
        logger.error('保存图片失败');
        logger.error((0, util_1.formatError)(e));
        client.sendGroupMsg(group_id, '保存图片失败，请重试');
        return;
    }
    client.sendGroupMsg(group_id, `图片保存成功！\n可以使用指令【/${config_1.config.mainCommand} get "${picName}"】来获取地图画`);
}
function apply(yoyo) {
    globalYoyo = yoyo;
    const { listen } = yoyo;
    listen('messageGroup', (ev) => {
        const matches = [['上传地图画', getPicLink]];
        const message = (0, util_1.extractMsgPlaintext)(ev.message).trim();
        for (const [match, func] of matches) {
            const ok = typeof match === 'string'
                ? message.startsWith(match)
                : match.test(message);
            if (ok) {
                const arg = message.replace(match, '');
                func(ev, arg);
                return;
            }
        }
    });
}
const yoyoApiPath = (0, path_1.resolve)('plugins/nodejs/yoyorobot/llseapi.js');
if ((0, fs_1.existsSync)(yoyoApiPath)) {
    logger.info('检测到已安装 YoyoRobot，装载 Yoyo 扩展……');
    // eslint-disable-next-line
    require(yoyoApiPath)(apply, const_1.pluginName);
}
exports.default = {
    get yoyo() {
        return globalYoyo;
    },
};

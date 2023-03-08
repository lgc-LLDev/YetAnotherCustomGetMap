"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cutSize = exports.tmpPath = exports.imgPath = exports.dataPath = exports.pluginExtra = exports.pluginDescription = exports.pluginVersion = exports.pluginName = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const package_json_1 = require("../package.json");
exports.pluginName = 'YetAnotherCustomGetMap';
exports.pluginVersion = package_json_1.version.split('.').map((v) => Number(v));
exports.pluginDescription = package_json_1.description;
exports.pluginExtra = {
    Author: 'student_2333',
    License: 'Apache-2.0',
};
/** 插件数据文件夹 */
exports.dataPath = (0, path_1.join)('./plugins', exports.pluginName);
/** 用户存放图片文件夹 */
exports.imgPath = (0, path_1.join)(exports.dataPath, 'img');
/** 生成后的二进制文件临时存放文件夹 */
exports.tmpPath = (0, path_1.join)(exports.dataPath, 'tmp');
// 创建文件夹（临时文件夹在index.ts里清理并重新创建了）
[exports.dataPath, exports.imgPath /* , tmpPath */].forEach((p) => {
    if (!(0, fs_1.existsSync)(p))
        (0, fs_1.mkdirSync)(p);
});
/** 地图画宽高 */
exports.cutSize = 128;

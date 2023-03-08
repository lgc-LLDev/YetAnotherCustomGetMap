"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadConfig = exports.saveConfig = exports.config = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const const_1 = require("./const");
const configPath = (0, path_1.join)(const_1.dataPath, 'config.json');
exports.config = {
    mainCommand: 'yacgm',
    // onlyOP: true,
    pageLimit: 15,
    mainPageOP: false,
    getPageOP: false,
};
/**
 * 同步保存配置
 */
function saveConfig() {
    (0, fs_1.writeFileSync)(configPath, JSON.stringify(exports.config, null, 2));
}
exports.saveConfig = saveConfig;
/**
 * 同步重载配置文件
 */
function reloadConfig() {
    if (!(0, fs_1.existsSync)(configPath))
        saveConfig();
    else
        Object.entries(JSON.parse((0, fs_1.readFileSync)(configPath, { encoding: 'utf-8' }))).forEach((x) => {
            const [k, v] = x;
            Object.defineProperty(exports.config, k, { value: v });
        });
}
exports.reloadConfig = reloadConfig;
reloadConfig();

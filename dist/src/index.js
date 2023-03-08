"use strict";
// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const const_1 = require("./const");
const util_1 = require("./util");
logger.setTitle(const_1.pluginName);
(0, util_1.deleteTmpDirSync)();
if (!ll.require('CustomMap.dll')) {
    throw ReferenceError('依赖插件 CustomMap.dll 未加载！');
}
(async () => {
    await Promise.resolve().then(() => __importStar(require('./config'))); // 先初始化配置
    await Promise.resolve().then(() => __importStar(require('./command')));
    await Promise.resolve().then(() => __importStar(require('./yoyo-ext')));
})().catch(util_1.throwToMain);
ll.registerPlugin(const_1.pluginName, const_1.pluginDescription, const_1.pluginVersion, const_1.pluginExtra);

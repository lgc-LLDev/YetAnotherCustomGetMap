"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMsgPlaintext = exports.emptyCallback = exports.deleteTmpDirSync = exports.callAsyncLogErr = exports.sleep = exports.logError = exports.formatError = exports.throwToMain = void 0;
const fs_1 = require("fs");
const const_1 = require("./const");
/**
 * 把错误甩出去
 * @param e 错误内容
 */
function throwToMain(e) {
    setTimeout(() => {
        throw e;
    }, 0);
}
exports.throwToMain = throwToMain;
/**
 * 格式化错误堆栈
 * @param e 错误对象
 * @returns 格式化后的错误
 */
function formatError(e) {
    let msg = e;
    if (e instanceof Error)
        msg = e.stack || e.message;
    return String(msg);
}
exports.formatError = formatError;
/**
 * 输出错误到控制台
 * @param e 错误
 */
function logError(e) {
    logger.error(`插件出错！\n${formatError(e)}`);
}
exports.logError = logError;
/**
 * 延时
 * @param time 时长，单位 ms
 */
function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
exports.sleep = sleep;
/**
 * wrapper，给async function套一层sync function，当async function运行出错时会打印错误
 * @param func async function
 * @returns wrapped sync function
 */
function callAsyncLogErr(func) {
    return (...args) => {
        setTimeout(() => func(...args).catch(logError), 0);
    };
}
exports.callAsyncLogErr = callAsyncLogErr;
/**
 * 清理临时文件目录
 */
function deleteTmpDirSync() {
    logger.info('清除临时文件目录……');
    try {
        if ((0, fs_1.existsSync)(const_1.tmpPath))
            (0, fs_1.rmSync)(const_1.tmpPath, { recursive: true, force: true });
        (0, fs_1.mkdirSync)(const_1.tmpPath);
        logger.info('清除临时文件目录完毕！');
    }
    catch (e) {
        logger.error(`清除临时文件目录失败！\n${formatError(e)}`);
    }
}
exports.deleteTmpDirSync = deleteTmpDirSync;
/** 工具 空函数 */
const emptyCallback = () => { };
exports.emptyCallback = emptyCallback;
function extractMsgPlaintext(msg) {
    return msg.filter((v) => v.type === 'text')
        .map((v) => v.text)
        .join('');
}
exports.extractMsgPlaintext = extractMsgPlaintext;

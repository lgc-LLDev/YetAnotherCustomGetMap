"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.giveMap = exports.mapGetControls = void 0;
const path_1 = require("path");
const config_1 = require("./config");
const util_1 = require("./util");
exports.mapGetControls = {};
/**
 * 将二进制文件名（或路径）解析为MapName接口结构
 * 格式 <文件名>-<行号>_<列号>
 * @param map 文件名
 * @returns MapName，格式不匹配返回undefined
 */
function parseMapName(map) {
    const res = /(?<baseName>[\s\S]+)-(?<rowH>[0-9]+)_(?<rowV>[0-9]+)/.exec((0, path_1.basename)(map));
    if (res) {
        const { groups } = res;
        if (groups) {
            const { baseName, rowH, rowV } = groups;
            return {
                baseName,
                rowH: Number(rowH),
                rowV: Number(rowV),
                fullPath: map,
            };
        }
    }
    return undefined;
}
/**
 * 新建获取地图任务
 * @param xuid 玩家xuid
 * @param files 二进制文件路径数组
 * @param size 地图大小 [宽, 高]（方块），用于显示
 */
function giveMap(xuid, files, size) {
    mc.getPlayer(xuid)?.tell(`§a现在，空出主手，地图将会一个一个补上`);
    const parsedMaps = files.map(parseMapName);
    const listLength = parsedMaps.length;
    const sizeTxt = size.join(' × ');
    let mapIndex = -1;
    let taskId;
    /** 停止任务 */
    const clearTask = () => {
        clearInterval(taskId);
        delete exports.mapGetControls[xuid]; // 删除控制函数
    };
    /** 格式化MapName为action bar提示 */
    const formatTip = (map) => {
        if (map) {
            const { baseName, rowH, rowV } = map;
            return (`§dYACGM §7| ` +
                `§b${baseName} §a(${sizeTxt}) §7| ` +
                `§f第 §e${rowV + 1} §f行 第 §e${rowH + 1} §f列 §7| ` +
                `§f已给予 §e${mapIndex + 1} §f/ §6${listLength}`);
        }
        return `§dYACGM §7| §b地图画大小 §a${sizeTxt} §b方块 §7| §b请空出主手`;
    };
    let tipTxt = formatTip();
    taskId = setInterval((0, util_1.callAsyncLogErr)(async () => {
        const player = mc.getPlayer(xuid); // 动态获取玩家对象
        if (!player) {
            clearTask();
            return;
        }
        if (mapIndex + 1 === listLength) {
            // player.tell('§a给予完毕！');
            // clearTask();
            // return;
            tipTxt = `§dYACGM §7| §a给予完毕 §7| §b使用 §6/${config_1.config.mainCommand} stop §b退出`;
        }
        else {
            const currentMap = parsedMaps[mapIndex];
            const mainHand = player.getHand();
            if (mainHand.isNull()) {
                // 主手为空，获取下一张地图
                const mapItem = mc.newItem('minecraft:filled_map', 1);
                if (!mapItem)
                    return;
                mainHand.set(mapItem);
                player.refreshItems();
                await (0, util_1.sleep)(0);
                const nextMap = parsedMaps[mapIndex + 1];
                if (nextMap) {
                    const { fullPath } = nextMap;
                    // CustomMap不认反斜杠路径
                    if (!player.runcmd(`map "${fullPath.replace(/\\/g, '/')}"`))
                        return;
                    mapIndex += 1;
                    tipTxt = formatTip(nextMap);
                }
            }
            else {
                tipTxt = formatTip(currentMap);
            }
        }
        player.tell(tipTxt, 5);
    }), 50);
    /** 暴露给外面的停止给予 控制函数 */
    const stopGive = (player) => {
        player.tell('已停止给予');
        clearTask();
    };
    /** 跳页控制函数 */
    const jumpMapIndex = (player, index, addIndexTip = false) => {
        if (index < 0) {
            player.tell(addIndexTip ? '§c已经是第一张地图了' : '§c序号超出范围');
        }
        else if (index > listLength - 1) {
            player.tell(addIndexTip ? '§c已经是最后一张地图了' : '§c序号超出范围');
        }
        else {
            mapIndex = index - 1;
            player.tell(`§a已跳转到第 §6${index + 1} §a张地图前，请§b空出主手获取§a该地图`);
        }
    };
    // add or reduce index one by one 效果不理想（萌新菜菜 大佬带带）
    // const addMapIndex = (player: Player, addOrReduce: boolean) => {
    //   const num = addOrReduce ? 1 : -1;
    //   // mapIndex 是已经给予过的地图Index
    //   jumpMapIndex(player, mapIndex + num, true);
    // };
    // 暴露控制函数
    exports.mapGetControls[xuid] = { stopGive, /* addMapIndex, */ jumpMapIndex };
}
exports.giveMap = giveMap;

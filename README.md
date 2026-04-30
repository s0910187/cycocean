# 夜巡录：荒庙篇

一个志怪主题的卡牌构筑 roguelike 小原型。当前版本采用 `React + Phaser + TypeScript`：React 负责复杂卡牌 UI，Phaser 负责战斗舞台、角色、背景和特效。

## 当前内容

- 游方夜巡人 1 名角色
- 20 张左右卡牌
- 符印、香火、格挡、虚弱、易伤、法门
- 地图节点、普通战、精英战、Boss 战
- 事件、休整、商店、删牌、升级
- 背景音乐、攻击音效、技能音效和 UI 音效
- React + Phaser 战斗舞台、拖拽出牌、结算视频
- 生成背景、主角、敌人立绘、卡牌边框与 UI 素材

## 启动

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

然后访问终端里显示的本地地址，通常是 `http://127.0.0.1:5173`。

## 客户端打包

本地客户端预览：

```bash
npm run desktop
```

生成本机客户端目录：

```bash
npm run desktop:pack
```

生成正式安装包：

```bash
npm run desktop:dist
```

产物会输出到 `release/`。

## 规划

详细设计见：

- `docs/PLANNING.md`
- `docs/FIRST_ACT_DEMO_ROADMAP.md`
- `docs/IMPLEMENTATION_DETAILS.md`
- `docs/PACKAGING_DISTRIBUTION.md`

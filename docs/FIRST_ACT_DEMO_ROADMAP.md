# 第一大关完善 Demo 路线图

## 目标

把《夜巡录：荒庙篇》的第一大关做成一个完整竖切 demo：玩家从标题页进入地图，沿分岔路线经历普通战、精英、怪事、商店、休整，最终击败山君，并在战斗、结算、奖励和过关之间看到连续的视觉反馈。

这个阶段不追求大规模内容扩张，而是让已有系统达到“该有的都有、每个模块都像游戏”的完成度。

## 当前状态

- React + Phaser 混合架构已经落地。
- 第一关路线、卡组循环、奖励、事件、商店、休整、Boss 胜利流程已可玩。
- 战斗画面已有正式背景、玩家角色、水鬼、山君、卡牌边框、核心 UI 图标。
- 原始大素材包已放在 `素材/`，并通过 `.gitignore` 排除；精选素材进入 `assets/vendor/shushan/`。
- 已有 Git 初始版本和 UI 清理提交。

## 主要缺口

### 1. 敌人形象覆盖不足

当前敌人数据里有：

- 灯笼精
- 披蓑水鬼
- 庙祝尸
- 山魈
- 黑坛术士
- 画皮影
- 山君

其中水鬼、山君已经有较正式的位图。灯笼精、庙祝尸、山魈、黑坛术士、画皮影还需要更统一、更有辨识度的形象。

验收目标：

- 每个敌人至少有一张透明背景战斗立绘。
- 普通怪、精英、Boss 轮廓差异明显。
- 战斗舞台里每个敌人的缩放、落点、血条位置都适配。
- 敌人死亡时能触发对应结算动画，而不是直接跳奖励。

### 2. 怪事、商店、休整还不够游戏化

目前事件和商店更像“文字面板 + 按钮”。第一关 demo 需要它们像 Slay the Spire 那样成为路线体验的一部分。

怪事需要：

- 每个事件有一张场景图或角色插画。
- 选项用图文按钮或道具牌形式呈现。
- 选择后有短反馈，例如获得遗物、失血、升级、删牌的动效和日志强化。

商店需要：

- 阴市摊主或摊位背景。
- 卡牌商品直接显示完整卡牌，而不是文本条目。
- 遗物商品显示图标、名称、价格和说明。
- 删牌服务做成“烧旧牌”交互，而不是普通按钮。
- 买不起、已售、可购买三种状态要清楚。

休整需要：

- “静坐调息”和“朱砂重描”有明确图标或场景。
- 治疗/升级后有反馈动画，再回地图。

### 3. 战斗结算缺少过场

目前击败敌人后直接进入奖励界面，缺少“赢了”的节奏点。第一关 demo 应加入短结算动画。

目标流程：

1. 敌人 HP 归零。
2. 冻结战斗输入，播放死亡/退散反馈。
3. 播放一段短结算视频。
4. 进入奖励界面。

普通怪建议 2-4 秒，精英 4-6 秒，Boss 8-15 秒。

### 4. Boss 过关演出

山君作为第一关终点，需要更强的完成感。

目标：

- Boss 战前有短入场或压迫感强化。
- 击败后播放更长过关动画。
- 动画结束后进入胜利页，或者直接展示“雾散天明”的通关结算。

## Seedance 2.0 视频管线

你的 Seedance 方案可以作为第一关 demo 的核心质感提升点。我们在代码里把它当作“可选视频资产”，先设计资产规范和播放流程。

### 每个战斗结算视频需要的输入

1. 战斗 CG 参考图  
   一张 3D CG 游戏截图感的图，必须包含玩家和当前敌人，角色形象要和战斗中立绘一致。

2. 结算界面参考图  
   一张“敌人退散 / 获得奖励前”的结算画面，用来约束视频最后落点。

Seedance 输出后，我们将视频压缩成 Web 友好的格式并接入游戏。

### 建议资产结构

```text
assets/generated/cinematics/
  combat-lantern-reference.png
  combat-lantern-result.png
  victory-lantern.webm
  combat-waterghost-reference.png
  combat-waterghost-result.png
  victory-waterghost.webm
  combat-templecorpse-reference.png
  combat-templecorpse-result.png
  victory-templecorpse.webm
  combat-macaque-reference.png
  combat-macaque-result.png
  victory-macaque.webm
  combat-warlock-reference.png
  combat-warlock-result.png
  victory-warlock.webm
  combat-foxshade-reference.png
  combat-foxshade-result.png
  victory-foxshade.webm
  boss-tigerlord-reference.png
  boss-tigerlord-result.png
  victory-tigerlord.webm
```

### 游戏内播放策略

- 新增 `screen: "cinematic"` 或 `pendingCinematic` 状态。
- `winCombat` 不再直接跳奖励或胜利，而是先记录：
  - `enemyId`
  - `combatType`
  - `nextScreen`
  - `reward` 或 `victory`
- 如果对应视频存在，播放视频。
- 如果视频不存在，走当前即时跳转逻辑，保证开发期不阻塞。
- 视频结束或点击跳过后进入奖励/胜利。

### 视频压缩建议

- 普通怪：`webm`，720p，2-4 秒，目标 1-3 MB。
- 精英：`webm`，720p，4-6 秒，目标 3-6 MB。
- Boss：`webm`，720p 或 1080p，8-15 秒，目标 8-18 MB。
- 保留静帧 fallback：如果视频加载失败，显示结算参考图并继续。

## 第一关 Demo 完成清单

### P0：战斗完整感

- 补齐 5 个缺失敌人立绘。
- 每个敌人设定战斗尺寸、位置和阴影。
- 敌人死亡先进入结算过场。
- 奖励界面强化为“战利品”场景。
- Boss 胜利播放长过场。

### P1：非战斗模块游戏化

- 怪事界面增加事件插画。
- 事件选项改成图文选择卡。
- 商店增加阴市摊位/摊主视觉。
- 商店卡牌商品直接使用 `GameCard`。
- 遗物商品使用遗物图标。
- 休整界面增加场景与图标反馈。

### P2：视听反馈

- 敌人死亡音效。
- 奖励出现音效。
- 买牌、删牌、升级、回血各自有音效。
- Boss 战使用单独音乐。
- 视频播放时音量 ducking，结束后恢复战斗/地图音乐。

### P3：打磨与验收

- 一局能稳定从开始走到山君。
- 所有路线节点都能完成，无空白或临时 UI。
- 所有敌人都有形象。
- 所有胜利都有结算动画或静帧 fallback。
- 商店、事件、休整都像游戏界面。
- 桌面视口无明显遮挡，窄屏可操作。
- `npm run build` 通过。

## 推荐执行顺序

1. 补敌人立绘和 Phaser 站位。
2. 加 `cinematic` 状态与视频 fallback 播放器。
3. 为水鬼或灯笼精先做第一条 Seedance 结算视频试跑。
4. 重做奖励界面，让视频落点接战利品界面。
5. 重做商店界面。
6. 重做怪事/休整界面。
7. 做 Boss 过关视频和胜利页。

第一条视频跑通以后，后面的敌人就是批量生产和接线。

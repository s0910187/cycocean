# 《夜巡录：荒庙篇》客户端打包与分发方案

## 1. 结论

当前主线分发方案改为 Electron 客户端：

- 玩家下载一个客户端包，不需要自己装 Node、开浏览器或跑命令。
- 游戏本体仍然是 React + Phaser + Vite 构建出的静态前端。
- Electron 只负责提供桌面窗口、应用菜单、图标和本地文件加载。
- GitHub 仍然有用，但主要用于 GitHub Releases 托管安装包，而不是只做网页试玩。

这条路线最适合当前阶段：开发成本低，能最快把 demo 发给别人玩。

## 2. 为什么选 Electron

候选方案有三个：

1. 继续用浏览器网页。
2. Electron。
3. Tauri。

浏览器网页最轻，但用户感知上还是“打开一个网页”，不像一个游戏客户端。Tauri 包体更小，但需要 Rust 和平台依赖，对当前 demo 来说会把精力拖到工程环境上。

Electron 的优势是：

- 和当前 Vite/React 项目天然兼容。
- 不改游戏核心代码。
- macOS、Windows 都能打包。
- GitHub Actions 可以自动产出不同平台的安装包。
- 音频、视频、本地资源路径都比较稳。

缺点也明确：

- 包体会比较大。
- 未签名应用在 macOS 和 Windows 上会有安全提示。
- 正式商业发行前要处理代码签名、公证、安装器体验。

对于“先让大家玩到一个完整 demo”，Electron 是最实际的选择。

## 3. 当前已经接入的客户端能力

新增文件：

```text
electron/main.cjs
.github/workflows/build-desktop.yml
desktop-assets/icon.png
desktop-assets/icon.ico
public/favicon.png
assets/marketing/icon.png
```

新增脚本：

```bash
npm run desktop
npm run desktop:pack
npm run desktop:dist
```

脚本含义：

- `npm run desktop`：先构建 Web，再用 Electron 打开客户端窗口，适合本地快速看效果。
- `npm run desktop:pack`：生成未压缩的本机客户端目录，适合验证打包能否启动。
- `npm run desktop:dist`：生成正式分发文件，例如 macOS 的 dmg/zip、Windows 的 exe/zip。

## 4. 本地打包流程

### 4.1 开发预览

```bash
npm run dev
```

用于日常开发，还是浏览器最快。

### 4.2 客户端启动验证

```bash
npm run desktop
```

这个命令会：

1. 执行 `npm run build`。
2. 用 Electron 加载 `dist/index.html`。
3. 打开一个桌面窗口运行游戏。

### 4.3 生成本机客户端目录

```bash
npm run desktop:pack
```

这个命令会输出到：

```text
release/
```

通常会看到一个类似这样的目录：

```text
release/mac-arm64/夜巡录：荒庙篇.app
```

这一步适合开发期验证，不适合直接群发。

### 4.4 生成正式分发包

```bash
npm run desktop:dist
```

macOS 上通常会生成：

```text
release/Night-Patrol-0.2.0-mac-arm64.dmg
release/Night-Patrol-0.2.0-mac-arm64.zip
```

Windows 包建议交给 GitHub Actions 在 Windows runner 上生成，不建议在 macOS 本地强行交叉打包。

当前 macOS demo 包使用 ad-hoc 签名：

```text
mac.identity = "-"
```

这表示用匿名本地签名满足 Apple Silicon app bundle 的基本要求，不访问本机 Developer ID 私钥，也不会弹 codesign 密钥授权。它不是 Apple 公证签名，所以发给别人时仍然可能触发“无法验证开发者”的系统提示。

## 5. GitHub Releases 分发流程

### 5.1 上传仓库

建议仓库名：

```text
night-patrol-spire
```

示例：

```bash
git remote add origin git@github.com:<your-name>/night-patrol-spire.git
git push -u origin main
```

### 5.2 自动构建客户端

当前已加入 workflow：

```text
.github/workflows/build-desktop.yml
```

触发方式：

- 手动：GitHub Actions 页面点击 `Run workflow`。
- 自动：推送 tag，例如 `v0.2.0-demo`。

它会在两个平台构建：

- `macos-latest`
- `windows-latest`

产物会作为 workflow artifact 上传。如果是 tag 触发，还会自动附加到 GitHub Release。

Release 页面只上传玩家需要下载的安装包和压缩包：

```text
Night-Patrol-0.2.0-mac-arm64.dmg
Night-Patrol-0.2.0-mac-arm64.zip
Night-Patrol-0.2.0-win-x64.exe
Night-Patrol-0.2.0-win-x64.zip
```

Electron Builder 仍会在本地生成 blockmap/yml 等自动更新元数据，但 demo 发布阶段不把它们展示给玩家。

### 5.3 发布一个 demo tag

```bash
git tag v0.2.0-demo
git push origin v0.2.0-demo
```

等 Action 跑完后，在 GitHub Release 页面补充：

- 试玩说明。
- 更新内容。
- 已知问题。
- 截图或录屏。

## 6. 玩家下载说明

### macOS

如果没有做 Apple Developer 签名和公证，玩家第一次打开可能会看到“无法验证开发者”。

临时说明：

```text
下载 dmg 后拖入 Applications。如果提示无法打开，请右键点击应用，选择“打开”，再确认一次。
```

更正式的解决方案：

- 购买 Apple Developer Program。
- 配置 Developer ID Application 证书。
- Electron Builder 开启 signing 和 notarization。

注意：不要在 demo 打包阶段让 electron-builder 自动发现 Developer ID 证书，否则它会尝试访问钥匙串里的私钥，macOS 会弹 codesign 密钥授权。当前配置已经通过 `identity: "-"` 避开这件事。

当前 demo 阶段可以先不做。

### Windows

未签名安装包可能触发 SmartScreen。

临时说明：

```text
如果 Windows 提示未知发布者，请点击“更多信息” -> “仍要运行”。
```

更正式的解决方案：

- 购买代码签名证书。
- 配置 electron-builder 的 Windows signing。

## 7. 图标方案

当前已经有 GPT-image 2.0 生成的客户端图标：

```text
public/favicon.png
desktop-assets/icon.png
desktop-assets/icon.ico
assets/marketing/icon.png
assets/marketing/icon-gpt-image-2.png
```

图标方向是深色符纹底、城隍印/法印主体和狂放毛笔字“夜巡”，比临时八卦图标更接近网游客户端入口图标。

后续如果继续迭代，可以围绕这些方向做第二版：

- 半枚破损城隍印。
- 暗金符纹。
- 雾青色灵光。
- 荒庙夜色轮廓。
- 更强的毛笔字势。
- 小尺寸可读。
- 不要文字、水印、复杂背景。

提示词草案：

```text
Square game app icon for a Chinese supernatural deckbuilding roguelike. A broken golden City God seal floating in dark teal mist, subtle talisman lines glowing with jade light, faint abandoned temple silhouette behind it, cinematic xianxia horror mood, high contrast, centered composition, readable at small size, no text, no watermark, no UI frame.
```

当前输出结构：

```text
assets/marketing/icon-gpt-image-2.png
assets/marketing/icon.png
public/favicon.png
desktop-assets/icon.png
desktop-assets/icon.ico
```

macOS 的 `.icns` 由 electron-builder 在打包时根据 `desktop-assets/icon.png` 自动生成。

## 8. 客户端体积与资源策略

当前包体偏大的主要原因：

- Electron 自带 Chromium。
- 大尺寸敌人立绘。
- 背景图。
- 背景循环视频。
- 结算视频。

短期接受这个体积是合理的，因为 demo 需要完整视听效果。

后续优化顺序：

1. 压缩结算视频。
2. 大 PNG 转 WebP。
3. 战斗外视频按需加载。
4. 商店、事件、结算模块拆成懒加载 chunk。
5. 若项目长期化，再评估 Tauri。

## 9. 运营物料清单

发布客户端时至少需要：

- 游戏图标。
- 标题页截图。
- 战斗页截图。
- 地图页截图。
- Boss 或结算页截图。
- 30-60 秒横版录屏。
- 一段 150 字以内简介。
- Release 更新说明。
- macOS/Windows 打开说明。

建议截图规格：

- 横版：1920x1080 或 1280x720。
- Release 封面：1200x630。
- 短视频平台封面：1080x1920。

## 10. 宣传文案草案

一句话：

```text
《夜巡录：荒庙篇》是一个志怪题材卡牌构筑 roguelike demo：用符箓、剑诀、香火和奇物，在荒庙夜路里拼出活到天明的牌组。
```

短介绍：

```text
永宁县外，荒庙重燃残香，夜雾倒流。你扮演游方夜巡人，带着半枚城隍印上路，在分岔路线中遭遇水鬼、灯笼精、黑坛术士和山君。每一场战斗后选择新牌、遗物或风险事件，把一套临时牌组越滚越强。
```

开发幕后角度：

```text
这是一个由完全不懂游戏开发的玩家和 AI 助手合作做出的第一关竖切 demo。我们从《杀戮尖塔》的构筑爽感出发，换成中国志怪题材，一边截图反馈，一边改 UI、数值、素材、音效和演出，最终打包成可下载客户端。
```

## 11. 素材授权注意事项

公开分发客户端前要确认素材授权。

当前素材来源包括：

- 用户下载并筛选的素材包。
- AI 生成图像和视频。
- 本地音频素材。
- 代码生成或手工整理的 UI。

建议 README 或 Release 里保留说明：

```text
本项目为个人学习与原型展示 demo。部分视觉素材来自用户已下载素材包并经过筛选整理，部分为 AI 生成素材。若后续进入正式公开发行或商业化阶段，需要重新确认所有素材授权或替换为自有资产。
```

## 12. 推荐执行顺序

现在最短路径：

1. 跑通 `npm run desktop:pack`。
2. 跑通 `npm run desktop:dist`，拿到本机安装包。
3. 在 GitHub 建仓库并 push。
4. 打 `v0.2.0-demo` tag，让 GitHub Actions 构建 macOS 和 Windows 包。
5. 补正式图标。
6. 截图、录屏、写 Release。
7. 发给第一批朋友试玩。

这个顺序比先做网页试玩更贴合“发客户端给大家玩”的目标。

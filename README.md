# 力扣 Top100 本地 Java 训练场

一款免登录、离线可用的力扣 Top100 题 Java 刷题工具，内置网页编辑器、本地 Java 编译执行、题目提示和 AI 助手。支持桌面端（Tauri）和 Web 双模式。

## 特性

- **101 道 Top100 真题** — 包含题目描述、测试用例、最优解 / 最易记忆解 / 关键字提示
- **本地 Java 编译运行** — 通过 `javac` + `java` 在本地真实执行代码，无需远程判题
- **Monaco 代码编辑器** — 关键字补全、语法高亮、Java 模板自动生成
- **可收起题目侧边栏** — 已通过的题目自动标记
- **三栏视图切换** — 题目 / 提示 / 问AI
- **问 AI** — 支持配置任意 OpenAI 兼容 API（不存储密钥，每次填写）
- **超时开关 / 代码提示开关** — 按需控制执行和编辑体验
- **桌面版（Tauri）** — 单文件分发，无 CORS 限制，AI 请求走 Rust 后端代理
- **Web 开发模式** — `npm run dev` 即可浏览器访问

## 桌面版下载

前往 [Releases](https://github.com/tyza66/leetcode-top100-java-local-fastpass/releases) 下载对应平台安装包：

| 平台 | 格式 |
|------|------|
| macOS (Apple Silicon) | `.dmg` (aarch64) |
| macOS (Intel) | `.dmg` (x64) |
| Windows | `.msi` / `.exe` |
| Linux | `.deb` / `.AppImage` / `.rpm` |

每次发布附带 `checksums-md5.txt` 与 `checksums-sha1.txt`，可校验完整性。
Windows MSI 内部版本使用 `1.0.0`，这是 MSI 对版本字段的最大值限制；Release 标签和应用版本仍使用日期版本号。

### macOS 首次打开

macOS 版使用 ad-hoc 签名，但没有 Apple Developer ID 签名和公证。通过浏览器下载后，macOS 会给应用加隔离属性，可能提示“已损坏，无法打开”。先校验 DMG 的 checksum，安装到“应用程序”后，在终端执行：

```bash
xattr -dr com.apple.quarantine "/Applications/LeetCode Top100 Java.app"
```

也可以检查签名是否完整：

```bash
codesign --verify --deep --strict --verbose=4 "/Applications/LeetCode Top100 Java.app"
codesign -dv --verbose=4 "/Applications/LeetCode Top100 Java.app"
```

`codesign -dv` 输出 `Signature=adhoc` 且 `codesign --verify` 通过即表示包内签名完整；`spctl` 拒绝是未公证分发的预期行为。

## 开发

### 前置要求

- Node.js ≥ 22
- Rust 稳定版（桌面版需要）
- JDK（运行 Java 代码需要 `javac` 和 `java` 在 PATH 中）

### Web 开发模式

```bash
npm install
npm run dev
```

启动后访问 `http://localhost:5173`，API 服务会自动代理到 `http://127.0.0.1:8787`。

### 桌面版（Tauri）

```bash
npm install
npm run tauri dev      # 开发模式
npm run tauri build    # 打包当前平台安装包
```

### 目录结构

```
.
├── src/                  # Vue3 前端源码
│   ├── components/       # 题目列表、编辑器、提示、AI面板等组件
│   ├── lib/              # 状态管理、API 客户端、编辑器模板
│   ├── App.vue           # 主布局
│   └── main.js           # 入口
├── server/               # Web 模式下的 Node API 服务
├── src-tauri/            # Tauri Rust 后端
│   └── src/
│       ├── lib.rs        # 命令注册入口
│       ├── problems.rs   # 编译嵌入 data/ 目录，运行时读取
│       ├── harness.rs    # Java 测试 harness 生成
│       ├── java_runner.rs# javac 编译 + java 执行 + 结果解析
│       ├── ai.rs         # AI 请求代理（桌面端无 CORS）
│       └── types.rs      # Java 类型映射与字面量生成
├── data/                 # 101 道题的数据（problems / hints / solutions）
├── scripts/              # 题库抓取脚本
├── index.html
├── vite.config.js
└── package.json
```

## 配置项

在"问AI"面板中填写（不存储，每次打开应用重新填写）：

- **API Base** — OpenAI 兼容接口地址，如 `https://api.openai.com/v1`
- **API Key** — 接口密钥
- **Model** — 模型名称，如 `gpt-4o`

## CI/CD

GitHub Actions (`.github/workflows/release.yml`) 在 push `v*` 标签时自动打包三平台桌面版并发布 Release：

- macOS aarch64 + x64
- Windows x64
- Linux x64

发布产物包含安装包及 `checksums-md5.txt` / `checksums-sha1.txt` 校验文件。

## 许可

[MIT](LICENSE) © 2026 tyza66

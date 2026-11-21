# FreeSWITCH 中文版维护说明

英文原文保留在 `docs/`，简体中文位于
`i18n/zh-Hans/docusaurus-plugin-content-docs/current/`，相对路径一致。
未翻译页面由 Docusaurus 回退为英文，不将英文副本计为中文翻译。

当前已完成 26/200 篇，未完成页面继续回退英文。

- 基础知识目录：全部完成
- 配置系统目录：全部完成
- 完整示例目录：全部完成
- 故障排查目录：全部完成
- 另已完成首页及第 3–7 部分概览

下一批从用户与端点目录继续。后续只翻译并做一致性检查，构建由用户手动执行。

## 本地预览与构建

在 WSL Ubuntu 的项目目录中执行，要求 Node.js >= 20：

```bash
npm ci
npm run start:zh -- --host 0.0.0.0
```

中文地址：http://localhost:3000/freeswitch/zh-Hans/ 。
`npm start` 预览英文，地址为 http://localhost:3000/freeswitch/ 。
开发服务器一次只运行一种语言；完整构建后可通过导航栏切换语言。

```bash
npm run translations:check
npm run build
npm run serve -- --host 0.0.0.0
```

构建输出位于 `build/`，中文位于 `build/zh-Hans/`。
保持严格的 MDX、站内链接与锚点检查，不将报错降为警告。
局部翻译时，链接 hook 仅将确实存在的原文 MDX 目标解析为中文路由，
再交由构建器校验最终页面和锚点；不改写 Markdown 源文件中的链接。
若 WSL 未安装 npm 但已有 Corepack，可使用 `corepack npm`。
其中构建命令使用 `corepack npm run build:root`，避免 `build` 包装脚本再次调用系统 npm。

## 增量翻译与进度

```bash
npm run translations:status
npm run translations:record -- foundations/introduction.mdx
npm run translations:check
```

`translation-manifest.json` 仅记录已完成页面的原文与译文 SHA-256。
状态统计从当前文件计算：`translated` 已记录且未变、`stale` 原文已更新、
`modified` 译文已修改但未重新确认、`unrecorded` 译文未登记、
`missing` 尚未翻译。缺少译文是试译阶段的正常状态，不导致检查失败。
原文删除或改名、代码块或链接改变、受保护的 front matter 标识改变会报错。

同步英文后先查看状态，只重新翻译变化的页面。完成审阅后用 `record` 明确指定文件，
再运行检查与双语构建。脚本不会调用付费翻译服务，也不会自动下载或覆盖上游文档。
SHA-256 记录表示翻译所依据的版本，不代表已经过协议行为的独立技术核实。

## 翻译规则

- 翻译标题、说明、正文和可见组件文案
- 保留代码块（包括其中的英文注释）、命令、配置键、API、文件路径和 URL
- 保留 MDX 组件、导入、`id`、`slug`、`sidebar_position` 和链接目标
- 中文标题通过显式 `{#original-anchor}` 保留英文锚点，避免其他页面链接失效
- 每批控制在约 10 篇，完成后运行检查和构建，技术语义按英文原文翻译
- 自动检查不能代替人工核对参数、协议语义及翻译完整性

| 英文 | 统一译法 |
| --- | --- |
| Call Leg | 呼叫腿（A 腿 / B 腿） |
| Dialplan | 拨号计划 |
| Bridge | 桥接 |
| Early Media | 早期媒体 |
| SIP Profile | SIP 配置实例（Profile） |
| Channel Variable | 通道变量 |
| Bypass Media | 媒体旁路 |
| Event Socket | 事件套接字（ESL） |
| Directory | 用户目录 |
| Codec | 编解码器 |

界面翻译资源通过 `npm run write-translations -- --locale zh-Hans` 生成。
侧边栏和页脚翻译分别在 `current.json` 与 `docusaurus-theme-classic/footer.json`。
现有搜索使用远程 Typesense 英文索引；本批未建立中文搜索索引，因此暂不承诺中文全文搜索。

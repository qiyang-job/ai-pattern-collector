# AI 用户路径组件最佳实践

> 研究日期：2026-06-22  
> 适用范围：AI Chat、AI Search、AI Agent、AI Workspace、Coding Agent  
> 目标：将项目内部 Pattern Taxonomy、现有截图样本与公开 AI 产品实践合并成可用于 Figma 组件设计的节点规范。

## 1. 研究方法与边界

本规范使用三类证据：

1. 项目方法论：J-01～J-09、14 种 Screenshot State、8 类 Pattern Category 与 8 维 Lens。
2. 项目样本：`recovered-screenshots/` 中的 10 张输入、上下文、思考、记忆、分支、审阅、错误与交接案例。
3. 外部资料：ChatGPT、Claude、Gemini、GitHub Copilot、Notion AI、Perplexity 的官方帮助与文档；少量公开 GitHub issue 用于识别交互反模式。

官方功能文档用于观察产品机制；下文的组件归纳与优先级属于基于多产品共性的设计推论。

## 2. 跨路径的稳定原则

### 2.1 AI 组件表达的是协作契约

一个完整组件应按需要表达：

- 用户要什么
- AI 使用什么上下文
- AI 接下来做什么
- 当前做到哪里
- 用户何时可以干预
- 结果如何验证
- 失败后保留什么
- 输出如何进入下一步

### 2.2 过程透明不等于展示原始思维链

优先展示用户可判断的信息：计划、当前步骤、工具动作、影响范围、证据、风险和验证结果。不要把内部推理文本当作主要界面内容。

### 2.3 控制强度应与风险匹配

- 只读、可撤销动作可以低干扰执行。
- 写入、发送、发布、付费、删除和权限扩张需要明确确认。
- 相同权限不应无意义地重复询问；批准范围和持续时间必须可理解。

### 2.4 Failure Recovery 是横切能力

失败恢复不能只在 J-09 出现。输入、上下文、计划、执行、验证和导出都需要对应的 Error、Retry、Fallback、Undo 或 Manual takeover 表达。

## 3. Journey 总览

| Journey | 用户核心问题 | 主要 Pattern | 关键 Screenshot State | 组件家族 |
| --- | --- | --- | --- | --- |
| J-01 Entry | 我可以从哪里开始或继续？ | Intent Input | Idle、Follow-up Ready | Mode Launcher、Resume Item、Starter Template |
| J-02 Intent Capture | 系统是否准确理解目标与约束？ | Intent Input | Inputting、Context Ready | Intent Composer、Constraint Builder、Clarification Card |
| J-03 Context Building | AI 正在使用哪些信息，边界是什么？ | Context Management | Context Ready、Reviewing | Context Tray、Source Picker、Scope Summary、Memory Boundary |
| J-04 Planning | AI 准备怎么做，是否符合预期？ | Planning & Reasoning、Trust | Thinking、Planning Ready、Waiting Approval | Plan Review、Step List、Scope Preview、Start Gate |
| J-05 Execution | AI 当前在做什么，我能否干预？ | Execution Feedback、Trust | Running、Streaming、Waiting Approval、Error | Agent Activity、Tool Call、Approval Gate、Steering Composer |
| J-06 Feedback | 任务是否持续推进，已经产出什么？ | Execution Feedback | Running、Streaming、Completed、Error | Progress Summary、Milestone、Partial Result、Attention Notice |
| J-07 Verification | 结果为什么可信，修改是否安全？ | Trust & Verification | Reviewing、Completed、Error | Evidence Card、Diff Viewer、Test Result、Review Checklist |
| J-08 Refinement | 如何修改结果且不破坏已有工作？ | Refinement | Follow-up Ready、Inputting、Running、Reviewing | Refinement Bar、Scoped Edit、Branch、Version Switcher |
| J-09 Handoff | 如何把结果交给人或下一个系统？ | Output Handoff | Export Ready、Completed、Error | Artifact Card、Export Menu、Share Control、Handoff Receipt |

## 4. 各节点组件规范

## J-01 Entry

### 推荐组件

- **Mode Launcher**：Ask、Search、Research、Build、Agent 等任务模式。
- **Resume Work Item**：最近任务、运行中任务、待审阅任务。
- **Starter Template**：按结果类型或场景启动，而不是泛化 Prompt 示例。
- **Capability Boundary Hint**：当前模式能访问什么、能否写入、是否消耗额度。

### 必须表达

- 当前入口对应的任务类型。
- 新建与继续的区别。
- 可用工具、上下文和权限边界。
- 用户选择后会进入哪个工作流。

### 反模式

- 只有一个巨大空输入框。
- 用营销文案代替可执行入口。
- 模式切换后不说明能力和权限变化。

### 外部依据

- ChatGPT Projects 将聊天、文件、指令和项目记忆组织在同一工作空间，并提供继续和分支入口。
- Perplexity Spaces 提供研究空间、模板、来源和共享权限。
- Notion AI 区分 Search、Build、Agent 等入口模式。

## J-02 Intent Capture

### 推荐组件

- **Intent Composer**：目标、补充说明、附件和发送动作。
- **Mode / Tool Picker**：显式选择 Search、Deep Research、Canvas、Agent 等能力。
- **Constraint Builder**：输出格式、时间范围、受众、范围和禁止项。
- **Clarification Card**：在执行前补问缺失目标或约束。

### 必须表达

- 用户期望的结果，而不仅是主题。
- 已识别约束与输出格式。
- 当前选择的能力模式。
- 是否已经具备开始所需信息。

### 最佳实践

- 将复杂任务拆成“目标 + 来源 + 约束 + 输出”。
- Clarification 应针对真正缺失的信息，不能机械追问。
- 输入建议应可直接采用、修改或移除。

### 外部依据

- ChatGPT Deep Research 建议描述问题、期望结果与约束，并可能在开始前提出澄清问题。
- Notion AI 支持选区、页面上下文、@ 引用与 specified context。

## J-03 Context Building

### 推荐组件

- **Context Tray**：当前所有上下文的总览。
- **Context Item**：文件、网页、屏幕、选区、对话、记忆、连接应用。
- **Source Picker**：来源添加、搜索范围与优先级。
- **Scope Summary**：仅当前页面、当前项目、组织知识或公开网络。
- **Memory Boundary / Consent**：是否持久保存、保存在哪里、如何关闭。

### 必须表达

- 来源类型、名称、数量和更新时间。
- AI 是否实际使用该来源。
- 访问范围、权限与持久性。
- 检查、替换、排除和移除操作。

### 最佳实践

- “已连接”不等于“本次已使用”，两种状态要区分。
- 长期记忆必须显示作用域和退出方式。
- 连接外部应用时在使用点请求权限，并说明用途。

### 外部依据

- Gemini Connected Apps 可通过 @ 指定应用，并在未连接时请求权限。
- ChatGPT Projects 支持 project-only memory，限制跨项目上下文。
- ChatGPT、Gemini 与 Perplexity 的研究模式都允许选择网页、文件或连接应用作为来源。

## J-04 Planning

### 推荐组件

- **Plan Review**：计划摘要、步骤、依赖和完成条件。
- **Step List**：每一步的目的、动作类型和预计输出。
- **Scope Preview**：将读取、修改或生成哪些对象。
- **Risk Notice**：不可逆动作、敏感数据、外部副作用。
- **Start Gate**：开始、修改计划、取消。

### 必须表达

- AI 对目标的理解。
- 步骤与执行顺序。
- 数据来源、工具和作用范围。
- 风险点和需要确认的位置。

### 最佳实践

- 计划应可修改，而不是只能批准或拒绝。
- 只在复杂、高成本或高风险任务中展示完整计划。
- 简单任务可使用压缩计划，避免增加启动负担。

### 外部依据

- ChatGPT Deep Research 在执行前生成可审阅、可修改的研究计划。
- GitHub Copilot 从 Issue 启动时自动进入 Plan mode，用户审阅计划后再允许创建分支和实施。
- Claude Code 提供只分析、不修改文件或执行命令的 plan permission mode。

## J-05 Execution

### 推荐组件

- **Agent Activity**：任务总进度和当前焦点。
- **Activity Step / Tool Call Item**：搜索、命令、文件修改、网络请求等动作摘要。
- **Approval Gate**：权限、风险、影响范围与批准持续时间。
- **Steering Composer**：运行中补充或修正指令。
- **Stop / Pause / Resume Control**：停止后说明保留内容。

### 必须表达

- 当前步骤和正在使用的工具。
- 已完成步骤、等待项和下一步。
- 执行时间与是否仍有活动。
- 用户可用的暂停、停止、修正和接管动作。
- 权限请求的对象、原因、风险和作用范围。

### 最佳实践

- 进度必须是任务语义，不只是 Spinner。
- 可以折叠详细日志，但当前动作和异常必须始终可见。
- 停止时保留已完成产物，并明确未完成部分。
- 审批应支持 once、session 或持久规则，但必须准确遵守用户选择。

### 外部依据

- GitHub Copilot Agent Sessions 展示进度、使用量和时长，支持 steering、stop、archive，并在停止后保留已提交内容。
- ChatGPT Deep Research 支持运行中查看进度、调整焦点和来源。
- Claude Code 采用分层权限和 plan / acceptEdits / default 等模式。

### 公开反模式信号

- Claude Code 多个公开 issue 指向重复审批和权限模式未被一致遵守，说明批准范围必须明确且可靠。
- VS Code Copilot issue 中出现 Prompt 消失、命令长期停留在 Running 且无错误反馈，说明执行组件必须有 heartbeat、超时和恢复入口。

## J-06 Feedback

### 推荐组件

- **Progress Summary**：整体阶段、完成比例、预计剩余工作。
- **Milestone Item**：已完成的重要节点。
- **Partial Result**：当前可审阅或可复用的中间产物。
- **Attention Notice**：需要输入、权限、资源或决策。
- **Completion Preview**：正式完成前的结果摘要。

### 必须表达

- 发生了什么，而不仅是“正在处理”。
- 当前已有的有效成果。
- 任务为何等待、阻塞或变慢。
- 用户现在是否需要行动。

### 最佳实践

- 更新频率按任务节奏变化，避免日志刷屏。
- 把工具日志压缩成用户可判断的里程碑。
- Streaming 内容和任务状态应视觉分离。

### 外部依据

- GitHub Copilot session overview 和 logs 让用户观察进度、工具、验证与时长。
- ChatGPT Deep Research 提供 activity history 和实时进度。

## J-07 Verification

### 推荐组件

- **Evidence Card**：结论、证据与来源关系。
- **Citation / Source Item**：来源标题、域名、更新时间与引用位置。
- **Diff Viewer / Change Summary**：新增、删除、影响文件和风险。
- **Test Result**：测试名称、结果、覆盖范围与未运行项。
- **Review Checklist**：仍需人工确认的内容。

### 必须表达

- 结论依据来自哪里。
- AI 修改了什么。
- 运行过什么验证、结果是什么。
- 哪些风险或不确定性仍未解决。
- 用户可以批准、修改、回退或继续验证。

### 最佳实践

- 引用必须能定位到具体结论，而不是只在文末列链接。
- “测试通过”必须显示测试范围；未运行不能伪装为通过。
- 高风险输出必须在 Apply、Merge、Publish 前提供预览。

### 外部依据

- ChatGPT Deep Research 报告包含 citation、sources used 和 activity history。
- GitHub Copilot PR 流程将 summary、CI、diff 和 review 放在正式合并之前。
- ChatGPT Canvas 支持 Show changes、版本恢复与运行结果。

## J-08 Refinement

### 推荐组件

- **Refinement Bar**：继续、修改、缩短、扩展、重新生成。
- **Scoped Edit Control**：明确修改选区、段落、文件或步骤。
- **Branch Action**：从当前节点探索新方向并保留原始路径。
- **Version Switcher / Compare**：版本浏览、差异和恢复。
- **Feedback Control**：问题类型与补充说明。

### 必须表达

- 本次修改针对什么。
- 原版本是否保留。
- 修改会影响哪些上下文或产物。
- 用户如何比较、恢复或继续分支。

### 最佳实践

- 优先局部修订，避免每次重做整个结果。
- Regenerate 前说明会替换还是创建新版本。
- 分支必须保留来源关系和创建者。

### 外部依据

- Notion AI 对生成修改提供 accept、discard 和 try again。
- ChatGPT Projects 支持从原对话 branch，保留原始路径。
- ChatGPT Canvas 和 Claude Artifacts 都支持版本切换或恢复；Claude Artifacts 可基于现有 Artifact Customize。

## J-09 Handoff

### 推荐组件

- **Artifact Card**：产物类型、版本、状态与来源。
- **Export Menu**：格式、命名、范围和目标位置。
- **Share Control**：访问权限、可编辑性和有效范围。
- **Apply / Commit / Publish Gate**：写入最终系统前的确认。
- **Handoff Receipt**：交接结果、目标、时间和后续入口。

### 必须表达

- 交付物是什么、哪个版本。
- 将发送、保存或发布到哪里。
- 谁可以访问和编辑。
- 是否包含来源、附件或对话上下文。
- 完成后如何继续、撤销或重新打开。

### 最佳实践

- Copy、Download、Share、Apply、Commit 和 Publish 语义必须区分。
- 分享时明确附件和上下文是否一并暴露。
- 交接完成后提供稳定链接或可恢复入口。

### 外部依据

- ChatGPT Deep Research 支持 Markdown、Word 和 PDF 下载。
- Claude Artifacts 支持版本选择、复制、下载、分享和 Customize。
- GitHub Copilot 通过 PR、commit 和 session log 保留变更与执行来源。
- Perplexity Spaces 提供 viewer / contributor 权限和来源组织。

## 5. Figma 组件分层建议

### Layer 1：基础原语

- Intent Field
- AI State Signal
- Context Item
- Activity Step
- Evidence Item
- Decision Bar
- Recovery Actions
- Artifact Item

### Layer 2：节点复合组件

- Entry Launcher
- Intent Composer
- Context Tray
- Plan Review
- Agent Activity
- Progress Summary
- Verification Panel
- Refinement Bar
- Handoff Card

### Layer 3：产品场景

- AI Chat：对话、搜索与研究
- AI Agent：多步骤任务与审批
- AI Workspace：文档、画布、数据库内协作
- Coding Agent：计划、修改、测试、PR 与提交

## 6. 绘制与研究记录规则

每个复合组件页应包含：

1. Research metadata：Pattern、Journey、State、Lens、Evidence ID。
2. Component anatomy：信息、状态、动作与插槽。
3. State matrix：当前节点最关键的 3～5 个状态。
4. Cross-product specimens：至少 3 个产品形态实例。
5. Design judgment：适用、不适用、风险、恢复和复用条件。

Research metadata 只属于文档框架，不进入产品组件本体。

## 7. Source Map

### 官方产品资料

- [ChatGPT Deep Research](https://help.openai.com/en/articles/10500283)
- [Projects in ChatGPT](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt)
- [ChatGPT Canvas](https://help.openai.com/en/articles/9930697-what-is-the-canvas-featue-in-chatgpt-and-how-do-i-use-it)
- [Gemini Connected Apps](https://support.google.com/gemini/answer/13695044)
- [Gemini Deep Research](https://support.google.com/gemini/answer/15719111)
- [GitHub Copilot: manage agent sessions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents)
- [GitHub Copilot: issue to plan and PR](https://docs.github.com/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests)
- [GitHub Copilot: review agent PRs](https://docs.github.com/copilot/how-tos/use-copilot-agents/coding-agent/review-copilot-prs)
- [GitHub Copilot CLI steering](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-agents/steer-agents)
- [Claude Code CLI and permission modes](https://docs.anthropic.com/en/docs/claude-code/cli-usage)
- [Claude Artifacts](https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them)
- [Claude Artifact sharing and customization](https://support.anthropic.com/en/articles/9547008-publishing-remixing-and-sharing-artifacts)
- [Notion AI](https://www.notion.com/help/notion-ai-faqs)
- [Notion AI database generation preview](https://www.notion.com/help/autofill)
- [Perplexity Spaces](https://www.perplexity.ai/help-center/en/articles/10352961-spaces)

### 公开问题信号

- [Claude Code repeated permission prompt example](https://github.com/anthropics/claude-code/issues/18699)
- [Claude Code permission mode mismatch example](https://github.com/anthropics/claude-code/issues/29214)
- [VS Code Copilot silent agent failure example](https://github.com/microsoft/vscode-copilot-release/issues/9802)
- [VS Code Copilot command stuck in Running example](https://github.com/microsoft/vscode-copilot-release/issues/4814)

这些 issue 只能证明具体问题真实存在，不能单独用于推断行业发生频率。

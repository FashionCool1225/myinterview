# Java 后端面试学习沉淀站点

一个**纯静态、零后端、零构建**的个人面试学习站。每学一个知识点就沉淀成一份文档，配图内嵌，可检索、可翻页、支持深浅色切换。适合 Java 后端方向的面试准备与知识复盘。

> 🌐 在线地址：https://fashioncool1225.github.io/myinterview/

---

## ✨ 特性

- **12 大分类目录导航**：按面试考察权重排序（基础 → 集合 → 并发 → JVM → Spring → 数据库 → 缓存 → MQ → 计算机基础 → 算法 → 设计模式 → 工程实践）。
- **小标签 / 关键词搜索**：同时匹配标题与标签（如 `死锁`、`volatile`、`线程`、`索引`）。
- **上一题 / 下一题**：文档页底部左右翻页，键盘 `←` `→` 也可切换（翻页范围跟随你进入文档时的列表：全部 / 分类 / 搜索）。
- **深浅色一键切换**：顶栏按钮切换，偏好记忆在 `localStorage`。
- **配图内嵌**：关系图、时序图、状态图均为本地 SVG，离线可见。
- **离线可用**：Markdown 渲染用本地 `marked.min.js`，不依赖任何 CDN。

---

## 🚀 本地运行

站点用 `fetch()` 读取本地 `data/index.json` 与 `questions/*.md`，**必须通过本地服务器打开**（不能直接双击 `index.html`，浏览器会拦截 `file://` 的 fetch）。

方式一（推荐，Windows 双击即可）：

```bat
start.bat
```

方式二（任意系统，需 Python）：

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

---

## 📁 目录结构

```
myinterview/
├─ index.html              # 站点入口：顶栏 + 左侧目录(TOC) + 主内容区
├─ start.bat               # 一键启动本地服务器（Windows）
├─ README.md               # 本文件
├─ data/
│  └─ index.json           # 问题索引（分类 / 标题 / 标签 / 难度 / 文件）
├─ questions/              # 每个问题一份 Markdown 文档
│  ├─ _template.md         # 新增问题模板
│  ├─ deadlock.md          # 手写死锁
│  ├─ thread-states.md     # 线程 6 种状态
│  ├─ thread-create.md     # 创建线程的 4 种方式
│  └─ thread-vs-runnable.md# Thread vs Runnable（含 JDK 源码解析）
└─ assets/
   ├─ app.js               # 站点交互逻辑（目录树 / 视图 / 搜索 / 翻页 / 主题）
   ├─ styles.css           # 样式（深色默认 + 浅色覆盖）
   ├─ marked.min.js        # 本地 Markdown 渲染
   └─ *.svg                # 各题配图
```

---

## ➕ 如何新增一道题

1. 复制 `questions/_template.md` 为 `questions/你的题.md`，按模板填写（含 frontmatter 头部 + 正文 + 配图）。
2. 配图放 `assets/`，在文档里用 `![说明](assets/xxx.svg)` 引用。
3. 在 `data/index.json` 的 `questions` 数组追加一条：

```json
{
  "id": "your-id",
  "title": "题目标题",
  "category": "Java 并发编程",
  "tags": ["标签1", "标签2"],
  "difficulty": "易",
  "file": "your-id.md"
}
```

> `category` 必须是 `categories` 数组里已有的 12 大分类之一。

4. 提交并推送，`main` 分支更新后 GitHub Pages 会自动重新部署：

```bash
git add -A
git commit -m "feat: 新增 xxx 题"
git push
```

---

## 🗂 12 大分类

1. Java 基础与核心特性　2. Java 集合框架　3. Java 并发编程　4. JVM 虚拟机
5. Spring 全家桶 & 微服务　6. 关系型数据库（MySQL）　7. 缓存（Redis）
8. 消息中间件　9. 计算机基础（网络 / 操作系统 / Linux）　10. 数据结构与算法
11. 设计模式　12. 工程实践 & 架构设计 & 项目深挖

---

## ☁️ 部署

- 平台：**GitHub Pages**（免费，从 `main` 分支根目录发布）。
- 地址：https://fashioncool1225.github.io/myinterview/
- 推送 `main` 即自动重新部署，无需额外操作。

---

## 🔧 技术栈

纯前端，无框架、无构建步骤：HTML + CSS + 原生 JavaScript + [marked](https://github.com/markedjs/marked)（本地内置）。

---

## 📝 License

个人学习用途，欢迎参考。

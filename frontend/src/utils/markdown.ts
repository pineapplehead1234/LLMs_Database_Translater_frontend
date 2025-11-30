// frontend/src/utils/markdown.ts
import { marked, type MarkedOptions } from "marked";
import markedKatex from "marked-katex-extension";
import "katex/dist/katex.min.css";
// 新增：代码高亮                                                                              
import hljs from "highlight.js";
import { markedHighlight } from "marked-highlight";
/**
 * 一次性配置 marked 的全局选项：
 * - gfm: GitHub 风格 markdown
 * - breaks: 单行换行也换行
 */
// 只保留通用选项                                                                              
marked.setOptions({
    gfm: true,
    breaks: true,
});

/**
 * 注册 KaTeX 插件：
 * - 支持 $...$ 行内公式
 * - 支持 $$...$$ 块级公式
 * - throwOnError=false：写错公式不会把整个渲染弄崩，只是显示原文本
 */
marked.use(
    markedKatex({
        // KaTeX 原生参数：出错时不抛异常
        throwOnError: false,
        // 如果你想允许“非标准”的写法（$周围没空格也解析）
        // 可以额外打开这个选项：
        // nonStandard: true,
    }),
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
    }),
);
/**
 * 创建一个“基础 Renderer”：
 * - 所有 Markdown 渲染，都推荐在这个 Renderer 上再做个性化扩展。
 * - 好处：表格、代码块等都可以挂统一 class，后面做主题更好控制。
 */
export function createBaseRenderer(): any {
    const renderer = new marked.Renderer();

    // 1）表格：加 class，方便用 CSS 画边框、调间距
    const originalTable = renderer.table?.bind(renderer);
    renderer.table = (token: any) => {
        // token 是 Tokens.Table，交给原来的实现去渲染出 <table>...</table>
        const base = originalTable ? originalTable(token) : "";
        // 给 table 标签补一个 class
        return base.replace("<table", '<table class="md-table"');
    };

    // 2）代码块：外再包一层 div，做整体背景、边框
    const originalCode = renderer.code?.bind(renderer);
    renderer.code = (token: any) => {
        // token 是 Tokens.Code，仍然交给原实现生成 <pre><code>...</code></pre>
        const inner = originalCode ? originalCode(token) : "";
        // 包在 md-code-block 里，方便用 CSS 控制（主题变量里有 --code-bg / --code-text）
        return `<div class="md-code-block">${inner}</div>`;
    };

    return renderer;
}

/**
 * 统一的 Markdown 渲染函数：
 * - text: Markdown 文本
 * - options: 每个调用方可以传自己的 renderer（比如带图片映射）
 *
 * 内部实际调用的是“已经挂好 KaTeX 插件”的 marked 实例。
 */
export function renderMarkdown(
    text: string,
    options?: MarkedOptions,
): string {
    // marked.parse 在类型上返回 string | Promise<string>
    // 我们这里没有开启 async，所以直接断言为 string 即可
    return marked.parse(text, options) as string;
}

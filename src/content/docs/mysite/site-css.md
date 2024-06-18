---
title: "自定义Astro文档样式"
description: "记录在 Astro 框架的 Starlight 文档中如何添加自定义 CSS 以改进元素的美观性。"
---

Astro 框架中的 Starlight 模板是一种优秀的文档模板，但有时候默认样式可能需要一些个性化调整。这篇笔记记录了如何通过添加自定义 CSS 来改善这一模板的视觉效果。

## 配置自定义 CSS 文件

首先，在 src/styles 目录下创建一个名为 custom.css 的新文件。这个 CSS 文件将包含所有自定义样式规则。接着，需要在 astro.config.mjs 配置文件中引入这个 CSS 文件。通过修改配置文件，可以确保在构建项目时，这些自定义样式被正确应用。

```js
// astro.config.mjs

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Docs With Custom CSS',
      customCss: [
        // 你的自定义 CSS 文件的相对路径
        './src/styles/custom.css',
      ],
    }),
  ],
});
```

## 改变主题色

和其他文档框架一样，Starlight 模板也支持主题色的定制。可以在官网介绍页面[CSS & 样式 - 主题](https://starlight.astro.build/zh-cn/guides/css-and-tailwind/#%E4%B8%BB%E9%A2%98)调试配色方案，并获取 CSS 代码。

```css
/* 深色模式 */
:root {
    --sl-color-accent-low: #00273d;
    --sl-color-accent: #0071a7;
    --sl-color-accent-high: #92d1fe;
    --sl-color-white: #ffffff;
    --sl-color-gray-1: #e7eff2;
    --sl-color-gray-2: #bac4c8;
    --sl-color-gray-3: #7b8f96;
    --sl-color-gray-4: #495c62;
    --sl-color-gray-5: #2a3b41;
    --sl-color-gray-6: #182a2f;
    --sl-color-black: #121a1c;
}
/* 浅色模式 */
:root[data-theme='light'] {
    --sl-color-accent-low: #b0deff;
    --sl-color-accent: #0073aa;
    --sl-color-accent-high: #003653;
    --sl-color-white: #121a1c;
    --sl-color-gray-1: #182a2f;
    --sl-color-gray-2: #2a3b41;
    --sl-color-gray-3: #495c62;
    --sl-color-gray-4: #7b8f96;
    --sl-color-gray-5: #bac4c8;
    --sl-color-gray-6: #e7eff2;
    --sl-color-gray-7: #f3f7f9;
    --sl-color-black: #ffffff;
}
```

## 调整 Callout 配色

对于文档中的提示框（callout），可以通过修改 CSS 变量来定制其配色。以下是一个调整提示框配色的示例，主要通过修改 CSS 根变量来改变颜色：

```css
:root {
    --sl-hue-blue: 200;
    --sl-hue-green: 85;
}

.starlight-aside--tip {
    --sl-color-asides-text-accent: var(--sl-color-green-high);
    border-color: var(--sl-color-green);
    background-color: var(--sl-color-green-low);
}
```

## 调整 pagination 字体大小

默认页脚的上一页和下一页链接的字体过大，我调小了一个尺寸。

```css
.link-title {
    font-size: var(--sl-text-lg);
}
```

## 调整 badge 颜色

```css
:root, :root[data-theme='light'] {
    --sl-badge-success-border: mediumseagreen;
    --sl-badge-success-bg: mediumseagreen;
    --sl-badge-caution-border: darkorange;
    --sl-badge-caution-bg: darkorange;
}
```
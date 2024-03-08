---
title: "Plausible网站分析工具"
description: "通过Docker安装并部署Plausible Analytics，并集成到Astro博客中。"
---

Plausible 是一个开源、轻量级的网站分析工具，它尊重用户隐私并且提供实用的网站访问数据。与其他分析工具相比，Plausible 设计的目的是提供一个简洁、用户友好且不侵犯用户隐私的分析方案。

### 安装部署 Plausible

1. **克隆官方Docker仓库**

   首先，打开你的终端，执行以下命令来克隆 Plausible 的官方 hosting 仓库，并切换到仓库目录中：

    ```bash
    git clone https://github.com/plausible/hosting
    cd hosting
    ```

2. **生成秘钥**

   Plausible 需要一个秘钥来保障通信安全。运行下面的命令生成一个随机秘钥：

    ```bash
    openssl rand -base64 64 | tr -d '\n' ; echo
    ```

3. **配置环境变量**

   使用你喜欢的文本编辑器打开 `plausible-conf.env` 文件，并填入刚才生成的秘钥以及你的域名：

    ```bash
   BASE_URL=https://plausible.example.com # 更换为你的域名
   SECRET_KEY_BASE=生成的秘钥
   ```

4. **启动服务**

   返回到终端，执行以下命令来启动 Plausible 服务：

    ```bash
    docker-compose up -d
    ```

:::note
注意：Plausible 的默认端口为 8000。如果你需要将 Plausible 服务运行在不同的端口上，请在 `docker-compose.yml` 文件中找到 `ports` 参数并进行修改。
:::

### Astro 博客集成

为了在你的 Astro 博客中使用 Plausible 进行网站访问分析，需要对 `astro.config.mjs` 文件进行如下修改：

```javascript
starlight({
  head: [
    {
      tag: 'script',
      attrs: {
        src: 'https://plausible.example.com/js/plausible.js',
        'data-domain': 'example.com',
        defer: true,
      },
    },
  ],
});
```

以上代码将 Plausible 的追踪脚本添加到你的 Astro 博客中。请确保替换 `src` 中的 URL 为你的 Plausible 实例 URL，同时将 `'data-domain'` 的值更改为你的域名。

完成这些步骤后，你的 Astro 博客将成功集成 Plausible 分析。现在，你可以在 Plausible 的仪表板上看到你的网站访问数据，从而更好地理解你的访问者行为和偏好。
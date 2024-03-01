---
title: "Nginx Proxy Manager"
description: "使用 Docker Compose 在 Linux 环境下安装和配置 Nginx Proxy Manager。"
---

Nginx Proxy Manager 是一个基于 Nginx 的代理管理工具，可以轻松地管理和运行一个代理服务器。

:::note
为了确保顺利安装和运行，你需要一个干净的 Linux 环境，并确保80端口是可用的。
:::

### 安装步骤

以下步骤将指导你如何通过 Docker Compose 安装 Nginx Proxy Manager。

首先，创建一个 `docker-compose.yml` 文件，并填入以下内容：

```yml
// docker-compose.yml

version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

然后，在文件所在的目录下运行 `docker-compose up -d` 命令来启动服务。

### 配置管理界面

Nginx Proxy Manager 的管理界面通过端口 `81` 访问。

:::note
初次访问时，你可以使用以下默认账户登录：

- **账号**：`admin@example.com`
- **密码**：`changeme`

**注意**：为了安全起见，登录后应立即更改默认密码。
:::

### 配置域名和证书

若计划使用 Let's Encrypt 的 DNS Challenge 功能来验证域名并自动签发 SSL/TLS 证书，可能需要进行额外的配置。

1. **安装 zope 补丁**：如果你使用的是腾讯的 DNSPOD 服务，可能会遇到 DNS Challenge 验证错误。这时需要进入容器并安装 zope 补丁：

    ```bash frame="none"
    pip install zope
    ```

2. **获取 DNS Provider 的 API Token**：访问你的 DNS 提供商的控制面板，获取用于 API 调用的 `api_token`。

完成以上步骤后，你的 Nginx Proxy Manager 应该已经成功安装并配置好了。你现在可以通过管理界面添加和管理代理服务器了。
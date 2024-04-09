---
title: "Vaultwarden 密码管理服务"
description: "使用 docker-compose 部署 Vaultwarden 服务，实现密码管理的自建方案。"
---

:::note
[Vaultwarden](https://github.com/dani-garcia/vaultwarden) 是 Bitwarden 的第三方开源版本，允许用户自建密码管理服务，同时包含了原版 Bitwarden 需要付费的功能。
本文记录如何自部署和配置 Vaultwarden。
:::

1. 准备配置文件 (`docker-compose.yml`)

    ```yaml
    version: '3.8'
    services:
      vaultwarden:
        image: vaultwarden/server:latest
        container_name: vaultwarden
        restart: always
        environment:
          WEBSOCKET_ENABLED: "true"
          SMTP_HOST: example.mailjet.com
          SMTP_FROM: mail@example.com
          SMTP_PORT: 587
          SMTP_SECURITY: starttls
          SMTP_USERNAME: "username"
          SMTP_PASSWORD: "password"
          ADMIN_TOKEN: "radomtoken1234567890"
          SIGNUPS_VERIFY: "false"
          PASSWORD_HINTS_ALLOWED: "true"
          DOMAIN: "https://vaultwarden.yourdomain.com"
        volumes:
          - ./vw-data:/data
        ports:
          - "80:80"
    ```
    
    :::tip
    以上 environment 配置项，除了 ADMIN_TOKEN 建议一定要配置，其他参数在 compose 文件中均可省略，后续在 admin 界面中可以做可视化配置。
    
    我这里为了方便，直接在 compose 文件中配置了。
    
    - SMTP_xxxx 为邮件服务配置，如果不需要邮件服务，可以不配置。 
      - ADMIN_TOKEN 为管理员密码，可以自定义。 
      - DOMAIN 为域名，如果没有域名，可以使用IP地址。 
      - SIGNUPS_VERIFY 为是否开启注册验证，如果不需要注册验证，可以设置为 false。 
      - PASSWORD_HINTS_ALLOWED 为是否允许密码提示，如果不允许，可以设置为 false。
      :::

2. 数据持久化

   该目录创建在 docker-compose.yml 文件同级目录下，我这里是 /opt/vault。 如非 root 用户，还需要修改目录权限。

    ```bash
   sudo mkdir /opt/vault/vw-data
   ```
   
3. 启动&更新服务

    ```bash
   # 启动服务
   sudo docker compose up -d
   
   # 更新服务
   sudo docker compose down
    sudo docker compose pull
    sudo docker compose up -d
   ```
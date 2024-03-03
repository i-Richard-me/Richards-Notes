---
title: "部署 frp 实现内网穿透"
description: "本文详细介绍了如何部署 frp 服务器和客户端，实现内网穿透功能，包括 frp 的安装、配置及设置开机自启动。"
---


frp 是一个高性能的反向代理应用，可以帮助你轻松实现内网穿透，连接到任何网络配置复杂或处于NAT后面的内网设备。

### frps服务器端

1. 首先，我们需要在服务器端安装 frps。以下步骤将指导你完成安装过程。

    ```bash
    # 下载项目最新版本，版本号可根据需要替换为最新版本
    wget https://github.com/fatedier/frp/releases/download/v0.48.0/frp_0.48.0_linux_amd64.tar.gz
    
    # 解压下载的文件
    tar -zxvf frp_0.48.0_linux_amd64.tar.gz
    
    # 为方便操作，复制并重命名解压后的目录
    cp -r frp_0.48.0_linux_amd64 frp
    ```

2. 配置 frps

   接下来，我们需要配置 frps 以便它能够正确运行。

    ```bash
    # 进入 frp 目录并编辑服务器端配置文件
    cd frp
    nano frps.ini
    ```
    在配置文件中添加以下内容
   
   ```
   // frps.ini
   
    [common]
    bind_port = xxxx
    dashboard_port = xxxx
    token = xxxx
    dashboard_user = xxxx
    dashboard_pwd = xxxx
    vhost_http_port = xxxx
    vhost_https_port = xxxx
    ```

3. 启动 frp 服务并设置开机自启

   为了确保 frp 服务器在每次系统启动时自动运行，请按照以下指令操作。

    ```bash
    # 在 frp 目录中，启动 frp 服务
    nohup ./frps -c frps.ini &
    ```

### frpc客户端

在客户端设备上安装 frpc（frp 客户端）同样简单。如果你在家里使用 iStoreOS 旁路由，可以直接在商店中安装 frpc 客户端。

配置客户端时，需要确保其配置与服务器端相匹配，以便成功建立内网穿透。

---

参考链接：[如何使用 frp 实现内网穿透](https://sspai.com/post/52523/)
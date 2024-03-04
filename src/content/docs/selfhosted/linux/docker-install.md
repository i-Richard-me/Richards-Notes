---
title: Docker安装部署
description: 本文档介绍了在CentOS系统上安装和部署Docker、Docker-Compose及Portainer的步骤。
---

Docker 是一个开源的应用容器引擎，允许开发者打包他们的应用以及应用的依赖包到一个可移植的容器中，然后发布到任何流行的 Linux
机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。

本文将引导你完成 Docker 在 CentOS 系统上的安装和配置过程，包括 Docker-Compose 和 Docker 可视化管理工具 Portainer 的安装。

### Docker的官方源安装

1. 安装 yum 工具包

   首先，安装 `yum-utils`，这是一个扩展了 `yum` 的功能的程序包，提供了一些方便的工具。

    ```bash
    sudo yum install -y yum-utils
    ```

2. 添加docker官方仓库

   :::info
   若没有国外网络环境，可以替换为国内镜像源，以提高下载速度和稳定性。
   :::

   接着，添加 Docker 的官方 CentOS 仓库：

    ```bash
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo  
    ```

3. Docker的安装命令

   使用以下命令安装 Docker 引擎及其组件：

    ```bash
    sudo yum install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```

4. 启动docker

   安装完成后，启动 Docker 服务：

    ```bash
    sudo systemctl start docker
    ```

   设置开机自启

    ```bash
    sudo systemctl enable docker
    ```

### 安装管理工具Portainer

Portainer 是一款轻量级的管理界面，可以通过它来管理不同的 Docker 环境。Portainer 使得容器管理变得更加简单，提供了一个可视化的界面来管理容器、镜像、网络等。

> Portainer 是 Docker 的一款可视化管理工具，能够提供更加直观的操作界面。

:::caution
尽管 Portainer 提供了便捷的操作界面，但建议有限使用，因为它可能会引入一些不可预期的问题。在实际应用中，建议主要使用
Portainer 进行监控，具体的操作还是通过命令行来完成。
:::

运行以下命令来部署 Portainer：

```bash
docker run -d -p 8080:8000 -p 9443:9443 --name=portainer --restart=always \
-v /var/run/docker.sock:/var/run/docker.sock \
-v portainer_data:/data \
portainer/portainer-ee:latest
```
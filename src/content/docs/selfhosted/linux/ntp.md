---
title: NTP时间同步
description: 本文档指导使用软路由作为NTP服务器，并在RockyLinux9上配置NTP客户端，确保系统时间的精确同步。
---

### NTP服务器

建议在软路由中启用NTP服务器功能来提供网络时间协议(NTP)
服务。常见的软路由系统如爱快、梅林和OpenWRT均支持NTP服务器功能。启用该功能可以使网络中的设备同步到统一的时间，有助于日志管理和时间敏感的应用运行。

### NTP客户端配置

1. 安装客户端

    在RockyLinux9中，默认已安装了`chrony`时间同步服务，因此，大多数情况下你不需要再进行安装。如果出于某种原因`chrony`未被安装，可以使用以下命令进行安装。
    
    
    ```bash
    sudo dnf install -y chrony
    ```

2. 手动时间同步

   使用`chronyd`命令，可以手动将系统时间与指定的NTP服务器进行同步。请替换下面命令中的`192.168.100.1`为你的NTP服务器地址。

    ```bash
    sudo chronyd -q 'server 192.168.100.1 iburst'
    ```

3. 配置服务器参数

   为了使时间同步自动进行，需要配置`chrony`服务。首先，编辑`/etc/chrony.conf`配置文件：

    ```bash 
    sudo vim /etc/chrony.conf
    ```

   在文件中添加或修改服务器地址如下：

    ```bash title="/etc/chrony.conf"
    server 192.168.100.1 iburst
    ```

4. 重启与自动启动

   重启`chronyd`服务，并检查其状态，确保服务正常运行：

    ```bash
    sudo systemctl restart chronyd && systemctl status chronyd
    ```

   设置`chronyd`服务开机自启动：

    ```bash
    sudo systemctl enable chronyd
    ```

### 验证Chrony的同步效果

1. 查看NTP客户端

   在NTP服务器端，可以查看哪些客户端通过此服务器进行时钟同步：

    ```bash
    sudo chronyc clients
    ```

2. 系统时间同步状态

   在客户端，使用以下命令验证系统时间是否已经使用`chrony`进行同步：

    ```bash
    sudo chronyc tracking
    ```

3. 查看时间源

   查看`chrony`使用的当前时间源信息：

    ```bash
    chronyc sources
    ```

4. 时间源的详细信息

   列出每个源的漂移速度和偏移估计信息，有助于了解时间同步的精确性：

    ```bash
    chronyc sourcestats  -v
    ```
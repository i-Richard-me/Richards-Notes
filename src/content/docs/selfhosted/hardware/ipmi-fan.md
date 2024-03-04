---
title: "使用ipmitool调整服务器风扇转速"
description: "本文提供了如何使用ipmitool工具来监控和调整服务器风扇转速的详细步骤，包括安装ipmitool、调整风扇转速警报阈值，避免因风扇低速报警导致的不必要警报和风扇满速运转。"
---

本文提供如何使用`ipmitool`工具在Linux环境下监控和调整服务器风扇转速的详细步骤，以解决风扇低速报警问题。

### 安装ipmitool

`ipmitool`是一个用于管理和配置IPMI（智能平台管理接口）的命令行工具。以下是在基于Linux的系统上安装`ipmitool`的步骤：

1. 打开终端。
2. 输入以下命令以安装`ipmitool`：

    ```bash
    yum install ipmitool
    ```
   该命令适用于基于Red Hat的发行版，如CentOS或Fedora。如果您使用的是Debian或Ubuntu系统，请使用`apt-get install ipmitool`代替。

### 调整风扇转速警报阈值

在某些情况下，服务器可能会因风扇转速过低而触发报警，导致风扇以满速运转以防止过热。以下步骤展示了如何使用`ipmitool`调整风扇转速的警报阈值，以防止不必要的报警和风扇满速运转：

1. 首先，使用`ipmitool`查询服务器的当前传感器状态，以确认哪个风扇传感器需要调整。输入以下命令：
    ```shell
    ipmitool -H [服务器IP地址] -U [用户名] -P [密码] sensor list all
    ```
   替换`[服务器IP地址]`、`[用户名]`和`[密码]`为实际的服务器IP地址、管理用户名和密码。

2. 根据输出找到相关风扇传感器（例如`FANA`）的当前警报阈值。

3. 使用以下命令调整风扇传感器的警报阈值。例如，将`FANA`风扇的低速警报阈值设置为100：
    ```shell
    ipmitool -H [服务器IP地址] -U [用户名] -P [密码] sensor thresh FANA lower 100 100 100
    ```
   这会将`FANA`风扇的低速警报阈值调整为100，防止因转速稍微低于默认设置而触发不必要的警报。

---

### 参考链接

- [Re:从零开始的服务器-安装测试篇 | Memo von EFS (amefs.net)](https://amefs.net/archives/1057.html)
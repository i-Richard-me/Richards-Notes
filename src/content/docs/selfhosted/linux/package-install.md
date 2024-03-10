---
title: "必备软件包"
description: "在进行Linux最小化安装后，补充安装常用软件包，如vim、wget、git等，并介绍了如何启用qemu-guest-agent服务。"
---

:::note
在进行Linux最小化安装之后，系统会仅安装必要的软件包，以减小系统的占用空间。这意味着一些常用的软件包可能不会被安装。为了补充安装这些软件包，需要根据你的发行版使用合适的包管理工具。
:::

## 补充安装常用软件包

根据你的Linux发行版，使用相应的包管理器安装必要的软件包。

### Fedora或基于Red Hat的系统

如果你的系统是Fedora或者基于Red Hat的系统（如CentOS Stream），可以通过以下命令安装：

```bash
sudo dnf install -y vim wget git
```

### Debian或基于Ubuntu的系统

对于Debian、Ubuntu或其他基于Debian的系统，使用以下命令安装：

```bash
sudo apt install -y vim wget git
```

这些命令将安装vim编辑器、wget网络下载工具和git版本控制系统。

## 安装和启用qemu-guest-agent

:::note
安装并启用qemu-guest-agent后，Proxmox VE可以更加高效地管理虚拟机。这包括但不限于改进的关机流程、文件系统冻结以支持无损备份等高级功能。
:::

### 安装qemu-guest-agent

根据你的系统类型，使用以下命令安装qemu-guest-agent：

- **Fedora或基于Red Hat的系统：**

    ```bash
    sudo dnf install -y qemu-guest-agent
    ```

- **Debian或基于Ubuntu的系统：**

    ```bash
    sudo apt install -y qemu-guest-agent
    ```

### 启动并设置开机自启动

安装完毕后，使用以下命令启动qemu-guest-agent服务并设置为开机自启：

```bash
sudo systemctl start qemu-guest-agent
sudo systemctl enable qemu-guest-agent
```
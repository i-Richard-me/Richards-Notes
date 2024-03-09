---
title: "必备软件包"
description: "在进行Linux最小化安装后，补充安装常用软件包，如vim、wget、git等，并介绍了如何启用qemu-guest-agent服务。"
---

:::note
在进行Linux最小化安装之后，系统会仅安装必要的软件包，以减小系统的占用空间。这意味着一些常用的软件包可能不会被安装。为了补充安装这些软件包，需要根据你的发行版使用合适的包管理工具。
:::

以下是在一些常见的Linux发行版上安装vim、wget、git以及qemu-guest-agent的步骤。

### 在Fedora或基于Red Hat的系统上安装

如果你的系统是Fedora或者是基于Red Hat的系统（如CentOS Stream），你可以使用`dnf`包管理器来安装这些软件包：

```bash
sudo dnf install -y vim wget git qemu-guest-agent
```

这条命令会安装vim编辑器、wget网络下载工具、git版本控制系统和qemu-guest-agent服务。

### 在Debian或基于Ubuntu的系统上安装

对于Debian、Ubuntu或其他基于Debian的系统，应使用`apt`包管理工具进行安装：

```bash
sudo apt install -y vim wget git qemu-guest-agent
```

这条命令与上面的`dnf`命令功能相同，只是适用于不同的包管理系统。

### 启用并启动qemu-guest-agent服务

无论是在哪种发行版上，安装完qemu-guest-agent后，接下来应当启动并设置它开机自启动。这可以通过以下命令完成：

```bash
systemctl start qemu-guest-agent
systemctl enable qemu-guest-agent
```

`systemctl start`命令会立即启动服务，而`systemctl enable`命令会确保qemu-guest-agent在系统启动时自动运行。

:::note
`qemu-guest-agent`是一种服务程序，它在虚拟机内运行，允许外部的qemu主机与之通信。安装并启动这个服务可以提高虚拟机的管理效率和性能。
:::

通过上述步骤，你可以在进行最小化安装的Linux系统上补充安装常用的软件包，并确保虚拟机的管理服务正常运行。这样做有助于提升工作效率，同时保持系统的轻量级。
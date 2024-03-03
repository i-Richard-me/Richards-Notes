---
title: "搭建 CUDA 环境虚拟机"
description: "在 Ubuntu 虚拟机系统中安装 NVIDIA 驱动和 CUDA Toolkit，以及如何搭建 CUDA Docker 环境。"
---

当前技术领域，深度学习和大型模型应用的开发正变得日益重要，通过在虚拟机系统中安装 NVIDIA 驱动和 CUDA Toolkit，以及搭建
CUDA Docker 环境，可以在虚拟化的环境中充分利用 GPU 资源，进行深度学习模型的训练和大型模型应用的开发。

:::tip
建议选择 Ubuntu 作为虚拟机系统，其在安装 NVIDIA 驱动方面相对方便。
:::

### 虚拟机创建

1. 确认PVE开启了硬件直通功能。[PVE硬件直通](proxmox-pve#硬件直通)
2. 创建虚拟机，`Machine` 类型选择 `q35`。
3. 添加PCI设备，选择显卡设备。
    - 勾选 `ALL FUNCTIONS`，
    - `Advanced` 设置中勾选 `PCI-Express`。
4. `Display` 设置中选择 `Standard VGA` （否则console无法显示）。

### 安装 NVIDIA 驱动

#### 检查显卡是否直通成功

在安装 NVIDIA 驱动之前，首先需要确认虚拟机是否成功检测到显卡。

执行以下命令以检查虚拟机中是否检测到显卡：

```bash
lspci | grep -i vga
```

如果命令输出显示了 NVIDIA 显卡信息，则表示显卡直通成功。

#### 安装驱动

1. 更新系统包列表，确保所有的软件都是最新版本：

    ```bash
    sudo apt update
    sudo apt upgrade -y
    ```

2. 安装 NVIDIA 驱动：

   可以通过 Ubuntu 的“软件与更新”中的“附加驱动”选项自动查找并安装合适的 NVIDIA 驱动。或者，通过命令行安装特定版本的 NVIDIA
   驱动：

    ```bash
    sudo apt install nvidia-driver-xxx
    ```

   其中 `xxx` 是驱动版本号，需要根据具体的显卡型号选择合适的版本号。

3. 安装完成后，重启虚拟机以应用驱动安装：

    ```bash
    sudo reboot
    ```

### 安装 CUDA Toolkit

#### 准备工作

在安装 CUDA Toolkit 之前，请确保 NVIDIA 驱动已正确安装。

#### 安装步骤

1. 访问 [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads) 网站，选择对应的操作系统版本，下载安装包。

2. 根据下载页面提供的指令进行安装。通常，安装指令如下：

    ```bash
    sudo dpkg -i cuda-repo-<distro>_<version>_amd64.deb
    sudo apt-key adv --fetch-keys http://developer.download.nvidia.com/compute/cuda/repos/<distro>/x86_64/7fa2af80.pub
    sudo apt-get update
    sudo apt-get install cuda
    ```

3. 设置环境变量：

   在 `~/.profile` 或者 `~/.bashrc` 文件中添加以下行：

    ```bash
    export PATH=/usr/local/cuda-<version>/bin${PATH:+:${PATH}}
    export LD_LIBRARY_PATH=/usr/local/cuda-<version>/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
    ```

   其中 `<version>` 需要替换为实际安装的 CUDA 版本。

4. 重启终端或重新登录，执行 `nvcc --version` 验证 CUDA Toolkit 是否安装成功。

### 搭建 CUDA Docker 环境


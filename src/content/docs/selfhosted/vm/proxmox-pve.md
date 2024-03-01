---
title: 'Proxmox PVE'
description: 'A note on Proxmox PVE installation and configuration'
---

Proxmox VE (PVE) 是一个开源的服务器虚拟化环境，非常适合用于企业级的虚拟化需求。以下是安装和配置PVE的一些基本步骤。

### PVE 安装

安装PVE的一个好方法是通过国内的镜像站点来加速下载PVE的ISO文件，这可以显著提高下载速度。

- 可以从国内源加速下载 PVE 的 ISO 文件：[清华大学镜像站 Proxmox ISO 下载地址](https://mirrors.tuna.tsinghua.edu.cn/proxmox/iso/)

### 硬件直通

1. 修改GRUB配置以启用IOMMU，编辑`/etc/default/grub`文件，添加或修改以下行：

    ```shell
    // /etc/default/grub

    GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"
    ```

   如果是AMD CPU，使用以下配置：

    ```shell
    // /etc/default/grub

    GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on iommu=pt"
    ```

2. 更新GRUB配置：

    ```shell frame="none"
    update-grub
    ```

3. 加载必要的内核模块，编辑`/etc/modules`文件，添加以下内容：

    ```plaintext
    // /etc/modules

    vfio
    vfio_iommu_type1
    vfio_pci
    # vfio_virqfd #PVE 8.0版本后不再需要
    ```

4. 更新初始化内核模块并重启：

    ```shell frame="none"
    update-initramfs -u -k all
    reboot
    ```

### 相关文档

- [国内镜像源](mirror-source)

---

### 参考链接

- [PCI(e) Passthrough](https://pve.proxmox.com/wiki/PCI(e)_Passthrough)
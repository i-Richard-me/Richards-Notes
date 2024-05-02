---
title: "搭建大模型部署容器环境"
description: "介绍如何搭建一个支持大模型部署的容器环境，包括安装 NVIDIA Container Toolkit、构建 Docker 镜像、配置和使用容器。"
---

## 安装 NVIDIA Container Toolkit

NVIDIA Container Toolkit 允许用户以容器形式轻松部署、运行 GPU 加速的应用。在开始之前，请确保您的系统已安装 Docker 和 NVIDIA 驱动。

1. **添加 NVIDIA 容器工具包的 GPG 密钥和仓库**。

   ```bash
   curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
    && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
   ```

2. **启用实验性支持（可选）**。如果您希望使用最新的实验性功能，可以启用实验性仓库。

   ```bash
   sed -i -e '/experimental/ s/^#//g' /etc/apt/sources.list.d/nvidia-container-toolkit.list
   ```

3. **安装 NVIDIA Container Toolkit**。

   ```bash
   sudo apt-get update
   sudo apt-get install -y nvidia-container-toolkit
   ```

4. **配置 Docker 以使用 NVIDIA Container Runtime**。这一步骤确保 Docker 能够使用 NVIDIA GPU。

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    ```

5. **重启 Docker 服务**。

   ```bash
   sudo systemctl restart docker
   ```

## 构建 Docker 镜像

接下来，我们将构建一个 Docker 镜像，该镜像基于 NVIDIA CUDA，预装了 Miniconda 和大量用于数据科学和深度学习的 Python 包，可以直接用于大模型部署和大模型应用的开发。

1. **创建 Dockerfile：**

   以下是 Dockerfile 的内容，它从 `nvidia/cuda:12.3.2-devel-ubuntu20.04` 基础镜像开始，安装了必要的软件包，并配置了 SSH
   服务。此外，它还设置了 Miniconda 环境，并安装了多个 Python 包，以支持机器学习和深度学习项目。

   ```dockerfile
    FROM nvidia/cuda:12.3.2-devel-ubuntu20.04
    
    # 设置非交互式环境变量
    ENV DEBIAN_FRONTEND=noninteractive
    
    # 添加国内镜像源
    RUN cat <<'EOF' > /etc/apt/sources.list
    deb https://mirrors.cernet.edu.cn/ubuntu/ focal main restricted universe multiverse
    # deb-src https://mirrors.cernet.edu.cn/ubuntu/ focal main restricted universe multiverse
    deb https://mirrors.cernet.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
    # deb-src https://mirrors.cernet.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
    deb https://mirrors.cernet.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
    # deb-src https://mirrors.cernet.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
    
    # deb https://mirrors.cernet.edu.cn/ubuntu/ focal-security main restricted universe multiverse
    # # deb-src https://mirrors.cernet.edu.cn/ubuntu/ focal-security main restricted universe multiverse
    
    deb http://security.ubuntu.com/ubuntu/ focal-security main restricted universe multiverse
    # deb-src http://security.ubuntu.com/ubuntu/ focal-security main restricted universe multiverse
    EOF
    
    # 安装SSH服务器
    RUN apt-get update && \
    apt-get install -y openssh-server wget vim git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
    
    # 创建一个新的root密码（请更改为您自己的密码）
    RUN echo 'root:yourpassword' | chpasswd
    
    # 允许root用户远程登录
    RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
    
    # 修改SSH端口为8022
    RUN sed -i 's/#Port 22/Port 8022/' /etc/ssh/sshd_config
    
    # 防止SSH会话意外中断
    RUN echo "ClientAliveInterval 60" >> /etc/ssh/sshd_config
    RUN echo "ClientAliveCountMax 3" >> /etc/ssh/sshd_config
    
    # 创建SSH运行目录
    RUN mkdir /var/run/sshd
    
    # 下载 Miniconda 安装脚本
    RUN wget http://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda/Miniconda3-latest-Linux-x86_64.sh
    
    # 安装 Miniconda
    RUN bash Miniconda3-latest-Linux-x86_64.sh -b
    RUN rm -f Miniconda3-latest-Linux-x86_64.sh
    
    # 将 conda 加入环境变量 PATH
    ENV PATH="/root/miniconda3/bin:${PATH}"
    
    # 添加conda国内镜像源
    RUN cat <<'EOF' > ~/.condarc
    channels:
    - defaults
      show_channel_urls: true
      default_channels:
      - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main
      - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/r
      - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/msys2
        custom_channels:
        conda-forge: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
        pytorch: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
        EOF
    
    RUN conda config --set custom_channels.conda-forge https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/
    
    # 初始化环境
    RUN conda init
    
    # 创建一个新环境，安装 Python 3.11
    RUN conda create --name chatbot python=3.11
    
    # 激活新环境
    RUN echo "conda activate chatbot" >> ~/.bashrc
    SHELL ["/bin/bash", "--login", "-c"]
    
    # 激活 Conda 环境
    SHELL ["conda", "run", "-n", "chatbot", "/bin/bash", "-c"]
    
    # 安装所需的软件包
    RUN pip install jupyterlab numpy matplotlib pymysql scipy pandas seaborn tqdm scikit-learn torch torchvision torchaudio -i https://pypi.tuna.tsinghua.edu.cn/simple/
    RUN pip install gradio openai pyyaml langchain sentence-transformers pymilvus accelerate dashscope einops bs4 -i https://pypi.tuna.tsinghua.edu.cn/simple/
    RUN pip install auto-gptq optimum tiktoken transformers_stream_generator sse_starlette tavily-python pinecone-client networkx langchainhub langchain_experimental -i https://pypi.tuna.tsinghua.edu.cn/simple/
    RUN pip install fastapi uvicorn flash_attn mdtex2html pydantic mysql-connector-python -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

2. **构建镜像：**
   ```bash
   docker build -t cuda_container_chatbot .
   ```

## 启动和管理容器

使用 `docker-compose.yml` 文件来定义和运行多容器 Docker 应用程序。

1. **创建 `docker-compose.yml` 文件：**

   ```yml
   // docker-compose.yml
   
   version: '3'
   services:
     cuda_container_chatbot:
       container_name: cuda_container_chatbot
       image: cuda_container_chatbot
       ports:
         - "8022:8022"
         - "8888:8888"
         - "7680:7680"
         - "5280:5280"
         - "7990:7990"
       runtime: nvidia  # 使用 NVIDIA Docker 运行时
       environment:
         - NVIDIA_VISIBLE_DEVICES=all  # 可见的 GPU 设备
       volumes:
         - /opt/ai:/opt/ai
       command: tail -f /dev/null  # 保持容器运行，以便您可以进入容器进行交互
   ```

2. **启动容器：**
   ```bash
   docker-compose up -d
   ```

3. **启动 SSH 服务（如果需要）：**
   ```bash
   sudo docker exec cuda_container_chatbot service ssh start
   ```

4. **进入容器：**
   ```bash
   docker exec -it cuda_container_chatbot /bin/bash
   ```
   
### 启动 JupyterLab 服务（如果需要）

1. **进入容器**

2. **配置密码**
   ```bash
   jupyter lab password
   ```

3. **启动 JupyterLab**
   ```bash
   jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --notebook-dir=/ai/
   ```
   
   :::tip
   - `--no-browser` 参数允许在远程服务器上运行 JupyterLab。
   - `--allow-root` 参数允许以 root 用户身份运行 JupyterLab。
   - `--ip` 参数指定了 JupyterLab 的监听地址。
   - `--notebook-dir` 参数指定了 JupyterLab 的工作目录，可以根据实际情况进行修改。
   :::

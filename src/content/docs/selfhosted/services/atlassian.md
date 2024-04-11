---
title: "Atalssian套件"
---

:::note
翻了全网对 Atlassian 软件(crowd, jira, confluence)的安装教程都是上古版本。其实官方提供了非常方便的 Docker 镜像，但说明文档中仅提供了单独的 docker run 命令。
在此提供一份整合了数据库 docker-compose 文件，实现快速部署，同时补充了优化参数。
:::

## 编写 `docker-compose.yml` 文件

### 优化参数说明

1. 挂载破解文件路径

    创建 `/opt/agent` 文件夹，在 yml 文件中的 volumes 部分添加 `- /opt/agent:/opt/agent`。

2. 使用nginx反代时需添加的参数

    若使用反向代理工具如 nginx，需要在 yml 文件中的 environment 部分添加以下参数：`ATL_PROXY_NAME`、`ATL_PROXY_PORT`、`ATL_TOMCAT_SCHEME`、`ATL_TOMCAT_SECURE`。若不使用，可以删掉或注释掉。

3. 设置容器和软件默认的时区

    在 yml 文件中的 environment 部分添加 `- TZ=Asia/Shanghai`，以及 `- JVM_SUPPORT_RECOMMENDED_ARGS=-Duser.timezone=Asia/Shanghai`。

4. 扩大JVM内存资源上限

    当用户和内容增多之后，JVM内存资源不足会导致软件运行缓慢。此时可以通过扩大JVM内存资源上限来解决，当然也要看服务器的硬件资源是否足够。具体调整参数详见样例文件的中的 `JVM_MINIMUM_MEMORY`、`JVM_MAXIMUM_MEMORY`、`JVM_RESERVED_CODE_CACHE_SIZE`。

    如果是初次使用，可以先删掉或注释掉，等到需要时再调整。

5. 设置Confluence字体文件路径

    在准备放置 `docker-compose.yml` 文件的目录下创建 `fonts` 文件夹，将字体文件放入其中。

    在 yml 文件中的 volumes 部分添加 `- ./fonts:/usr/local/share/fonts`。

6. 集成 PostgreSQL 数据库

    :::tip
    Atlassian 因授权限制默认不集成 mysql 驱动，因此使用 PostgreSQL 数据库，截止目前(2023.06)，支持到 PostgreSQL 14。
    :::

### `docker-compose.yml` 样例

:::caution
注意修改以下带有注释的参数。
:::

```yml
// docker-compose.yml

version: '3.8'
services:
  jira:
    image: atlassian/jira-software
    container_name: jira
    depends_on: 
      - dbjira
    ports:
      - 8080:8080
    volumes:
      - jiraVolume:/var/atlassian/application-data/jira
      - /opt/agent:/opt/agent
    environment:
      - ATL_PROXY_NAME=jira.example.com # 更改为自己的域名
      - ATL_PROXY_PORT=443
      - ATL_TOMCAT_SCHEME=https
      - ATL_TOMCAT_SECURE=true
      - ATL_JDBC_URL=jdbc:postgresql://dbjira:5432/jira
      - ATL_JDBC_USER=jira
      - ATL_JDBC_PASSWORD="password" # 这里的密码要和数据库的密码一致
      - ATL_DB_TYPE=postgres72
      - ATL_DB_DRIVER=org.postgresql.Driver
      - TZ=Asia/Shanghai
      - JVM_MINIMUM_MEMORY=1024m # 默认为384m，视实际情况调整
      - JVM_MAXIMUM_MEMORY=2048m # 默认为768m，视实际情况调整
      - JVM_RESERVED_CODE_CACHE_SIZE=1024m # 默认为512m，视实际情况调整
      - JVM_SUPPORT_RECOMMENDED_ARGS=-Duser.timezone=Asia/Shanghai
    restart: always

  confluence:
    image: atlassian/confluence
    container_name: confluence
    depends_on: 
      - dbconf
    ports:
      - 8090:8090
      - 8091:8091
    environment:
      - ATL_PROXY_NAME=conf.example.com # 更改为自己的域名
      - ATL_PROXY_PORT=443
      - ATL_TOMCAT_SCHEME=https
      - ATL_TOMCAT_SECURE=true
      - ATL_JDBC_URL=jdbc:postgresql://dbconf:5432/conf
      - ATL_JDBC_USER=conf
      - ATL_JDBC_PASSWORD="password" # 这里的密码要和数据库的密码一致
      - ATL_DB_TYPE=postgresql
      - TZ=Asia/Shanghai
      - JVM_MINIMUM_MEMORY=2048m # 默认为1024m，视实际情况调整
      - JVM_MAXIMUM_MEMORY=4096m # 默认为1024m，视实际情况调整
      - JVM_RESERVED_CODE_CACHE_SIZE=512m # 默认为256m，视实际情况调整
      - JVM_SUPPORT_RECOMMENDED_ARGS=-Duser.timezone=Asia/Shanghai
      - CATALINA_OPTS=-Dconfluence.document.conversion.fontpath=/usr/local/share/fonts/
    volumes:
      - confluenceVolume:/var/atlassian/application-data/confluence
      - /opt/agent:/opt/agent
      - ./fonts:/usr/local/share/fonts
    restart: always

  dbjira:
    image: docker.io/bitnami/postgresql:14
    ports:
      - '5432:5432' # 如果不打算暴露数据库端口，可以注释掉
    volumes:
      - 'dbjira_data:/bitnami/postgresql'
    environment:
      - POSTGRESQL_USERNAME=jira
      - POSTGRESQL_DATABASE=jira
      - POSTGRESQL_PASSWORD="password" # 请设置为自己的密码
    restart: always

  dbconf:
    image: docker.io/bitnami/postgresql:14
    ports:
      - '6432:5432' # 如果不打算暴露数据库端口，可以注释掉
    volumes:
      - 'dbconf_data:/bitnami/postgresql'
    environment:
      - POSTGRESQL_USERNAME=conf
      - POSTGRESQL_DATABASE=conf
      - POSTGRESQL_PASSWORD="password" # 请设置为自己的密码
    restart: always

volumes:
  dbjira_data: 
  dbconf_data:
  jiraVolume: 
  confluenceVolume:
```

## 破解

### 宿主机配置

1. 安装 Java

    由于宿主机使用了minimal安装，没有自带Java。若系统中已有，可以跳过该步。

      ```bash
      dnf install java-17-openjdk
      ```

2. 上传破解工具到宿主机和容器

    :::tip
    上传破解文件到 `/opt/agent/`。在 yml 文件中，我们映射了宿主机和容器内相同的存放位置，方便后续配置Java变量。
    :::

3. 配置Java环境变量

    将下面的内容添加到宿主机和容器内的全局变量，添加到 `/etc/profile` 里。
    
      ```bash
      vim /etc/profile
      ```
    
      ```bash
      export JAVA_OPTS="-javaagent:/opt/agent/atlassian-agent.jar ${JAVA_OPTS}"
      ```

4. 生效配置

    重启或运行以下命令。
    
      ```Bash
      source /etc/profile
      ```

### 容器内配置

1. 进入容器

      ```Bash
      # 进入 jira 容器
      docker exec -it jira /bin/bash
    
      # 进入 Confluence 容器
      docker exec -it confluence /bin/bash
      ```

2. 安装 `vim` 工具

    由于要在容器内添加 Java 环境变量，先安装 vim 编辑工具
    
      ```bash
      apt update
      apt install vim
      ```

3. 编辑 `setenv.sh` 文件

      ```bash
      vim /opt/atlassian/jira/bin/setenv.sh
    
      vim /opt/atlassian/confluence/bin/setenv.sh
      ```

4. 在末尾添加该行
    
      ```bash
      export JAVA_OPTS="-javaagent:/opt/agent/atlassian-agent.jar ${JAVA_OPTS}"
      ```
5. 退出容器

      ```bash
      exit
      ```

6. 重启容器

    完成前两步后，需要重启容器，让环境变量生效，才能进行下一步。

      ```bash
      docker restart jira
      docker restart confluence
      ```

### 计算破解码

:::tip
以下命令中：
- `jira`，`conf`，`crowd` 是对应的应用名。
- `-m` 为邮箱，`-n` 为用户名，`-o` 为网址，可任意填写。
- `-s` 为许可编号，根据输入秘钥界面的提示填入。
:::

```bash
java -jar /opt/agent/atlassian-agent.jar -d -p jira -m admin@example.com -n admin -o https://example.com -s BXAY-7KCQ-MXW2-K6D8
```

---

## 参考文档

- [How to set the timezone for docker container | Atlassian Support | Atlassian Documentation](https://confluence.atlassian.com/kb/how-to-set-the-timezone-for-docker-container-976780914.html)

- [Configuring System Properties | Confluence Data Center and Server 5.9 | Atlassian Documentation](https://confluence.atlassian.com/conf59/configuring-system-properties-792499726.html)

- [Setting properties and options on startup | Administering Jira applications Data Center and Server 9.9 | Atlassian Documentation](https://confluence.atlassian.com/adminjiraserver/-setting-properties-and-options-on-startup-938847831.html)

- [Recognized System Properties](https://confluence.atlassian.com/doc/recognized-system-properties-190430.html)
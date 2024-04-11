---
title: "Gitlab代码仓库"
---

Gitlab是一个开源的一体化DevOps平台，包含了git仓库管理、issue跟踪、CI/CD等功能。

## 初次部署

### 参数配置

**常规`docker-compose.yml`文件**

```yaml
version: '3.6'
services:
  web:
    image: 'gitlab/gitlab-ee:latest'
    restart: always
    hostname: 'gitlab.example.com'
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.example.com'
        # Add any other gitlab.rb configuration here, each on its own line
    ports:
      - '80:80'
      - '443:443'
      - '22:22'
    volumes:
      - '/srv/gitlab/config:/etc/gitlab'
      - '/srv/gitlab/logs:/var/log/gitlab'
      - '/srv/gitlab/data:/var/opt/gitlab'
    shm_size: '256m'
```

**常用配置**

:::tip
在`docker-compose.yml`文件中，`GITLAB_OMNIBUS_CONFIG`参数用于配置`gitlab.rb`文件，`gitlab.rb`文件中的配置项可以参考[官方文档](https://docs.gitlab.com/omnibus/settings/configuration.html)。
:::


### 启动服务

```bash
docker-compose up -d
```

**获取初始密码**

:::caution
默认 root 密码文件将在 24 小时后删除，需要保存好或及时更换密码。
:::

```bash
sudo docker exec -it gitlab-web-1 grep 'Password:' /etc/gitlab/initial_root_password
```

## Gitlab版本更新

:::caution
Gitlab 升级需要遵循一定的升级路线，当长期没有升级，或者跨版本升级时，需要先升级到某个中间版本，再升级到最新版本。

具体的升级路线图，可以参考 [GitLab升级路线](https://gitlab-com.gitlab.io/support/toolbox/upgrade-path/)，选择当前版本与目标版本，即可查看升级路线。
:::

```bash
docker compose pull
docker compose up -d
```

## Gitlab-ee破解

1. 进入容器

    ```bash
    sudo docker exec -it gitlab-web-1 /bin/bash
    ```

2. 创建文件 `vi license.rb`

    ```ruby title="license.rb"
    require "openssl"  
    require "gitlab/license"  
      
    key_pair = OpenSSL::PKey::RSA.generate(2048)  
    File.open("license_key", "w") { |f| f.write(key_pair.to_pem) }  
      
    public_key = key_pair.public_key  
    File.open("license_key.pub", "w") { |f| f.write(public_key.to_pem) }  
      
    private_key = OpenSSL::PKey::RSA.new File.read("license_key")  
    Gitlab::License.encryption_key = private_key  
      
    license = Gitlab::License.new  
    license.licensee = {  
    "Name" => "Homelab",  
    "Company" => "Homelab",  
    "Email" => "admin@example.com",  
    }  
    license.starts_at = Date.new(2023, 1, 1) # 开始时间  
    license.expires_at = Date.new(2100, 1, 1) # 结束时间  
    license.notify_admins_at = Date.new(2099, 12, 1)  
    license.notify_users_at = Date.new(2099, 12, 1)  
    license.block_changes_at = Date.new(2100, 1, 1)  
    license.restrictions = {  
    active_user_count: 100000,
    }  
      
    puts "License:"  
    puts license  
      
    data = license.export  
    puts "Exported license:"  
    puts data  
    File.open("GitLabBV.gitlab-license", "w") { |f| f.write(data) }  
      
    public_key = OpenSSL::PKey::RSA.new File.read("license_key.pub")  
    Gitlab::License.encryption_key = public_key  
      
    data = File.read("GitLabBV.gitlab-license")  
    $license = Gitlab::License.import(data)  
      
    puts "Imported license:"  
    puts $license  
      
    unless $license  
    raise "The license is invalid."  
    end  
      
    if $license.restricted?(:active_user_count)  
    active_user_count = 100000  
    if active_user_count > $license.restrictions[:active_user_count]  
        raise "The active user count exceeds the allowed amount!"  
    end  
    end  
      
    if $license.notify_admins?  
    puts "The license is due to expire on #{$license.expires_at}."  
    end  
      
    if $license.notify_users?  
    puts "The license is due to expire on #{$license.expires_at}."  
    end  
      
    module Gitlab  
    class GitAccess  
        def check(cmd, changes = nil)  
        if $license.block_changes?  
            return build_status_object(false, "License expired")  
        end  
        end  
    end  
    end  
      
    puts "This instance of GitLab Enterprise Edition is licensed to:"  
    $license.licensee.each do |key, value|  
    puts "#{key}: #{value}"  
    end  
      
    if $license.expired?  
    puts "The license expired on #{$license.expires_at}"  
    elsif $license.will_expire?  
    puts "The license will expire on #{$license.expires_at}"  
    else  
    puts "The license will never expire."  
    end
    ```

3. 生成证书

    ```bash
    ruby license.rb
    ```

   :::caution
   这一步在shell中显示的秘钥需要保存，最后在gitlab后台导入许可证时需要。
   :::

4. 替换默认公钥

    ```bash
    cp -f license_key.pub /opt/gitlab/embedded/service/gitlab-rails/.license_encryption_key.pub
    ```

5. 升级到 ULTIMATE 版本

   修改文件 `/opt/gitlab/embedded/service/gitlab-rails/ee/app/models/license.rb`

    ```ruby title="license.rb"
    ...
    restricted_attr(:plan).presence || STARTER_PLAN
    ...
    
    # 修改为
    restricted_attr(:plan).presence || ULTIMATE_PLAN
    ```

6. 重启配置gitlab

    ```bash
    gitlab-ctl reconfigure
    gitlab-ctl restart
    ```

7. 导入许可证

   登录 gitlab 后台，管理中心 -> 许可证 (/admin/license)，导入 GitLabBV.gitlab-license
   可以选择 cat GitLabBV.gitlab-license 打印出文件内容后，把密钥复制后使用密钥文本。
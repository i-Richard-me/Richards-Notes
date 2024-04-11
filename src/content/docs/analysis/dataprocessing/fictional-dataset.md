---
title: "以员工晋升记录为例虚构数据集"
description: "介绍如何通过构造一个员工晋升数据集来演示数据集虚构的技巧。"
---

当我们需要分享数据或制作演示时，保障数据的安全性是至关重要的。以下是如何通过构造一个员工晋升数据集来演示数据集虚构的技巧的详细说明。

## 数据集基本构造要求

为了保障数据集看上去更贴近真实情况，以下是我们假定该数据集应该具备的一些基本要求

- **时间跨度**：2018年至2022年。
- **数据结构**：每一年每个员工一行数据。
- **员工数量**：每年1000名员工，总计5000行数据。
- **字段内容**：
    - 年份：2018至2022。
    - 员工ID：格式为E0001。
    - 员工姓名：随机生成。
    - 所属业务：分为5个业务部门，不同业务的员工数量比例不同。
    - 所属岗位：分为技术、销售、运营、人事、财务五个部门，各岗位员工数量比例各异。
    - 员工晋升前级别：1至6的整数，代表不同的职级，各级别的员工比例不同。
    - 员工晋升前在当前级别的停留时长：根据级别不同，平均停留时长有所不同。
    - 本年度是否符合提名条件：是或否，根据员工在当前级别的停留时长判断。
    - 本年度是否被提名作为候选人：是或否，只有符合提名条件的员工才有可能被提名。
    - 本年度是否晋升成功：是或否，只有被提名的员工才有可能晋升成功。
    - 员工晋升后级别：如果本年度晋升成功，则晋升后级别比晋升前级别高1级，否则与晋升前级别相同。

## 数据集构造过程

1. 初始化和基础结构构造

    首先，我们初始化Faker库来生成随机的员工姓名，并定义了数据集的基础结构：

    ```python
    import pandas as pd
    from faker import Faker
    import numpy as np
    
    fake = Faker()
    years = [2018, 2019, 2020, 2021, 2022]
    employees = range(1, 1001)  # 1000名员工
    data = [(year, f'E{emp_id:04d}', fake.name()) for year in years for emp_id in employees]
    df = pd.DataFrame(data, columns=['年份', '员工ID', '员工姓名'])
    ```

2. 分配员工到不同的业务和岗位

    我们使用Numpy的随机选择功能来根据指定的比例将员工分配到不同的业务和岗位中：
    
    ```python
    businesses = ['业务1', '业务2', '业务3', '业务4', '业务5']
    business_ratios = [0.35, 0.15, 0.2, 0.2, 0.1]
    departments = ['技术', '销售', '运营', '人事', '财务']
    department_ratios = [0.4, 0.1, 0.3, 0.1, 0.1]
    
    df['所属业务'] = np.random.choice(businesses, p=business_ratios, size=len(df))
    df['所属岗位'] = np.random.choice(departments, p=department_ratios, size=len(df))
    ```

3. 分配晋升前级别并计算停留时长

    接下来，我们根据预设的比例分配员工的晋升前级别，并计算他们在当前级别的停留时长：
    
    ```python
    level_ratios = [0.2, 0.3, 0.2, 0.15, 0.1, 0.05]
    levels = range(1, 7)
    df['员工晋升前级别'] = np.random.choice(levels, p=level_ratios, size=len(df))
    
    def generate_duration(level):
        mean = level_duration_means[level]
        sigma = 0.2
        log_normal_value = np.random.lognormal(np.log(mean) - sigma**2 / 2, sigma)
        while log_normal_value > 2 * mean:
            log_normal_value = np.random.normal(mean, mean * 0.2)
        return max(0.1, log_normal_value)
    
    df['员工晋升前在当前级别的停留时长'] = df['员工晋升前级别'].apply(generate_duration)
    ```

4. 判断提名条件和晋升结果

    最后，我们根据员工的停留时长和级别来判断他们是否符合提名条件，是否被提名，以及是否晋升成功，并据此更新他们的级别：
  
    ```python
    nomination_conditions = {1: 0.8, 2: 1.3, 3: 1.8, 4: 2.3, 5: 2.8, 6: float('inf')}
    df['本年度是否符合提名条件'] = df.apply(lambda row: '是' if row['员工晋升前在当前级别的停留时长'] > nomination_conditions[row['员工晋升前级别']] else '否', axis=1)
    
    df['本年度是否被提名作为候选人'] = df.apply(nominate, axis=1)
    df['本年度是否晋升成功'] = df.apply(promote, axis=1)
    df['员工晋升后级别'] = df.apply(lambda row: min(6, row['员工晋升前级别'] + 1) if row['本年度是否晋升成功'] == '是' else row['员工晋升前级别'], axis=1)
    
    df['员工晋升前级别'] = df['员工晋升前级别'].apply(lambda x: f'Level {x}')
    df['员工晋升后级别'] = df['员工晋升后级别'].apply(lambda x: f'Level {x}')
    ```
    
通过以上步骤，我们成功构造了一个虚拟的员工晋升数据集，不仅涵盖了员工的基本信息，还模拟了他们的晋升路径。
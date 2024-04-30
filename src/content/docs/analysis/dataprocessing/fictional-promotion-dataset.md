---
title: "以员工晋升记录为例虚构数据集"
description: "介绍如何通过构造一个员工晋升数据集来演示数据集虚构的技巧。"
---

当我们需要分享数据或制作演示时，保障数据的安全性是至关重要的。以下是如何通过构造一个员工晋升数据集来演示数据集虚构的技巧的详细说明。

:::note
在 Tableau 可视化进阶的分享中，就是利用该虚构的晋升记录数据集搭建的演示看板。
:::

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
    - 所属部门：分为技术、销售、运营、人事、财务五个部门，各部门员工数量比例各异。
    - 所属岗位：每个部门下各设置 5 个岗位，随机分配。
    - 人才来源：分为校园招聘和社会招聘，其中社会招聘占比更高。
    - 员工晋升前级别：1至6的整数，代表不同的职级，各级别的员工比例不同。
    - 员工晋升前在当前级别的停留时长：根据级别不同，平均停留时长有所不同。
    - 本年度是否符合提名条件：是或否，根据员工在当前级别的停留时长判断。
    - 本年度是否被提名作为候选人：是或否，只有符合提名条件的员工才有可能被提名。
    - 本年度是否晋升成功：是或否，只有被提名的员工才有可能晋升成功。
    - 员工晋升后级别：如果本年度晋升成功，则晋升后级别比晋升前级别高1级，否则与晋升前级别相同。

## 数据集构造过程

:::caution
数据集构造过程中模拟的参数依常识设定，请勿作为真实数据和结论参考。如有雷同，纯属巧合。
:::

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

2. 分配员工到不同的业务、部门、岗位和人才来源

    我们使用Numpy的随机选择功能来根据指定的比例将员工分配到不同的业务和岗位中：
    
    ```python
    businesses = ['业务1', '业务2', '业务3', '业务4', '业务5']
    business_ratios = [0.35, 0.15, 0.2, 0.2, 0.1]
    departments = ['技术', '销售', '运营', '人事', '财务']
    department_ratios = [0.4, 0.1, 0.3, 0.1, 0.1]
    
    df['所属业务'] = np.random.choice(businesses, p=business_ratios, size=len(df))
    df['所属部门'] = np.random.choice(departments, p=department_ratios, size=len(df))
   
    # 分配具体岗位
    department_positions = {
    '技术': ['算法工程师', '大数据工程师', 'IT运维', '软件开发', '硬件工程师'],
    '销售': ['区域销售', '国际销售', '客户关系', '销售分析', '商务拓展'],
    '运营': ['产品管理', '物流调度', '供应链', '客服', '项目管理'],
    '人事': ['招聘专员', '培训专员', '薪酬福利', '员工关系', '人才发展'],
    '财务': ['会计', '审计', '财务分析', '风险管理', '结算管理']
    }
    
    def assign_position(department):
    return np.random.choice(department_positions[department])
   
    df['岗位名称'] = df['所属部门'].apply(assign_position)
   
    # 添加人才来源标签
    talent_sources = ['校园招聘', '社会招聘']
    source_ratios = [0.3, 0.7]
    df['人才来源'] = np.random.choice(talent_sources, p=source_ratios, size=len(df))
    ```

3. 分配晋升前级别并计算停留时长

    接下来，我们根据预设的比例分配员工的晋升前级别，并计算他们在当前级别的停留时长：
    
    ```python
    level_ratios = [0.2, 0.3, 0.2, 0.15, 0.1, 0.05]
    levels = range(1, 7)
    df['员工晋升前级别'] = np.random.choice(levels, p=level_ratios, size=len(df))
    
    level_duration_means = {1: 1, 2: 1.5, 3: 2, 4: 2.5, 5: 3, 6: 3.5}
   
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
    # 判断是否符合提名条件
    nomination_conditions = {1: 0.8, 2: 1.3, 3: 1.8, 4: 2.3, 5: 2.8, 6: float('inf')}
    df['本年度是否符合提名条件'] = df.apply(lambda row: '是' if row['员工晋升前在当前级别的停留时长'] > nomination_conditions[row['员工晋升前级别']] else '否', axis=1)
    
    # 判断是否被提名以及是否晋升成功
    nomination_ratios = {1: 0.35, 2: 0.25, 3: 0.2, 4: 0.15, 5: 0.1}
    promotion_ratios = {1: 0.9, 2: 0.8, 3: 0.7, 4: 0.6, 5: 0.5}
   
   def nominate(row):
     if row['本年度是否符合提名条件'] == '否':
        return '否'
     else:
        level = row['员工晋升前级别']
        return '是' if np.random.rand() < nomination_ratios.get(level, 0) else '否'

   def promote(row):
      if row['本年度是否被提名作为候选人'] == '否':
         return '否'
      else:
         level = row['员工晋升前级别']
      return '是' if np.random.rand() < promotion_ratios.get(level, 0) else '否'
   
    df['本年度是否被提名作为候选人'] = df.apply(nominate, axis=1)
    df['本年度是否晋升成功'] = df.apply(promote, axis=1)
    df['员工晋升后级别'] = df.apply(lambda row: min(6, row['员工晋升前级别'] + 1) if row['本年度是否晋升成功'] == '是' else row['员工晋升前级别'], axis=1)
    
    df['员工晋升前级别'] = df['员工晋升前级别'].apply(lambda x: f'Level {x}')
    df['员工晋升后级别'] = df['员工晋升后级别'].apply(lambda x: f'Level {x}')
    ```
    
通过以上步骤，我们成功构造了一个虚拟的员工晋升数据集，不仅涵盖了员工的基本信息，还模拟了他们的晋升路径。
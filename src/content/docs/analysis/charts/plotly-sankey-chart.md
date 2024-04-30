---
title: "通过绘制桑基图描述员工绩效流动"
description: "通过Python中的plotly库演示如何构建并绘制桑基图，展示员工绩效从第一年到第二年的流动情况。"
---

桑基图是一种可视化数据流动的图表，在数据分析中，常用于展示指标之间的连续变化及其关系。

Python中的 Ploty 库和 echarts 都可以绘制出比较美观的桑基图。本文以员工两年连续绩效数据为例，先演示如何使用 Plotly 绘制桑基图，并通过数据透视探索员工绩效的变化趋势。

## 构造数据集

我们创建一个虚构数据集来代表 1000 名员工在连续两年的绩效评分，假定绩效高中低的比例为 2:7:1，而第二年绩效结果增加员工离职的情况。

:::caution
数据集构造过程中模拟的参数依常识设定，请勿作为真实数据和结论参考，如有雷同，纯属巧合。
:::

```python
import pandas as pd
import numpy as np

# 设置随机种子
np.random.seed(1994)

# 创建1000个员工的DataFrame
employees = pd.DataFrame(index=range(1, 1001))

# 生成第一年的绩效
performance_choices_year1 = ['高', '中', '低']
performance_prob_year1 = [0.2, 0.7, 0.1]
employees['第一年绩效'] = np.random.choice(performance_choices_year1, size=1000, p=performance_prob_year1)

# 根据第一年的绩效修正生成第二年的绩效的函数
def second_year_performance(first_year_performance):
    if first_year_performance == '高':
        return np.random.choice(['高', '中', '低', '离职'], p=[0.5, 0.3, 0.1, 0.1])
    elif first_year_performance == '中':
        return np.random.choice(['高', '中', '低', '离职'], p=[0.25, 0.5, 0.05, 0.2])
    elif first_year_performance == '低':
        return np.random.choice(['高', '中', '低', '离职'], p=[0.05, 0.35, 0.1, 0.5])

employees['第二年绩效'] = employees['第一年绩效'].apply(second_year_performance)
```

## 绘制桑基图

1. **统计数据转换**：计算从第一年到第二年的绩效转换统计值。

    ```python
    import plotly.graph_objects as go
    
    performance_transition_counts = employees.groupby(['第一年绩效', '第二年绩效']).size().reset_index(name='count')
    ```

2. **创建节点列表**：定义源节点和目标节点，转化为索引值。

    ```python
    source_target_counts = []
    for index, row in performance_transition_counts.iterrows():
        source = ['高', '中', '低'].index(row['第一年绩效'])
        target = 3 + ['高', '中', '低', '离职'].index(row['第二年绩效'])
        source_target_counts.append((source, target, row['count']))
    
    # 分解源、目标和权重为单独的列表
    sources, targets, counts = zip(*source_target_counts)
    ```

3. **配置颜色**：设置节点和链接颜色，以增强图表的视觉效果。

   :::tip[美化建议]
    1. 如果节点两侧有类似含义的节点，可以保持相同的配色。如本例中第一年和第二年的高中低绩效，可以设置颜色一致。
    2. 线条颜色可以与节点颜色设置为同色系，对线条和节点颜色设置不同的透明度。
    :::

   ```python
   node_colors = ["rgba(106, 90, 205, 0.8)", "rgba(244, 164, 96, 0.8)", "rgba(46, 139, 87, 0.8)"]
   link_colors = ["rgba(106, 90, 205, 0.3)", "rgba(244, 164, 96, 0.3)", "rgba(46, 139, 87, 0.3)"]
   
   # 根据源节点分配链接颜色
   link_colors_light = [link_colors[source] for source in sources]
   
   # 手动创建节点标签，确保两侧的高中低保持一致的颜色
   labels = ["第一年高", "第一年中", "第一年低", "第二年高", "第二年中", "第二年低", "第二年离职"]
   ```

4. **绘制桑基图**：使用 plotly 的 Sankey 方法创建图表。

   :::tip
   绘图中常见的参数及作用在以下代码中注释，可以根据实际情况进行调整。
   :::

   ```python
   fig = go.Figure(data=[go.Sankey(
       node=dict(
           pad=15,                             # 设置节点之间的间距
           thickness=20,                       # 设置节点的厚度
           line=dict(color="white", width=0),  # 设置节点边框的颜色和宽度
           label=labels,                       # 设置每个节点的标签
           color=node_colors * 2 + ["grey"]    # 对于第二年的离职使用灰色
       ),
       link=dict(
           source=sources,     # 源节点
           target=targets,     # 目标节点
           value=counts,       # 权重
           color=link_colors_light  # 更新后的链接颜色
       ))])
   
   fig.update_layout(title_text="员工绩效变化桑基图", font_size=10, width=800, height=600)
   fig.show()
   ```

## 效果展示

:::tip
由于桑基图对于节点的排列顺序是按照权重从大到小排列的，若希望指定节点顺序，如本例中我们希望按照绩效高中低排列，可以通过在交互式图表中拖拽调整。
:::

![员工绩效桑基图](../../../../assets/visualization/plotly-sankey-chart.png)

---
title: "特征筛选"
description: ""
---

我们在收集了大量数据和特征衍生后，会发现并不是所有特征都是有效的。有些特征都是零值（没有任何信息），有些特征对模型产生了负面影响，还有一些特征的数值重复度很高，几乎是完全相同的特征。

过多的无效特征会严重影响模型训练的效率，甚至影响模型的训练结果。因此，我们需要进行一轮特征筛选。特征筛选的目的是剔除无效特征，保留有效特征，从而提高模型的训练效率和训练结果。

## 1. 基于信息包含量

在特征筛选的初始阶段，我们需要快速剔除那些信息量有限或几乎没有有效信息的特征。判断特征是否有用可以使用两个指标：缺失值比例和单变量方差。

### 1.1 基于缺失值比例

对于某个特征来说，如果它的缺失值比例过高（例如超过90%），除非从业务角度可以用填补方法处理，否则可以认为该特征的信息严重缺失，没有进一步分析的必要，可以直接剔除。

由于数据探查环节已经确认了本案例中的数据集并不存在缺失值，因此跳过这一步。即使存在缺失值比例过高的字段，处理起来也是非常简单的。

### 1.2 基于单变量方差

对于没有缺失值的特征，我们可以通过计算方差来评估其信息量。通常来说，方差越小，特征包含的信息越少。如果某个特征的方差为0，说明该特征的所有取值都相同，相当于没有任何有效信息，这样的特征也应当被快速识别并剔除。

这个过程可以使用sklearn库中的VarianceThreshold评估器来快速完成。

:::note
特征的方差会受到其取值大小的影响。例如，一个特征的取值如果本身较大，那么计算出的方差也会较大。因此，对于连续变量，除非我们很确定所有特征的量纲（单位）一致，否则设置一个阈值来筛选特征意义不大。通常情况下只剔除那些方差为0的特征。
:::

```python
import pandas as pd
from sklearn.feature_selection import VarianceThreshold

# data = 原始数据集
# encoded_data = 对离散变量进行OrdinalEncoder后的数据集
# numerical_cols, categorical_cols, target_col = 三个字段名称的列表

# 提取特征
X = encoded_data[categorical_cols+numerical_cols].copy()

# 使用VarianceThreshold进行特征选择，剔除方差为0的特征
selector = VarianceThreshold(threshold=0)
selector.fit(X)

# 获取未被剔除的特征列
selected_features = X.columns[selector.get_support()]

# 创建结果 DataFrame
variance_results = pd.DataFrame({
    'Feature': X.columns,
    'Variance': selector.variances_
})

# 按方差降序排列
variance_results = variance_results.sort_values(by='Variance', ascending=False)
```

```text title="variance_results"
+----+--------------------------+--------------+
|    | Feature                  |     Variance |
|----+--------------------------+--------------|
| 24 | MonthlyRate              | 24905        |
| 23 | MonthlyIncome            | 18990        |
|  5 | EmployeeNumber           |  2067        |
| 20 | DailyRate                |  1397        |
| 22 | HourlyRate               |    70        |
| 19 | Age                      |    42        |
| 28 | TotalWorkingYears        |    40        |
| 30 | YearsAtCompany           |    37.5088   |
| 21 | DistanceFromHome         |    28        |
| 26 | PercentSalaryHike        |    13.386    |
| 31 | YearsInCurrentRole       |    13.1182   |
| 33 | YearsWithCurrManager     |    12.7229   |
| 32 | YearsSinceLastPromotion  |    10.377    |
| 25 | NumCompaniesWorked       |     6.2358   |
| 10 | JobRole                  |     6.05644  |
|  3 | EducationField           |     1.77134  |
| 29 | TrainingTimesLastYear    |     1.66109  |
|  9 | JobLevel                 |     1.22448  |
| 11 | JobSatisfaction          |     1.21544  |
|  6 | EnvironmentSatisfaction  |     1.19402  |
| 16 | RelationshipSatisfaction |     1.16822  |
|  2 | Education                |     1.0482   |
| 17 | StockOptionLevel         |     0.725541 |
| 12 | MaritalStatus            |     0.532714 |
|  8 | JobInvolvement           |     0.505975 |
| 18 | WorkLifeBalance          |     0.498769 |
|  0 | BusinessTravel           |     0.442529 |
|  1 | Department               |     0.278375 |
|  7 | Gender                   |     0.24     |
| 14 | OverTime                 |     0.202908 |
| 15 | PerformanceRating        |     0.130105 |
| 27 | StandardHours            |     0        |
| 13 | Over18                   |     0        |
|  4 | EmployeeCount            |     0        |
+----+--------------------------+--------------+
```

从上表中可以看出，`StandardHours`、`Over18`、`EmployeeCount`这三个特征的方差为0，即这三个特征的所有取值都相同，没有任何有效信息，可以直接剔除。

## 2. 基于相关性

## 3. 基于假设检验
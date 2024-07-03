---
title: "XGBoost 极端梯度提升树"
description: ""
---

XGBoost遵循Boosting算法的基本流程，通过迭代训练弱评估器来最小化损失函数。
每个新加入的弱评估器都会尝试修正前一个评估器的错误，这样的迭代过程使得集成模型输出的结果受到所有弱评估器的综合影响，从而提高了模型的准确性和鲁棒性。

## XGBoost的参数

XGBoost算法的性能优化很大程度上依赖于对其超参数的调整。以下是对XGBoost中关键参数的详细解释，以及它们对模型性能的影响：

:::note
影响力基于实践的一般规律，在不同数据集上的表现可能有所不同。
:::

- **极高影响力（⭐⭐⭐⭐⭐）**：
    - `num_boost_round`：决定了模型训练的迭代次数，即弱评估器的数量。增加迭代次数可以提高模型的精度，但也可能引入过拟合的风险。
    - `eta`：控制每棵树的学习速率，过大的值可能导致过拟合，过小的值可能导致学习不足。

- **高影响力（⭐⭐⭐⭐）**：
    - `booster`：这个参数允许用户选择提升树的具体算法。gbtree适用于处理数据特征较少且目标是分类或回归问题的情况；gblinear适用于线性回归问题；dart则是一种更加灵活的算法，它通过随机下降的方式来减少过拟合。
    - `colsample_bytree`、`colsample_bylevel`、`colsample_bynode`：控制每棵树在训练时考虑的特征比例。调整这些比例可以增加模型的随机性，从而降低过拟合的风险。
    - `gamma`：指定了节点分裂所需的最小损失减少值。较高的gamma值会使得模型更加保守，避免过于复杂的树结构，从而减少过拟合。
    - `lambda`（也称为`reg_lambda`）：控制模型正则化的程度，用于限制模型的复杂度，间接促进剪枝。
    - `min_child_weight`：定义子节点所需的最小样本权重和，用于防止模型在训练数据上过拟合，特别是在数据量较少的情况下

- **中等影响力（⭐⭐）**：
    - `max_depth`：限制决策树的最大深度，用于控制模型的复杂度和防止过拟合。
    - `alpha`（也称为`reg_alpha`）：控制L1正则化的程度，有助于增强模型的泛化能力。
    - `subsample`：定义训练每棵树时使用的样本比例，增加模型的随机性，有助于防止过拟合。
    - `objective`：指定模型优化的目标函数，影响模型的训练方式。
    - `scale_pos_weight`：在处理不平衡数据集时调整正负样本的权重，以改善模型对少数类的预测性能。

- **低影响力（⭐）**：
  - `base_score`：初始化。

### 调参说明

相较于其他基于树的集成算法，XGBoost的参数设计更为精细，许多参数如gamma和lambda等通过作用于建树过程来影响整个模型的性能。
这些参数之间的相互作用复杂，其影响力并非线性，且在参数调整过程中可能不会立即显现，但通常对模型的调整都会产生一定的效果。

因此，许多与结构风险相关的参数在XGBoost中被赋予了较高的影响力评级。

关于参数影响力的具体说明，以下几点评述值得注意：

- 在随机森林中极为关键的`max_depth`参数，在XGBoost中的默认值为6，虽然提供了比GBDT更宽泛的调整空间，但其影响力相对较小。这是因为XGBoost的默认设置已经相当保守，留给用户调整的空间有限。

- GBDT中的`max_features`参数在XGBoost中对应的是`colsample_by*`系列参数。虽然理论上这些参数的影响力应与`max_features`相当，但由于它们共同作用，调整难度较大，单个参数的效果可能不如`max_features`显著。

- 在XGBoost中，精剪枝参数如`min_child_weight`与结构分数的计算有关联，有时会显示出较大的影响力。因此，这个参数在影响力评级中被视为重要。

- 对于`objective`这类影响整体学习能力的参数，虽然通常具有较大影响力，但由于XGBoost为不同任务提供的损失函数选项有限，因此在实际调参中，损失函数的选择往往不是主要的调整对象。

- 另外，XGBoost的初始化分数只能是数值类型，随着迭代次数的增加和数据量的扩大，初始分数的影响逐渐减弱。因此，在大多数情况下，我们不会特别针对`base_score`进行调整。

## 调参实践

1. 使用 sklearn 建立数据预处理 pipeline
    
    该过程代码与[随机森林](random-forest-bayesian-optimizer#调参实践)中该步骤一致。

2. 定义目标函数

    ```python
    def objective(trial):
        # 定义超参数搜索空间
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 10, 500),
            'max_depth': trial.suggest_int('max_depth', 3, 7),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'learning_rate': trial.suggest_loguniform('learning_rate', 0.01, 1),
            'subsample': trial.suggest_float('subsample', 0.2, 0.9),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.2, 0.9),
            # 'gamma': trial.suggest_float('gamma', 1e5, 1e6),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 10),
            'reg_lambda': trial.suggest_float('reg_lambda', 0, 3),
            # 'scale_pos_weight': trial.suggest_float('scale_pos_weight', 1, 12)
        }
    
        # 创建 XGBoost 模型
        xgb = XGBClassifier(
            **params,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
    
        # 创建包含预处理和模型的管道
        clf = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', xgb)
        ])
    
        # 进行交叉验证
        scores = cross_val_score(clf, X_train, y_train, cv=4, scoring='roc_auc', n_jobs=-1)
        return scores.mean()
    ```

3. 运行优化器

    ```python
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=2500, n_jobs=-1)
    ```
   
4. 调参结果

    ```python
    best_params = study.best_params
    best_score = study.best_value
    print("最佳参数:", best_params)
    print("最佳交叉验证得分 (ROC AUC):", best_score)
    ```
   
    ```text title="Output"
    最佳参数: {'n_estimators': 376, 'max_depth': 3, 'min_child_weight': 3, 'learning_rate': 0.02267965802969682, 'subsample': 0.5611217417898335, 'colsample_bytree': 0.2139570336695205, 'reg_alpha': 0.44010568075112483, 'reg_lambda': 0.23911084539970587}
    最佳交叉验证得分 (ROC AUC): 0.8559756097560975
    ```
   
## 模型效果

将模型结果提交到kaggle上后，取得了目前为止的最佳得分。

```text title="Output"
fileName               date                 description    status    publicScore  privateScore  
---------------------  -------------------  -------------  --------  -----------  ------------  
submission.csv         2023-04-22 22:23:53  xgb-best       complete  0.90071      0.88448
```
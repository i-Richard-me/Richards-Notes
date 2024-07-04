---
title: "LightGBM 轻量梯度提升树"
description: "介绍LightGBM（LGBM）梯度提升树算法，并通过代码实践展示了如何在实际应用中使用。"
---

在尝试了一系列梯度提升树的改进算法后，我们继续探索更加前沿的集成学习算法：LightGBM（简称LGBM）和 CatBoost。
这两种算法都是GBDT的进一步优化，诞生时间较晚，因此在功能上有所增强，以应对当前复杂的机器学习应用场景。

**LightGBM（LGBM）**：

- 计算效率和内存占用：相比XGBoost，LGBM提供了更高效的计算性能和更低的内存使用，使其在处理大规模数据时更具优势。
- 过拟合控制：LGBM在处理高维数据时表现出更好的过拟合控制能力，这使得它成为探索性建模的理想选择，即作为Baseline模型。
- 建模效果：在实际建模效果上，LGBM与XGBoost不相上下，甚至在某些情况下表现更优。

### LightGBM的关键技术

- **基于直方图的决策树算法**：通过将连续特征值分桶成离散的直方图，减少了计算量和内存占用。
- **带深度限制的Leaf-wise生长策略**：相比于Level-wise生长策略，Leaf-wise策略在相同时间内能生成更深的树，从而提高模型精度。
- **特征并行和数据并行**：支持多线程并行计算，加速模型训练过程。

:::note
尽管LGBM和CatBoost在多个方面优于XGBoost，但这并不意味着它们在所有场景下都具有绝对优势。在实际应用中，XGBoost（甚至随机森林）仍然具有很高的实用价值。通常，我们需要尝试多种算法以获得最佳结果。

此外，由于这些算法（RF、XGB、LGBM、CatBoost）各具特色，它们的结果非常适合进一步的模型融合，以达到更优的效果。因此，在追求极致建模效果的场景中，这些模型都需要被训练并优化，然后再进行融合。
:::

## 代码实践

1. 使用 sklearn 建立数据预处理 pipeline

   参考[随机森林](random-forest-bayesian-optimizer#调参实践)中该步骤。

2. 定义目标函数

    ```python
    def objective(trial):
        # 定义超参数搜索空间
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 250, 350),
            'max_depth': trial.suggest_int('max_depth', 1, 5),
            'learning_rate': trial.suggest_float('learning_rate', 0.06, 0.1),
            'num_leaves': trial.suggest_int('num_leaves', 20, 60),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'subsample_freq': trial.suggest_int('subsample_freq', 1, 3),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 0.9),
            'lambda_l1': trial.suggest_float('lambda_l1', 0.1, 1),
            'lambda_l2': trial.suggest_float('lambda_l2', 0.1, 1),
            'min_gain_to_split': trial.suggest_float('min_gain_to_split', 0.1, 2),
            'min_data_in_leaf': trial.suggest_int('min_data_in_leaf', 5, 70),
            'bagging_fraction': trial.suggest_float('bagging_fraction', 0.5, 0.9),
            'feature_fraction': trial.suggest_float('feature_fraction', 0.1, 0.3),
        }
    
        # 创建 LightGBM 模型
        lgbm = LGBMClassifier(
            **params,
            random_state=94,
            # class_weight='balanced',
            verbose=-1
        )
    
        # 创建包含预处理和模型的管道
        clf = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', lgbm)
        ])
    
        # 进行交叉验证
        scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='roc_auc', n_jobs=-1)  # 将交叉验证的折数减少到 3
        return scores.mean()
    ```

3. 模型训练

    ```python
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=300, n_jobs=-1)
    ```

4. 调参结果

    ```python
    最佳参数: {'n_estimators': 340, 'max_depth': 2, 'learning_rate': 0.09120536829685104, 'num_leaves': 39, 'subsample': 0.9518485950238226, 'subsample_freq': 2, 'colsample_bytree': 0.7370999229495948, 'lambda_l1': 0.7150238555812067, 'lambda_l2': 0.3328513354897683, 'min_gain_to_split': 1.6424059831736437, 'min_data_in_leaf': 32, 'bagging_fraction': 0.5974943614449808, 'feature_fraction': 0.13410716767146635}
    最佳交叉验证得分 (ROC AUC): 0.851099175446633
    ```

## 模型效果

将模型结果提交到kaggle上，也获得了较高的得分。

```text title="Output"
fileName               date                 description    status    publicScore  privateScore  
---------------------  -------------------  -------------  --------  -----------  ------------  
submission.csv         2024-04-22 23:46:43  lgbm-best      complete  0.90662      0.88374
```
---
title: "随机森林与贝叶斯优化器"
description: ""
---

集成学习是一种在机器学习领域中领先的方法，核心在于训练一系列基础模型（弱评估器），然后通过特定的策略将这些模型的预测结果综合起来，以提高解决问题的准确性和鲁棒性。

随机森林是一种基于Bagging策略的集成学习算法，它通过从原始数据中随机抽取多个子集来训练一系列不同的决策树。每棵树独立构建，然后根据Bagging的规则将它们的预测结果结合起来。对于回归问题，最终预测是所有树预测结果的平均；对于分类问题，则采用多数投票的方式来确定类别。

在实际的机器学习应用中，随机森林常作为处理中小型数据集的首选算法，因其易于实施且通常能提供良好的性能。

## 随机森林的参数

集成学习算法涉及众多超参数，不仅取值范围广泛，而且彼此之间存在复杂的相互作用，共同影响算法的性能，调整这些超参数以优化算法表现是一项极具挑战性的任务。

在进行参数搜索时，理解以下两个关键点至关重要：

- 参数影响力：了解每个超参数对算法结果的具体影响程度，确定哪些参数最值得关注和调整
- 参数空间：定义一个合适的参数搜索范围，在涵盖可能的最优解的同时，也避免不必要的计算资源浪费

根据经验，随机森林中最重要的参数包括：

在集成学习算法，尤其是随机森林中，不同的超参数对算法性能的影响程度各异。以下是对这些参数影响力的大致分类：

- **极高影响力（⭐⭐⭐⭐⭐）**：
    - `n_estimators`：决定集成中模型的数量，直接影响学习能力。
    - `max_depth`：控制决策树的最大深度，影响模型的复杂度和泛化能力。
    - `max_features`：限制每个决策树考虑的特征数量，增加模型的随机性。

- **高影响力（⭐⭐⭐⭐）**：
    - `max_samples`：决定从原始数据中抽取用于训练每个模型的样本数量。
    - `class_weight`：用于处理类别不平衡问题，影响模型对不同类别的关注度。

- **中等影响力（⭐⭐）**：
    - `min_samples_split`：设置节点分裂所需的最小样本数，影响模型的剪枝程度。
    - `min_impurity_decrease`：分裂节点时所需的最小不纯度减少量。
    - `max_leaf_nodes`：限制叶节点的最大数量。
    - `criterion`：定义决策树分裂节点的标准，影响模型的敏感度。

了解这些参数的影响力有助于在调参过程中优先考虑那些对模型性能影响最大的参数，从而更高效地优化模型。

## 贝叶斯优化器

在上一节逻辑回归建模中，我们采用了网格搜索进行模型调参。但网格搜索是一种基础但计算密集的方法，需要在整个参数空间中系统地测试所有可能的参数组合。尽管这种方法能够确保找到全局最优解，但其计算成本随着参数数量的增加而显著增加。

为了解决这一问题，存在着像随机网格搜索和Halving网格搜索等变体，通过减少需要评估的参数组合数量来提高效率，但这些方法在效率和精度之间仍然难以达到理想的平衡。

因此，存在另一种基于贝叶斯优化原理的工具，能够在较少的迭代次数内找到性能良好的参数组合，尤其适用于大型数据集和复杂模型。

## 调参实践

基于贝叶斯优化的库，比较常用的主要是 hyperopt 和 Optuna，而相对来说，Optuna 的代码更加简洁，易于上手。

1. 依然使用 sklearn 建立数据预处理 pipeline

    ```python
    import pandas as pd
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    from sklearn.compose import ColumnTransformer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
    from sklearn.pipeline import Pipeline
    import optuna
    from sklearn.model_selection import cross_val_score
    
    X_train = fe_train_df.drop('Attrition', axis=1)
    y_train = fe_train_df['Attrition']
    
    # 假设 test_df 没有 'Attrition' 列，需要预测
    X_test = fe_test_df
    
    # 识别分类变量和数值变量
    fe_categorical_cols = X_train.select_dtypes(include=['object']).columns.tolist()
    fe_numerical_cols = X_train.select_dtypes(exclude=['object']).columns.tolist()
    
    # 创建预处理管道
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', fe_numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), fe_categorical_cols)
        ])
    ```
   
2. 定义目标函数

    Optuna 的优化器需要一个目标函数，该函数接受一个 `trial` 参数，返回一个数值，表示模型的性能。
    
    在这个函数中，我们定义超参数搜索空间，并创建随机森林模型，然后进行交叉验证，返回模型的平均 ROC AUC 分数。
    
    ```python
    def objective(trial):
        # 定义超参数搜索空间
        n_estimators = trial.suggest_int('classifier__n_estimators', 10, 300)
        max_depth = trial.suggest_int('classifier__max_depth', 5, 25)
        min_samples_split = trial.suggest_int('classifier__min_samples_split', 2, 20)
        min_samples_leaf = trial.suggest_int('classifier__min_samples_leaf', 1, 20)
        max_features = trial.suggest_categorical('classifier__max_features', ['sqrt', 'log2'] + list(range(2, 12, 2)))
    
        # 创建随机森林模型
        rf = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            max_features=max_features,
            random_state=94,
            # class_weight='balanced'
        )
    
        # 创建包含预处理和模型的管道
        clf = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', rf)
        ])
    
        # 进行交叉验证
        scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='roc_auc', n_jobs=-1)
        return scores.mean()
    ```

3. 运行优化器

    运行 Optuna 时需要先创建一个 `study` 对象，然后调用 `optimize` 方法进行优化。
    
    这里我们设置 `n_trials=300`，表示最多尝试 300 次超参数组合。
    
    ```python
    # 使用 Optuna 进行超参数优化
    study = optuna.create_study(direction='maximize', sampler=TPESampler())
    study.optimize(objective, n_trials=300, n_jobs=-1)
   
   # 输出最佳参数和最佳交叉验证得分
    best_params = study.best_params
    best_score = study.best_value
    print("最佳参数:\n", best_params)
    print("最佳交叉验证得分 (ROC AUC):\n", best_score)
    ```
   
4. 利用最佳参数进行预测

    最后，我们可以使用最佳参数训练模型，并演示以训练集为例的评估结果。
    
    ```python
    # 使用最佳参数训练模型
    best_rf = RandomForestClassifier(
        n_estimators=best_params['classifier__n_estimators'],
        max_depth=best_params['classifier__max_depth'],
        min_samples_split=best_params['classifier__min_samples_split'],
        min_samples_leaf=best_params['classifier__min_samples_leaf'],
        max_features=best_params['classifier__max_features'],
        random_state=94,
        # class_weight='balanced'
    )
    
    clf = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', best_rf)
    ])
    
    clf.fit(X_train, y_train)
    
    # 使用最佳模型进行预测
    y_pred_train = clf.predict(X_train)
    y_pred_train_proba = clf.predict_proba(X_train)[:, 1]
    
    # 计算并输出训练集的评估结果
    roc_auc = roc_auc_score(y_train, y_pred_train_proba)
    print("训练集评估结果:")
    print(f"ROC AUC: {roc_auc}")
    print("分类报告:")
    print(classification_report(y_train, y_pred_train))
    print("混淆矩阵:")
    print(confusion_matrix(y_train, y_pred_train))
    ```
   
## 模型精调

当然，即便使用了贝叶斯优化器，我们仍然可以通过进一步调整模型参数空间，以期搜索到更优的超参数组合。

:::tip
由于贝叶斯优化器的原理在于构建一个概率模型来估计目标函数的后验分布，因此，当我们多次执行该学习优化器，得到的结果会有所不同。但我们可以寻求在多次搜索中，共性的参数区间，以此为基础，进一步精调模型。
:::
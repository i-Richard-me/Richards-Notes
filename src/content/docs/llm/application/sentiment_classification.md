---
title: "利用大模型提升情感分类任务准确性"
description: ""
---

在文本的情感分类任务中，使用传统NLP方法，对于某些文本的情绪分类效果不佳，如说反话、讽刺、以及同时包含正负向词汇的长文本等。大模型的出现，为这些文本的情绪分类任务提供了新的解决方案。
经过测试，利用自己部署的 Qwen1.5-14B 模型，效果明显优于传统NLP方法，记录一下测试的过程。

1. **关于任务**

   对员工调研中的主观回复文本，进行情绪分类任务。分类结果分为正向、负向、中性三类。

2. **关于数据集**

   简单编造了一个虚构的数据集，包含20条文本，通过手写以及ChatGPT辅助生成。

3. **关于评分规则**

   由于在情绪识别过程中，可能存在模糊地带，尤其对于中性和正向，中性和负向的区分，不同人人工标注的结果也可能不同。因此，评分采用了赋分制，即完全一致得
   1 分，中性判断为正向或负向（或正负向判断为中性）得 0.5 分，正负向判断相反得 0 分。

4. **测试结果**

   可以看到，大模型的效果明显优于传统NLP方法，且没有出现识别相反（把负向识别为正向）的情况。

   :::caution
   由于数据集较小，且为虚构数据，测试结果仅供参考。
   :::

   | 模型  | 平均得分  | 识别错误占比 |
   |-----|-------|--------|
   | 大模型 | 0.95  | 0%     |
   | 传统NLP | 0.775 | 15%    |

---

### 代码复现

:::caution
demo 中代码为 LangChain 0.1.0 版本之前的用法，新版本中可能会出现警告或直接报错，目前已经用 LCEL 写法替代。
:::

1. **省略导入库和定义模型过程**

2. **使用LangChain创建任务链**

   :::tip
   提示词的调试在大模型任务尤为重要，例如在这个案例中，让模型分类为`正向`、`负向`、`中性`的分类准确性，就要比分类为`positive`、`negative`、`neutral`的准确性更高。
   :::

   <iframe width="784" style="height: 744px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/YRbYJiGmvP6WK1eZNqgBRg/pu2FOrAvP1iHB0bBl8XPGj?height=744" frameborder="0"></iframe>

3. **通过大模型进行分类并将标签拼接到原数据集**

   <iframe width="784" style="height: 400px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/YRbYJiGmvP6WK1eZNqgBRg/RnXnn2CAg1bFHHdrweMYdU?height=400" frameborder="0"></iframe>

4. **计算评分**

   <iframe width="784" style="height: 582px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/YRbYJiGmvP6WK1eZNqgBRg/0VW9RTbl4cmOjXbdyWiE7U?height=582" frameborder="0"></iframe>

5. **输出结果**

   <iframe width="784" style="height: 418px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/YRbYJiGmvP6WK1eZNqgBRg/dBKOTHJrgUyHZ9RvJsbP5N?height=418" frameborder="0"></iframe>
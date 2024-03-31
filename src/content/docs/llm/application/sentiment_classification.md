---
title: "利用大模型提升情感分类任务准确性"
description: "通过实际案例探讨大模型在文本情感分类任务中相比传统NLP方法的优势。"
---

在文本情感分类任务中，使用传统NLP方法，对于某些文本的情绪分类效果不佳，如说反话、讽刺以及同时包含正负向词汇的长文本等。大模型的出现，为这些文本的情绪分类任务提供了新的解决方案。

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

## 代码复现

:::caution
demo 中代码为 LangChain 0.1.0 版本之前的用法，新版本中可能会出现警告或直接报错，目前已经用 LCEL 写法替代。
:::

1. **省略导入库和定义模型过程**

2. **使用LangChain创建任务链**

   :::tip
   提示词的调试在大模型任务尤为重要，例如在这个案例中，让模型分类为`正向`、`负向`、`中性`的分类准确性，就要比分类为`positive`、`negative`、`neutral`的准确性更高。
   :::

   ```python
   # 定义输出格式
   response_schemas = [
   ResponseSchema(name="ID", description="ID"),
   ResponseSchema(name="sentiment_class_llm", description="大模型的情感分类，返回`正向`、`中性`或`负向`"),
   ]
   
   output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
   format_instructions = output_parser.get_format_instructions()
   
   # 提示词
   classification_prompt = """
   作为一个NLP专家，你需要评估员工敬业度调研中的回复内容。请按照以下步骤操作：
   
       1. 情感分类：根据回复内容，将情绪归类为“正向”、“中性”或“负向”。注意回复的情感色彩、态度和情绪。对于使用反话或反讽的回复，尝试识别实际意图，并据此分类。
       2. 请基于提供的回复内容做出判断，避免任何推测或脑补。
   
       要点提醒：
       - 直接回答每个任务的问题。
       - 确保情感分类结果仅为“正向”、“中性”或“负向”之一。
   
       员工ID与员工回复 >>>{answer}<<<
       \n{format_instructions}
       """
   
   # 创建提示模板
   classification_prompt = PromptTemplate(
   input_variables=['answer'],
   template=classification_prompt,
   partial_variables={"format_instructions": format_instructions}
   )
   
   # 创建LLMChain
   classification_chain = LLMChain(
   llm=llm,
   prompt=classification_prompt
   )
   ```

3. **通过大模型进行分类并将标签拼接到原数据集**

   ```python
   # 读取文件
   subjective_answers_df = pd.read_csv("data/subjective_answers_train.csv")
   
   # 创建空DataFrame存放结果
   result_llm = pd.DataFrame()
   
   # 利用大模型识别员工回复的情感分类
   for i in tqdm(range(len(subjective_answers_df))):
   answer_json = subjective_answers_df.iloc[i, :2].to_json()
   sentiment_class_result = classification_chain.run(answer=json.loads(answer_json))
   sentiment_class_result_json = sentiment_class_result.split('`json')[1].split('`')[0].strip()
   sentiment_class_result_df = pd.DataFrame([json.loads(sentiment_class_result_json)])
   result_llm = pd.concat([result_llm, sentiment_class_result_df], ignore_index=True)
   
   result_final = subjective_answers_df.merge(result_llm, on='ID', how='left')
   ```

   <iframe width="784" style="height: 98px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/YRbYJiGmvP6WK1eZNqgBRg/RnXnn2CAg1bFHHdrweMYdU?height=98" frameborder="0"></iframe>

4. **计算评分**
   
   ```python
   # 为情感分类结果编码
   encoding_dict = {'正向': 0, 'positive': 0, '中性': 1, 'neutral': 1, '负向': 2, 'negative': 2}
   
   result_score = result_final.copy()
   result_score['sentiment_class_true'] = result_score['sentiment_class_true'].replace(encoding_dict)
   result_score['sentiment_class_nlp'] = result_score['sentiment_class_nlp'].replace(encoding_dict)
   result_score['sentiment_class_llm'] = result_score['sentiment_class_llm'].replace(encoding_dict)
   
   # 计算每条样本得分
   result_score['llm_diff'] = abs(result_score['sentiment_class_true'] - result_score['sentiment_class_llm'])
   result_score['nlp_diff'] = abs(result_score['sentiment_class_true'] - result_score['sentiment_class_nlp'])
   
   score_mapping = {0: 1, 1: 0.5, 2: 0}
   
   result_score['llm_score'] = result_score['llm_diff'].map(score_mapping)
   result_score['nlp_score'] = result_score['nlp_diff'].map(score_mapping)
   
   # 输出模型平均得分
   llm_avg_score = result_score['llm_score'].mean()
   nlp_avg_score = result_score['nlp_score'].mean()
   
   # 输出把正负向完全识别相反的占比
   total_samples = len(result_score)
   count_wrong_llm = (result_score['llm_diff'] == 2).sum()
   model_percentage_wrong = round((count_wrong_llm / total_samples) * 100)
   count_wrong_nlp = (result_score['nlp_diff'] == 2).sum()
   nlp_percentage_wrong = round((count_wrong_nlp / total_samples) * 100)
   ```

5. **输出结果**

   ```python
   # 输出测评结果
   from tabulate import tabulate
   
   data = [
   ["大模型", f"{llm_avg_score:.3f}", f"{model_percentage_wrong}%"],
   ["NLP", f"{nlp_avg_score:.3f}", f"{nlp_percentage_wrong}%"]
   ]
   
   headers = ["模型", "平均得分", "识别错误占比"]
   table = tabulate(data, headers, tablefmt="pretty")
   print(table)
   ```

   <iframe width="784" style="height: 188px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/YRbYJiGmvP6WK1eZNqgBRg/dBKOTHJrgUyHZ9RvJsbP5N" frameborder="0"></iframe>
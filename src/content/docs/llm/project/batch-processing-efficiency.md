---
title: "大模型批量调用技巧与实践"
description: "介绍如何利用批量调用提升大模型任务效率，以文本翻译任务为例，实现批量调用及效果对比。"
---

当前，借助大模型进行文本分析，是对于大模型最基础的应用之一。不过，当面对大规模文本数据时，通过聊天界面或逐条调用大模型进行处理往往会带来巨大的时间成本。

为了解决这个问题，有必要采取批量调用的解决方案。本文将以文本翻译任务为例，详细介绍如何通过批量调用来显著提升大模型任务的效率。

:::note
大模型在文本翻译任务中的应用通常能带来显著的效率提升。这源于其强大的上下文理解能力和语言生成能力，能够在翻译过程中提供更准确的用词和更流畅的表达。
:::

## 数据集准备

在开始之前，我们需要准备一个多语言的员工反馈文本数据集。这个数据集包含200条虚构的员工调研反馈，其中包括100条英文回复，另外还有西班牙语、葡萄牙语、法语、德语和日语各20条。

这样的多语言数据集能够很好地模拟国际化企业中的真实情况。以下是数据集的一些样本：

| id | feedback_text                                                                                                                               |
|----|---------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | A liderança em nossa empresa é de primeira linha. Os gerentes são acessíveis e fornecem grande suporte.                                     |
| 2  | Estoy muy impresionado con la visión de la empresa para el futuro. El equipo de liderazgo ha establecido una dirección clara e inspiradora. |
| 3  | My career development here has been satisfactory. I have had opportunities to learn new skills and take on new challenges.                  |
| 4  | O equilíbrio entre trabalho e vida é um pouco desafiador com a carga de trabalho atual. Horários mais flexíveis seriam apreciados.          |
| 5  | 福利厚生は良いですが、給与は業界標準と比較してもっと競争力があっても良いと感じます。                                                                                                  |

## 构建翻译任务

为了实现高效的批量翻译，我们需要构建一个自定义的翻译任务链。

1. 定义数据模型

    首先，我们使用Pydantic定义一个数据模型，用于存储翻译后的文本：
    
    ```python
    from pydantic import BaseModel, Field
    
    class TranslatedText(BaseModel):
        """翻译后的文本"""
        translated_text: str = Field(..., description="翻译成中文的文本内容")
    ```

2. 设计提示词

    接下来，我们设计系统提示（system message）和用户提示（human message）模板，以指导大模型进行准确的翻译：

    ```python
    system_message = """
    你是一位精通多语言的翻译专家。你的任务是将给定的{text_topic}文本准确翻译成中文。请遵循以下指南：
    
    1. 翻译要求：
       - 仔细阅读每条反馈，理解其核心内容和语境。
       - 将反馈准确翻译成中文，保持原意不变。
       - 确保翻译后的文本通顺、自然，符合中文表达习惯。
       - 如遇专业术语或特定概念，请尽可能找到恰当的中文对应表述。
    
    2. 输出格式：
       - 对每条反馈，输出对应的中文翻译。
       - 忽略原始文本中的特殊格式，按照一段话的形式输出翻译结果，不要包含特殊字符。
    
    请确保翻译的准确性和一致性，不要遗漏任何反馈。
    """
    
    human_message_template = """
    请将以下{text_topic}文本翻译成中文。
    
    ===
    {feedback_text}
    ===
    
    请按照系统消息中的指南进行翻译，并以指定的JSON格式输出结果，但不要在输出中重复json schema。
    """
    ```

3. 创建翻译任务链

    最后，我们使用自定义的Chain类来创建翻译任务链：
    
    ```python
    translate_feedback = CustomChain(TranslatedText, system_message, human_message_template, language_model)()
    ```
    
    这个任务链将使用我们定义的数据模型、系统提示和用户提示模板，结合指定的语言模型来执行翻译任务。

    :::note
    关于自定义类CustomChain的实现细节，可以参考[工程化任务函数]()。
    :::

## 实现批量调用

为了充分发挥大模型的性能并提高处理效率，我们实现了一个批量调用的函数。这个函数能够处理整个数据集，并通过批量方式调用大模型任务链。

```python
import pandas as pd
from tqdm import tqdm
import traceback

def process_dataset_batch(llm_chain, data, field_mapping, fixed_params, additional_fields=None, batch_size=10):
    """
    处理数据集，调用大模型任务链，并返回处理结果和错误信息。

    参数说明：
    - llm_chain: 大模型任务链
    - data: 数据集（pandas.DataFrame）
    - field_mapping: 字段映射（dict，键为invoke参数名，值为数据集字段名）
    - fixed_params: 固定参数（dict）
    - additional_fields: 需要额外保存的字段（list，默认为None）
    - batch_size: 批处理大小（int，默认为10）

    返回值：
    - result_df: 处理结果的DataFrame
    - error_df: 错误信息的DataFrame
    """
    results = []
    errors = []

    for start in tqdm(range(0, data.shape[0], batch_size), desc="执行进度"):
        end = min(start + batch_size, data.shape[0])
        batch_data = data.iloc[start:end]

        batch_invoke_params = []
        for index, row in batch_data.iterrows():
            invoke_params = {invoke_field: row[data_field] for invoke_field, data_field in field_mapping.items()}
            invoke_params.update(fixed_params)
            batch_invoke_params.append(invoke_params)

        try:
            responses = llm_chain.batch(batch_invoke_params)

            for i, response in enumerate(responses):
                result = {}
                if additional_fields:
                    for field in additional_fields:
                        result[field] = batch_data.iloc[i][field]

                if isinstance(response, list):
                    for item in response:
                        result.update(item)
                else:
                    result.update(response)

                results.append(result)

        except Exception as e:
            for i in range(len(batch_data)):
                error_info = {"index": start + i}
                if additional_fields:
                    for field in additional_fields:
                        error_info[field] = batch_data.iloc[i][field]
                error_info["error"] = str(e)
                errors.append(error_info)

            print(f"Error processing batch {start}-{end}: {e}")
            traceback.print_exc()

    result_df = pd.DataFrame(results)
    error_df = pd.DataFrame(errors)

    return result_df, error_df
```

这个函数的核心功能包括：
1. 将数据集分割成指定大小的批次
2. 为每个批次构建调用参数
3. 批量调用大模型任务链
4. 处理响应结果并记录可能出现的错误
5. 返回处理结果和错误信息

### 效果对比

为了直观地展示批量调用的优势，我们将比较单轮循环和批量调用两种方式处理相同数据集的效率。

1. 单轮循环

    首先，我们使用批处理大小为1的设置，模拟单轮循环的情况：
    
    ```python
    field_mapping = {'feedback_text': 'feedback_text'}
    fixed_params = {'text_topic': '员工调研反馈'}
    result_df, error_df = process_dataset_batch(translate_feedback, raw_feedback_data, field_mapping,
                                                fixed_params=fixed_params,
                                                additional_fields=['id', 'feedback_text'],
                                                batch_size=1)
    ```
    
    输出结果：
    ```text title="单轮循环"
    执行进度: 100%|██████████| 200/200 [02:00<00:00,  1.66it/s]
    ```

2. 批量调用

    然后，我们使用批处理大小为4的设置，实现批量调用：
    
    ```python
    field_mapping = {'feedback_text': 'feedback_text'}
    fixed_params = {'text_topic': '员工调研反馈'}
    result_df, error_df = process_dataset_batch(translate_feedback, raw_feedback_data, field_mapping,
                                                fixed_params=fixed_params,
                                                additional_fields=['id', 'feedback_text'],
                                                batch_size=4)
    ```
    
    输出结果：
    ```text title="批量调用"
    执行进度: 100%|██████████| 50/50 [01:06<00:00,  1.34s/it]
    ```

通过比较两种方法的执行时间，单轮循环方法处理200条数据用时约120秒，批量调用方法（批大小为4）处理相同数据集用时约66秒，显著提高了效率。

这还只是在相对简单的翻译任务上的对比。在处理更复杂的任务或更大规模的数据集时，批量调用的优势会更加明显。

:::tip
当然，batch_size的选择需要根据具体任务和硬件资源进行调整。通常，较大的批处理大小能够更好地利用硬件资源，但也可能导致内存占用过高或处理速度下降，甚至出现内存溢出等问题，尤其是对于公司或个人自部署的大模型服务。
:::
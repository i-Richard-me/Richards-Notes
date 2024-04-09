---
title: "应用示例选择器从简历中提取技能标签"
description: "介绍如何借鉴RAG技术，构建示例选择器来增强大模型的标签提取效果，辅助构建知识图谱。"
---

随着大模型的兴起，利用其强大的语义理解和推理能力辅助知识图谱的生成，成为了一个热门的研究方向，特别是在处理复杂、多样化表达的文本数据时。
本文以一个具体的案例——基于员工简历提取技能标签，构建员工与技能的知识图谱——为例，介绍利用大模型辅助知识图谱生成的尝试。

在实际操作中，我们可能会遇到一系列挑战，特别是在输出标签的规范性方面。例如，对于相似文本，大模型可能会输出一系列不同的近义词。一个常见的解决办法是提供一个完整的标签列表，让模型在这些标签中进行选择。然而，当技能列表非常庞大时，受制于算力和时间成本，这种方法显得不太现实。
为了解决上述挑战，可以借鉴RAG的思路，首先使用向量搜索技术从一个大规模的技能数据集中找到与简历文本最相关的N个技能标签，然后再让大模型在这些预筛选的标签中进行精确的判断。

Langchain 对于此类方法专门提供了一个 example selector 的类，但是使用场景较为局限，难以满足我们个性化的诉求。我们参考思路，尝试手动实现一下这个流程。

## 1. 向量化技能数据集

我们准备了一个简单的职业技能数据集，包含技能名称和描述说明。

```python
import pandas as pd

df_skills = pd.read_excel("data/skill_zh.xlsx")
df_skills
```

根据经验，将名称和描述合并后一起进行向量化，检索的准确率更高。

```python
df_skills['combined_text'] = df_skills.apply(
    lambda x: f"{x['skill_name']} {x['description']}", axis=1)
```

利用 embedding 模型（如bge-m3）将其转换为向量形式，以便后续进行快速的相似度比较。

```python
from openai import OpenAI

client = OpenAI(
    api_key=api_key, base_url=base_url,
)

def get_embeddings(text):
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

df_skills['combined_text_vector'] = df_skills['combined_text'].apply(get_embeddings)
```

2. 构建向量数据库

使用FAISS库构建高效的向量搜索索引，将所有技能的向量存入该索引中，为后续的快速检索打下基础。

```python
import numpy as np
import faiss

dimension = 1024
index = faiss.IndexFlatIP(dimension)

vectors = np.array(df_skills['combined_text_vector'].tolist()).astype('float32')
# 归一化
norm_vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)

# 将归一化后的向量添加到FAISS索引
index.add(norm_vectors)
```

3. 定义一个检索函数

定义一个检索函数，该函数将输入的简历描述文本转换为向量，并与技能数据库中的向量进行比较，找出最匹配的技能标签。

```python
def search_jobs_with_details(description, top_k):
    # 将输入文本描述向量化并归一化
    description_vector = get_embeddings(description)
    description_vector = np.array(description_vector).reshape(1, -1).astype('float32')
    description_vector /= np.linalg.norm(description_vector)  # 归一化

    # 使用FAISS查找最接近的向量，现在使用的是内积来衡量相似度
    similarities, indices = index.search(description_vector, top_k)

    # 准备返回结果
    results = []
    for i, idx in enumerate(indices[0]):
        skill_name = df_skills.iloc[idx]['skill_name']
        description_text = df_skills.iloc[idx]['description']
        similarity = similarities[0][i]
        results.append({
            'skill_name': skill_name,
            'description': description_text,
            # 'similarity': similarity
        })

    return results
```

4. 测试检索效果

我们准备一段简历文本，是由 chatgpt 基于人力资源数据分析、组织管理、绩效管理三个职能杜撰的一段描述。

```python
resume_text = """
负责收集、整理并分析公司内部的人力资源数据，包括员工绩效、招聘渠道效率和员工离职率等。通过运用高级统计方法和数据分析工具，我为人力资源管理提供了有力的数据支持，帮助公司优化招聘流程和员工发展计划。
主导了多个关键的组织变革项目，包括组织结构调整、编制预算管理、企业文化重塑和领导力发展计划。通过深入分析组织需求和市场趋势，我成功地帮助公司提升了组织效能，增强了团队凝聚力和员工满意度。
负责设计和实施全面的绩效评估体系，包括目标设定、绩效跟踪和反馈沟通机制。通过建立明确的绩效指标和公正的评价流程，我促进了员工的个人发展和职业成长，同时确保公司目标与员工个人目标的一致性。
"""
```

调用检索函数，检索相似度最高的技能。

```python
skill_list = search_jobs_with_details(description=resume_text, top_k=20)
```

```python
[{'skill_name': '组织员工评估', 
  'description': '安排并执行员工的整体评价过程。'},
 {'skill_name': '人力资源管理', 
  'description': '涉及招聘员工、提高员工表现的组织内部职能。'},
 {'skill_name': '跟踪关键绩效指标',
  'description': '通过设定的绩效指标，量化并比较公司或行业达成其运营和战略目标的表现。'}]
```

这里展示一下截取出的 top3 结果，可以看到，检索效果还是比较符合预期的。

5. 构建任务流程

首先构建一个提示词，引导大模型根据提供的简历文本和技能列表，精准提取员工的技能项，并输出符合要求的格式。

```python
resume_skills_extraction_prompt = """
作为职业发展顾问，你的任务是分析提供的简历文本，仅从中直接提取出员工的能力项。请按照以下步骤操作：

1. 理解简历内容：仔细阅读提供的简历文本，理解其中描述的经历、技能和成就。
2. 直接提取能力项：根据简历内容和提供的能力项列表及其解释，仅当简历文本中直接提及相关能力时，识别并记录员工具备的能力项。避免进行任何形式的推理、猜测或假设，如果文中没有直接提及某项能力，即使认为员工可能具备，也不应该将其记录为员工所具备的能力。
3. 给出判断理由：对于直接提取的每项能力，根据简历中的具体内容提供判断理由，解释该能力项为何被认为是员工所具备。
4. 输出格式：将直接提取的能力项及其判断理由以JSON格式输出，确保格式的准确性和易读性。\n\noutput_example: \n\n{output_example}

提供的简历内容：

{resume_text}

能力项列表及其解释：

{skill_list}

注意事项：
- 仔细阅读简历内容，确保只有直接提及的能力项被记录。
- 避免任何形式的推理、猜测或假设，仅依据简历中的直接文字记录能力项。
- 提供详细的判断理由，确保理由直接基于简历内容中的明确提及。
- 确保输出格式正确。
"""
```

其中，`{output_example}` 是一个示例输出，告诉大模型我们希望的格式。

```python
output_example = """
    ```json
    {
        "能力项": [
            {
                "能力名称": "track key performance indicators",
                "判断理由": "简历中提到员工负责收集、整理并分析公司内部的人力资源数据，包括员工绩效、招聘渠道效率和员工离职率等。这表明该员工具备跟踪关键绩效指标的能力。"
            }
        ]
    }
    ```
    """
```

```python
prompt = PromptTemplate(
    template=resume_skills_extraction_prompt,
    input_variables=["resume_text", "skill_list", "output_example"],
)

chain = prompt | model
```

6. 效果测试

利用设计好的提示词和构建的任务流程，将简历文本和筛选后的技能列表输入到大模型中，测试模型是否能够准确提取出简历中直接提及的技能项，并按照要求格式输出。

```python
chain_result = chain.invoke({"resume_text": resume_text,
                             "skill_list": skill_list,
                             "output_example": output_example})

print(chain_result.content)
```

最终输出结果如下：

```json
{
  "能力项": [
    {
      "能力名称": "跟踪关键绩效指标",
      "判断理由": "简历中提到员工负责收集、整理并分析公司内部的人力资源数据，包括员工绩效、招聘渠道效率和员工离职率等。这表明该员工具备跟踪关键绩效指标的能力。"
    },
    {
      "能力名称": "人力资源管理",
      "判断理由": "简历中提到员工负责收集、整理并分析公司内部的人力资源数据，主导了多个关键的组织变革项目，以及负责设计和实施全面的绩效评估体系。这表明该员工具备人力资源管理的能力。"
    },
    {
      "能力名称": "组织员工评估",
      "判断理由": "简历中提到员工负责设计和实施全面的绩效评估体系，包括目标设定、绩效跟踪和反馈沟通机制。这表明该员工具备组织员工评估的能力。"
    },
    {
      "能力名称": "执行项目管理",
      "判断理由": "简历中提到员工主导了多个关键的组织变革项目，这表明该员工具备执行项目管理的能力。"
    },
    {
      "能力名称": "管理预算",
      "判断理由": "简历中提到员工主导了组织结构调整、编制预算管理等项目，这表明该员工具备管理预算的能力。"
    },
    {
      "能力名称": "确定必要的人力资源",
      "判断理由": "简历中提到员工负责收集、整理并分析公司内部的人力资源数据，这表明该员工具备确定必要人力资源的能力。"
    },
    {
      "能力名称": "开发培训计划",
      "判断理由": "简历中提到员工负责设计和实施全面的绩效评估体系，这表明该员工具备开发培训计划的能力。"
    },
    {
      "能力名称": "认同公司目标",
      "判断理由": "简历中提到员工通过运用高级统计方法和数据分析工具，为人力资源管理提供了有力的数据支持，帮助公司优化招聘流程和员工发展计划，以及成功地帮助公司提升了组织效能，增强了团队凝聚力和员工满意度。这表明该员工认同公司目标。"
    }
  ]
}
```

通过对输出结果的观察，可以看到除了`开发培训计划`这一项推理较为牵强外，大模型在该任务上的整体表现基本符合预期。
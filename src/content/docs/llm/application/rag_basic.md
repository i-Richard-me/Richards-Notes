---
title: "简单实现RAG文档检索和生成"
description: "介绍如何使用构建一个简单的 RAG Demo，实现基于文档知识的检索和问答。"
---

在数据分析的工作中，行业对标和竞品分析是不可或缺的环节，这要求我们从各类研究报告中精准地提取出竞对的相关数据和关键动作。面对海量的信息和复杂的数据结构，手动提取数据既耗时又低效。

为了解决这一挑战，我们构建一个简单的 RAG (Retrieval-Augmented Generation) Demo，使用腾讯 2023
年第四季度及全年业绩报告作为示例文档，展示如何自动化地从文档中检索和生成答案，从而提高数据分析的效率和准确性。

## 关键步骤

### 1. 载入文档

首先，使用 `PDFPlumberLoader` 载入 PDF 文档，示例文档选用腾讯 2023 年第四季度及全年财报数据。财报也是我们进行行业研究的重要数据来源。

:::note
Langchain 提供了多种文档载入器，不仅支持多种文档格式，对于 PDF 文档也有不同的处理库，如此处选用的 `PDFPlumberLoader`。

关于文档载入器的更多信息，可参考Langchain
官方文档 [Document loaders](https://python.langchain.com/docs/modules/data_connection/document_loaders/)。
:::

```python
from langchain_community.document_loaders import PDFPlumberLoader

loader = PDFPlumberLoader("腾讯2023年第四季度及全年业绩.pdf")
data = loader.load()
```

### 2. 文档分片

由于大模型上下文输入长度的限制，在实操中我们通常需要将文档进行分片。这里我们使用 `RecursiveCharacterTextSplitter`
工具，将文档分片为 800 字一片，每片之间有 100 字的重叠。

:::tip
每个分片的长度和重叠大小需要根据实际情况进行调整。既需要考虑模型本身的输入限制，也需要考虑文档内容的特性。
一般来说，我们倾向于文档分片的长度越长越好，因为这样可以减少检索的次数，增加上下文的连贯性。

当然，确定分片参数的最佳方式还是通过实际测试效果来判断，有时候当分片过长时，可能产生大海捞针现象，导致召回效果不佳。
:::

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
splits = text_splitter.split_documents(data)
```

这里我们看到文档被成功的分为了 76 个片段。

<iframe width="784" style="height: 148px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/NHBbRBupE26Tov16JhrYbK/Qv4dfzzoHfw6imigMx8tEJ?height=148" frameborder="0"></iframe>

### 3. 向量化存储

将文本片段向量化，使用 `Chroma` 创建向量存储。

embedding 模型选用了 `bge-large-zh`
，对于中文文本的向量化效果较好。而向量数据库的选择根据企业要求即可，这里作为演示目的选用了 `Chroma`。

```python
from langchain_community.vectorstores import Chroma

vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
```

### 4. 文档检索

建立检索器，为生成过程检索相关的文档片段。

```python
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
retriever.get_relevant_documents("")
```

我们尝试检索关于腾讯全年收入的文档片段，能够看到成功的检索到了相似性最高的三个文档片段。

<iframe width="784" style="height: 184px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/NHBbRBupE26Tov16JhrYbK/xZPD7CaW0QpwAaDfQGBAo3?height=184" frameborder="0"></iframe>

### 5. 利用大模型进行问答

```python
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# 构建提示词模板
template = """
You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.

Context: {context}

Question: {question}

Answer:
"""

custom_rag_prompt = PromptTemplate.from_template(template)

# 定义一个将检索结果转化为字符串的函数
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# 构建问答任务链
rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | custom_rag_prompt
        | model
        | StrOutputParser()
)
```

我们尝试一下最终效果：

<iframe width="784" style="height: 148px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/NHBbRBupE26Tov16JhrYbK/nBDRh245IqvJ28Q75YlAXe?height=148" frameborder="0"></iframe>

## 总结

:::tip
以上步骤是一个极简的实现演示，大家在尝试中可能会发现，当换做其他更为复杂的问题时，问答效果可能会出现显著下降。

在实际应用中，伴随着文档的数量增多，以及用户的问题更加开放和多样，上述极简的步骤不能满足真实应用，我们需要更多的调整和优化手段，比如对问题进行转述再检索、多种检索方法的组合等等、以至于召回文本在
prompt 中的位置调整，都是提高问答效果的重要手段。
:::
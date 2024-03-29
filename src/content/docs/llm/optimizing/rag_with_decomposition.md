---
title: "大模型应用技巧之问题拆解"
description: "通过问题拆解技巧使大模型解决复杂问题。"
---

在处理基于文档的问答系统时，面临的一个主要挑战是当问题表述变化或问题复杂时，召回的文档段落常常无法准确匹配，导致得到的答案不准确或完全错误。

以腾讯财务报告的问答实验为例，当问及2023年与2022年收入的比较时，很明显给出了错误的答案。

```
Question: 腾讯全年的收入是多少 
 Answer:  腾讯在截至二零二三年十二月三十一日止年度的收入为人民币6,090亿元。

Question: 腾讯2023年收入比2022年高多少？ 
 Answer: 腾讯2023年的收入比2022年增长了21%，从298亿元人民币增长到357亿元人民币。
```

原因在于模型将重点放在与“高多少”相关的段落上，如某段落介绍了游戏业务增长，而非直接比较两年的收入数据。

为了解决这个问题，一个有效的策略就是利用大模型先进行问题分解。通过将复杂问题分解为多个更简单、更直接的子问题，可以显著提高文档召回的精确度和答案的准确性。

## 问题拆解任务

1. **封装一个文本片段召回的函数**

   > 函数中的 `retriever` 是 langchain 提供的用于文本召回的类。在[RAG简单实现](../application/rag_basic)的演示中已经做过介绍，此处不再赘述。

    ```python
   def Retriever(query):
      return retriever.get_relevant_documents(query)
    ```

2. **实现问题拆解的提示词**

   为了让大模型执行分解问题的任务，设计以下提示词模板

    ```python {16-20}
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI
    
    system = """
        You are an expert at converting user questions into database queries. \
        You have access to a database of documents about financial reports. \
        
        Perform query decomposition. Given a user question, break it down into distinct sub questions that \
        you need to answer in order to answer the original question. Focus on creating retrievable queries without adding any processing steps like calculations. \
        
        If there are acronyms or words you are not familiar with, do not try to rephrase them.
        
        Ensure that your responses strictly adhere to the format of the following example.
        
        example:
        question: "What's the difference between LangChain agents and LangGraph?"
        output format: 
        [Retriever("What's the difference between LangChain agents and LangGraph?"),
        Retriever("What are LangChain agents"),
        Retriever("What is LangGraph")]
    """
    ```

   :::note
   1. 在提示词中，我们加入了一个案例，以及输出的格式要求。
   2. 案例中的输出格式，是方便我们使用 eval 函数进行解析，利用我们上述定义的 Retriever 函数进行文档召回。
   :::

3. **问题分解测试**

   ```python
   prompt = ChatPromptTemplate.from_messages(
      [
          ("system", system),
          ("human", "{question}"),
      ]
   )
   
   query_analyzer = prompt | model
   
   querys = query_analyzer.invoke({"question": "腾讯2023年收入比2022年高多少？"}).content
   ```

   模型返回的结果如下，成功分解为三个子问题，分别询问2023年和2022年的腾讯收入，以及两者的差值。

   ```
   '[Retriever("What was Tencent\'s income in 2023?"),\nRetriever("What was Tencent\'s income in 2022?"),\nRetriever("What is the difference between Tencent\'s income in 2023 and 2022?")]'
   ```

4. **子问题召回**

   由于我们要求模型输出的格式，是方便我们使用 eval 函数进行解析执行的，以下命令即可完成文档召回：

   ```python
   docs = eval(querys)
   ```

   由于是对三个子问题进行文档召回，因此我们获得的是一个双层列表，总共召回了 9 个文本片段。

   ```
   len(docs): 3
   len(docs[0]): 3
   ```

5. **答案生成**

   最后将召回的文本通过格式化后提供给大模型进行答案生成，先定义一个格式化函数

   ```python
   def format_docs(docs):
      if type(docs[0]) == list:
         flattened_docs = [doc for sublist in docs for doc in sublist]
      else:
         flattened_docs = docs
      
      doc_list = [doc.page_content for doc in flattened_docs]
      
      seen = set()
      unique_list = [x for x in doc_list if x not in seen and (seen.add(x) or True)]
      
      return "\n\n".join(doc for doc in unique_list)
   ```

   :::note
   1. 函数中 if 判断的作用是当多个子问题召回时，结果是一个双层列表，我们需要将其展平。
   2. 由于多个子问题的召回结果可能会有重复的文本片段，我们需要对其进行去重。
   :::

   ```python
   context = format_docs(docs)
   
   rag_chain = (
       {"context": RunnablePassthrough(), "question": RunnablePassthrough()}
       | custom_rag_prompt
       | model
       | StrOutputParser()
   )
   
   rag_chain.invoke({'context': context, 'question': "腾讯2023年收入比2022年高多少"})
   ```

   最终得到的答案如下，可以看到模型成功回答了我们的问题。

   ```
   AIMessage(content='腾讯2023年的收入比2022年高10,242万元人民币。', response_metadata={'finish_reason': 'stop', 'logprobs': None})
   ```

## 总结

:::tip
1. 将问题分解为更细小的子问题，不仅适用于文档召回的场景，在前面介绍过的 SQL 问答机器人，也可以考虑将复杂的查询问题，分解为多个简单查询。
2. 当问题已经不可拆解，但召回情况依然不理想时，我们可以采用类似的思路，让大模型把我们的问题换一种说法转述出来，有时也可以提高召回的表现。
:::
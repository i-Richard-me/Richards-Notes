---
title: "多向量检索之假设提问"
description: "介绍多向量检索在处理复杂RAG中的应用，通过假设提问增加检索信息的维度和多样性。"
---

在探索如何优化文本检索，特别是在腾讯财务报告的问答实验中，遇到的挑战是模型无法通过简单的相似度匹配准确地召回用户问题的答案。一个创新的解决方案是引入多向量检索方法。多向量检索通过对输入文本进行切分、总结、生成假设性问题等方式，将其转化为一组形式多样的文本，并对这些文本进行向量化处理。这种方法的目标是在检索阶段增加信息的维度和多样性，以提高检索结果的相关性和准确度。

## 假设提问在多向量检索中的应用

假设提问的方法利用大语言模型针对原文本生成模拟用户可能提出的问题。这种方法的核心在于理解和提炼文本中的关键信息，然后根据这些信息构造可能的用户查询。这不仅增强了模型对文本内容的理解，而且也丰富了检索系统能够响应的问题类型。

以腾讯财务报告问答实验为例，我们尝试通过假设提问的方式来增加检索的准确度。

### 生成假设问题

1. **提示词构建**

   下面是一个生成假设性问题的提示词示例：

   ```python
   prompt = """
      Generate a list of exactly 3 hypothetical questions that the below document could be used to answer:
      doc nanme: \n{doc_name}
      doc content: \n{doc}
      
      output format:
      ["腾讯2023年度的财务表现相比于2022年度有何变化？具体体现在哪些关键财务指标上?",
      "腾讯2023年度综合业绩报告中，未经重列和经重列的经营盈利、期内盈利以及本公司权益持有人应占盈利分别下降了多少百分比？",
      "2023年与2022年相比，董事会如何解释腾讯综合财务报表中出现的大幅盈利下滑，特别是基本每股盈利和摊薄每股盈利的下降幅度？"]
      """
   ```

2. **文档导入**

   > 文档导入和切分步骤不再赘述，请参考[简单实现RAG文档检索和生成](/llm/application/rag_basic#关键步骤)

3. **定义假设问题生成任务**

   由于模型输出的是包含一个列表的字符串，我们需要定义一个函数将其转换为列表。

    ```python
    # 用于将模型输出转换为列表
    def ListOutputParser(input):
        import ast
        return ast.literal_eval(input.content)
    
    from langchain_core.prompts import ChatPromptTemplate
    ```

   在执行任务时，输入是包含多个 Document 对象的列表，因此 doc_name 和 doc 使用 lambda 函数来提取文档的元数据和内容。

   ```python
   # 定义任务 Chain
   chain = (
      {"doc_name": lambda x: x.metadata["source"] ,"doc": lambda x: x.page_content}
      # Only asking for 3 hypothetical questions, but this could be adjusted
      | ChatPromptTemplate.from_template(prompt)
      | model | ListOutputParser
      )
   ```

4. **单个文本片段的生成效果如下**

    ```python
    hypothetical_questions = chain.invoke(data[0])
    ```

    ```
    ['腾讯2023年度的财务表现相比于2022年度的具体增长或下降情况在哪些方面最为显著？',
   '腾讯2023年非国际财务报告准则下的经营盈利和权益持有人应占盈利相比于上一年度分别增长了多少，这种变化的主要驱动因素是什么？',
   '2023年财务报告中提到的重分类项目对经营盈利和每股盈利的影响如何，以及这种调整如何影响了与2022年的比较结果？']
    ```

5. **批量完成文档的假设问题生成**

   由于在实际应用中，我们需要对大量文档进行假设问题生成，因此我们可以使用批量并行的方式来加速处理。

    ```python
    hypothetical_questions = chain.batch(data, {"max_concurrency": 5})
    ```

   :::tip
   `{"max_concurrency": 5}` 表示最大并发数为 5，需要根据实际的硬件资源和任务需求进行调整。
   :::

   输出效果如下，是一个双层的列表：

   ```
   [['腾讯2023年度的财务表现相比于2022年度的具体增长或下降情况在哪些方面最为显著？',
   '腾讯2023年非国际财务报告准则下的经营盈利和权益持有人应占盈利相比于上一年度分别增长了多少，这种变化的主要驱动因素是什么？',
   '2023年财务报告中提到的若干项目重新分类对经营盈利和每股盈利的影响如何，以及这种调整如何影响了与2022年的比较数据？'],
   ['腾讯2023年第四季度及全年业绩报告中，各项财务数据的具体同比增长了多少，哪些部分驱动了总收入和毛利的增长或下降？',
   '在非国际财务报告准则下，腾讯2023年的经营盈利和权益持有人应占盈利相比于2022年分别增长了多少，这种增长的主要原因是什么？',
   '腾讯在2023年度的业绩下滑中，尤其是基本每股盈利和摊薄每股盈利的大幅下降，公司如何在报告附注中解释这些重列项目对净利润的影响以及可能的战略调整？'],
   ['腾讯2023年第四季度及全年业绩中，股息增长了多少，以及其批准和派发的时间点是什么？',
   '在2023年，微信、QQ和收费增值服务的月活跃账户数分别有何变化，这反映了哪些业务板块的增减趋势？',
   '腾讯在2023年的业务回顾中提到了哪些关键产品或服务的亮点，以及这些亮点如何影响了公司的毛利和资本回报计划？'],
   ['腾讯2023年第四季度和全年业绩中，小遊戲业务增长了多少，这对其整体业绩有何影响？',
   '腾讯视频和TME在长视频和音乐流媒体市场的领先优势如何体现，付费会员数增长了多少？',
   '腾讯在2023年通过哪些策略和技术创新提升广告收入，以及支付和跨境支付体验的改进情况？'],
   ......
   ]
   ```

### 问答效果检验

1. **实例化用到的工具**

   实例化一个新的 Chroma 存储对象，collection_name 为 `hypo-questions`

   ```python
   vectorstore = Chroma(
      collection_name="hypo-questions", embedding_function=embeddings
      )
   ```

   实例化一个内存存储对象，用于存储原始文档片段和与假设问题的关联ID

   ```python
   from langchain.storage import InMemoryByteStore
   # The storage layer for the parent documents
   store = InMemoryByteStore()
   id_key = "doc_id"
   ```

   实例化一个 langchain 封装好的多向量检索器

   ```python
   from langchain.retrievers.multi_vector import MultiVectorRetriever
   
   retriever = MultiVectorRetriever(
   vectorstore=vectorstore,
   byte_store=store,
   id_key=id_key,
   )
   ```

2. **准备数据**

   为每个文本片段创建一个唯一的ID

   ```python
   import uuid
    
   doc_ids = [str(uuid.uuid4()) for _ in data]
   ```

   将假设问题和 `doc_id` 一起封装为 Document 对象

   ```python
   question_docs = []
   
   for i, question_list in enumerate(hypothetical_questions):
      question_docs.extend(
        [Document(page_content=s, metadata={id_key: doc_ids[i]}) for s in question_list]
      )
   ```

   封装后的效果如下：

   ```
   [Document(page_content='腾讯2023年度的财务表现相比于2022年度的具体增长或下降情况在哪些方面最为显著？', metadata={'doc_id': 'c3c212a5-9512-45f0-92d7-fe261289ac12'}),
   Document(page_content='腾讯2023年非国际财务报告准则下的经营盈利和权益持有人应占盈利相比于上一年度分别增长了多少，这种变化的主要驱动因素是什么？', metadata={'doc_id': 'c3c212a5-9512-45f0-92d7-fe261289ac12'}),
   Document(page_content='2023年财务报告中提到的若干项目重新分类对经营盈利和每股盈利的影响如何，以及这种调整如何影响了与2022年的比较数据？', metadata={'doc_id': 'c3c212a5-9512-45f0-92d7-fe261289ac12'}),
   Document(page_content='腾讯2023年第四季度及全年业绩报告中，各项财务数据的具体同比增长了多少，哪些部分驱动了总收入和毛利的增长或下降？', metadata={'doc_id': 'e6789603-a2fe-45b5-971c-3bdda8e828fa'}),
   Document(page_content='在非国际财务报告准则下，腾讯2023年的经营盈利和权益持有人应占盈利相比于2022年分别增长了多少，这种增长的主要原因是什么？', metadata={'doc_id': 'e6789603-a2fe-45b5-971c-3bdda8e828fa'}),
   Document(page_content='腾讯在2023年度的业绩下滑中，尤其是基本每股盈利和摊薄每股盈利的大幅下降，公司如何在报告附注中解释这些重列项目对净利润的影响以及可能的战略调整？', metadata={'doc_id': 'e6789603-a2fe-45b5-971c-3bdda8e828fa'}),
   ......
   ]
   ```

3. **假设问题向量化**

    ```python
    retriever.vectorstore.add_documents(question_docs)
    ```

   建立假设问题与原始文本片段的关联

    ```python
    retriever.docstore.mset(list(zip(doc_ids, data)))
    ```

4. **召回演示**

   根据用户问题召回假设问题

   ```python
   sub_docs = vectorstore.similarity_search("腾讯2023年收入比2022年高多少")
   ```

   召回结果如下：

   ```
   [Document(page_content='腾讯2023年第四季度及全年财务数据与2022年相比的具体对比分析？', metadata={'doc_id': 'c7a1a26e-aade-4334-b33e-61778138be01'}),
   Document(page_content='腾讯2023年第四季度和全年在金融科技及增值服务、网络广告、企业服务等业务板块的收入和毛利分别增长了多少？', metadata={'doc_id': 'eb6afc2e-d97d-453b-b5ee-27da8dca6ba4'}),
   Document(page_content='腾讯2023年第四季度及全年收入增长了多少？增长的主要驱动因素是什么？', metadata={'doc_id': '11f65ce4-7e23-40b6-a224-ab3716cff1c9'}),
   Document(page_content='腾讯2023年金融科技及企业服务业务的收入增长了多少，以及这一增长的主要驱动因素是什么？', metadata={'doc_id': 'e100e3eb-bafd-43a4-84de-38636d7145c3'})]
    ```

   :::note
   当然，这里演示召回假设问题只是给大家呈现过程环节，真实输入给大模型的是根据召回的假设问题背后的原始文本片段。而我们实例化好的 MultiVectorRetriever 已经帮我们封装好了这个过程。
   :::

5. **问答效果**

   构建问答功能，代码与以前介绍的简单 RAG 基本一致。

   ```python
   from langchain_core.prompts import PromptTemplate
   
   template = """
      You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
      
      Context: {context}
      
      Question: {question}
      
      Answer:
      """
   
   rag_prompt = PromptTemplate.from_template(template)
   
   def format_docs(docs):
       return "\n\n".join(doc.page_content for doc in docs)
   
   from langchain_core.runnables import RunnablePassthrough
   from langchain_core.output_parsers import StrOutputParser
   
   rag_chain = (
      {"context": retriever | format_docs, "question": RunnablePassthrough()}
      | rag_prompt
      | model
      | StrOutputParser()
      )
   ```

   最终效果：

   ```python
   question = "腾讯2023年收入比2022年高多少？"
   print(f'\nQuestion: {question} \n Answer: {rag_chain.invoke(question)}')
   ```

   ```
   Question: 腾讯2023年收入比2022年高多少？ 
    Answer: 腾讯2023年的收入同比增长了10%，从2022年的554.552亿元人民币增长到609.015亿元人民币。
   ```

   可以看到，经过了假设提问过程的多向量检索，模型给出了准确的答案，意味着在召回环节准确的返回了与问题相关的段落。
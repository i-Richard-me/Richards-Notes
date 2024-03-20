---
title: "基于SQL数据库的简单问答系统实现"
description: "探索如何实现一个简单的问答系统，该系统基于SQL数据库执行查询，并通过大模型处理查询结果以生成回答。"
---

本文记录如何实现一个简单的问答系统，基于SQL数据库执行查询，并通过大模型处理查询结果以生成回答。

:::note
在生产环境中部署时，除了以下基础步骤外，还需要考虑连接数据库的安全性、查询语句的审核、超大表格的处理、多轮对话的支持等，将在后续的实践中逐步完善。
:::

## 分步执行

1. **连接数据库**

    首先通过数据库的URI，建立与数据库的连接。方便起见，这里使用 `langchain_community.utilities` 中的 `SQLDatabase` 类，其封装了一系列便捷的方法获取数据库与表格信息。
    
    在企业环境中，通过 pymysql 或 sqlalchemy 等基础库也可以实现相同的功能。
    
    :::note
    案例中的数据集是一个虚构的员工数据集，包含了员工的基本信息、部门信息、入离职时间等。
    若对虚构数据集感兴趣，可以参考这篇笔记[虚构员工数据集]()。
    :::

2. **获取表格信息**

    为了使大模型能够根据问题生成正确的查询语句，需要将表格的结构和字段信息传递给大模型。
    
    `SQLDatabase` 类中的 `get_table_info` 方法非常实用的获取了表格的字段信息，并提供了前几行数据的预览。
    
    ```python
    from langchain_community.utilities import SQLDatabase
    
    db = SQLDatabase.from_uri("mysql+pymysql://root:password@0.0.0.0:3306/database")
    
    table_info = db.get_table_info(table_names=["emp_data"])
    print(table_info)
    ```
    
    <iframe width="784" style="height: 440px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/KHiIFEm4qyihsqU7yFZ6tR/YA6JCWB6qkdIVdcmxKr2EQ?height=440" frameborder="0"></iframe>

3. **利用大模型生成查询语句**

    这里构建一段提示词，创建一个让大模型根据问题生成查询语句的任务。
    
    ```python
    sql_prompt = PromptTemplate.from_template(
    """
    ### Instructions:
    Your task is to convert a question into a SQL query, given a database schema.
    Adhere to these rules:
    - **Deliberately go through the question and database schema word by word** to appropriately answer the question
    - **Use Table Aliases** to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`.
    - When creating a ratio, always cast the numerator as float
    
    ### Input:
    Generate a SQL query that answers the question `{question}`.
    This query will run on a database whose schema is represented in this string:
    {table_info}
    
    ### Response:
    Based on your instructions, here is the SQL query I have generated to answer the question `{question}`:
    ```sql
    """
    )
    
    chain = sql_prompt | model.bind(stop=["```"]) | StrOutputParser()
    
    question = "请问员工的平均年龄是多少岁?"
    
    query = chain.invoke({"question": question, "table_info": table_info})
    query
    ```
    
    <iframe width="784" style="height: 98px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/KHiIFEm4qyihsqU7yFZ6tR/1ZAmNLuIL99JujU0tqRzrr?height=98" frameborder="0"></iframe>

   :::tip[关于提示词]
   1. **使用英文描述**：根据测试效果，在生成sql语句的场景下，英文提示词在sql语句的标准化，以及格式化输出方面有更好的表现。
   2. **提供SQL语法规范**：在提示词中提供SQL语法规范，能够指导模型遵循特定的格式和规则生成查询语句，提高成功率。比如有些企业的数据库字段全部存储为文本格式，就要提示大模型在使用日期或数字字段时，进行类型转换。
   3. **输出控制**：让模型接着<\```sql>生成SQL代码，在遇到标记<\```>时停止输出，能够精确地控制输出内容，使其直接结束于SQL语句的闭合标记。这样做不仅避免了不必要的额外输出，而且生成的内容格式更加符合要求。
   :::

4. **执行查询**

    ```python
    result = db.run(query)
    result
    ```
    
    <iframe width="784" style="height: 98px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/KHiIFEm4qyihsqU7yFZ6tR/nLjizbUFGu7gA7mY1N9Oyv?height=98" frameborder="0"></iframe>

5. **结果处理**

    创建一个将结果传递给大模型，并生成自然语言回答的任务，输出最终的回答。
    
    PS：此处的提示词抄袭了Langchain官网的示例
    
    ```python
    answer_prompt = PromptTemplate.from_template(
    """Given the following user question, corresponding SQL query, and SQL result, answer the user question in Chinese.
    
    Question: {question}
    SQL Query: {query}
    SQL Result: {result}
    Answer: 
    """
    )
    
    answer = answer_prompt | model | StrOutputParser()
    
    answer.invoke({
        "question": question,
        "query": query,
        "result": result
    })
    ```
    
    <iframe width="784" style="height: 98px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/KHiIFEm4qyihsqU7yFZ6tR/HdvpFit12rmwCJ6cL17pDT?height=98" frameborder="0"></iframe>

## 集成Chain

将上述步骤集成到一个 `Chain` 中，使得整个问答系统可以一次性执行。

```python
# 定义获取表结构工具函数
def get_table_info(_):
    return db.get_table_info()

# 在一个Chain中集成全部步骤
full_chain = RunnablePassthrough.assign(
    query=(
            RunnablePassthrough.assign(table_info=get_table_info)
            | sql_prompt
            | model.bind(stop=["```"])
            | StrOutputParser()
    )).assign(table_info=get_table_info, result=lambda x: db.run(x["query"])
              ) | answer_prompt | model
```

**测试效果：**

```python
full_chain.invoke({"question": "请问员工的平均年龄是多少岁?"})
```

<iframe width="784" style="height: 98px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/AZBvFt3zTTgkcQEKr7ETjp/SDLggXQxmZ16nzlkpRNaFe?height=98" frameborder="0"></iframe>

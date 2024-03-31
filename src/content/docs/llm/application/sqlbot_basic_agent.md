---
title: ""
description: ""
---

通过 Langchain Agent 实现基于SQL数据库的问答系统。

## 极简实现 

Langchain Community 提供了封装程度极高 sql_agent，我们先来体验一下。

```python {8-8}
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent

model = ChatOpenAI(openai_api_key=openai_api_key,openai_api_base=openai_api_base,temperature=temperature)
db = SQLDatabase.from_uri(f"mysql+pymysql://{user}:{password}@{ip}:{port}/{database}")

agent_executor = create_sql_agent(model, db=db, verbose=True)

agent_executor.invoke("请问员工的平均年龄是多少？")
```

<iframe width="100%" style="height: 508px;" src="https://datalore.jetbrains.com/report/embed/IRsLD9S3oA5isRQeLedT3y/BjahfMfQHBn6fYlrdtZ9j6/jLZJaH1XrgNnnoLtDNrenb?height=508" frameborder="0"></iframe>

可以看到，封装后的 sql_agent 本质上只有一行代码，非常简单，接下来我们拆解出来手动实现一下。

## 分步实现


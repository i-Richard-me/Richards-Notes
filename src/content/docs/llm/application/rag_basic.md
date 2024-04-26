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

```python
print(len(splits))
```

```text title="Output"
76
```

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

```python
retriever.get_relevant_documents("腾讯全年的收入是多少")
```

```text title="Output"
[Document(page_content='股息\n董事會建議就截至二零二三年十二月三十一日止年度派發末期股息每股3.40港元\n（二零二二年：每股2.40港元），惟須待股東在二零二四年股東週年大會上批准後，\n方可作實。該等建議股息預期將於二零二四年五月三十一日派發予於二零二四年\n五月二十二日名列本公司股東名冊的股東。\n經營資料\n於二零二三年 於二零二二年 於二零二三年\n十二月三十一日 十二月三十一日 同比變動 九月三十日 環比變動\n（百萬計，另有指明者除外）\n微信及WeChat的合併月活躍賬戶數 1,343 1,313 2% 1,336 0.5%\nQQ的移動終端月活躍賬戶數 554 572 -3% 558 -0.7%\n收費增值服務註冊賬戶數 248 234 6% 245 1%\n業務回顧及展望\n二零二三年，我們在多個產品和服務上取得了突破，視頻號的總用戶使用時長翻\n番，廣告AI模型的改進顯著提升了精準投放的效果，國際市場遊戲在遊戲收入的\n佔比達到30%的新高。這些發展帶動了高質量的收入來源，推動毛利增長23%，並\n成為我們對股東加大資本回報計劃的有力支持。騰訊混元已發展成為領先的基礎模\n型，在數學推導、邏輯推理和多輪對話中性能卓越。此外，我們積極尋求利用科技\n和平台為社會創造價值，如騰訊數字公益平台，已發展成為全球最大的數字公益服\n務平台之一，其99公益日活動創下人民幣38億元的公眾捐款紀錄。\n以下為二零二三年我們主要產品及服務的重點表現：\n‧ 視頻號總用戶使用時長翻番，得益於推薦算法優化下日活躍賬戶數和人均使用\n時長的增長。我們為視頻號創作者提供了更多的變現支持，如促進直播帶貨，\n以及將創作者與品牌進行營銷活動的匹配。\n3', metadata={'Author': '', 'CreationDate': "D:20240320162603+08'00'", 'Creator': 'Adobe InDesign 18.5 (Windows)', 'ModDate': "D:20240320162607+08'00'", 'Producer': 'Adobe PDF Library 17.0', 'Title': '240400-02', 'Trapped': 'False', 'file_path': '腾讯2023年第四季度及全年业绩.pdf', 'page': 2, 'source': '腾讯2023年第四季度及全年业绩.pdf', 'total_pages': 63}),
 Document(page_content='‧ 小遊戲的總流水增長超過50%，其已成為中國領先的休閒遊戲平台。\n‧ QQ頻道增強了遊戲、生活和知識內容等類目下的基於興趣的用戶互動。\n‧ 騰訊視頻和TME擴大了在長視頻和音樂流媒體行業中的領先地位，視頻付費會\n員數達1.17億1和音樂付費會員數達1.07億2。\n‧ 我們認為季度平均日活躍賬戶數逾500萬的手遊或逾200萬的個人電腦遊戲且年\n流水逾人民幣40億元為一款重點且持久的熱門遊戲的標準，這一標準下騰訊在\n本土市場「重點熱門游戲」的數量從二零二二年的6款增加到二零二三年的8款。\n‧ 我們升級了AI驅動的廣告技術平台，顯著提升了精準投放的效果，從而增加了\n廣告收入。\n‧ 我們加強了支付合規能力，增強了基於小程序的交易工具，並提升了跨境支付\n體驗。\n‧ 企業微信和騰訊會議部署了生成式AI功能，並增強商業化。\n‧ 我們發佈了自研基礎模型騰訊混元，並採用混合專家模型結構將其擴展為萬億\n參數規模。\n於二零二三年，我們通過現金分紅的支付、股份回購和實物分派的派付向股東提供\n了可觀的資本回報。於二零二四年，我們建議派發截至二零二三年十二月三十一日\n止年度的股息每股3.40港元（3 約等於320億港元），增長42%，並計劃將我們的股份\n回購規模至少翻倍，從二零二三年的490億港元增加至二零二四年的超1,000億港元。\n1 截至二零二三年十二月三十一日\n2 二零二三年第四季每月的最後一天付費會員數的平均值\n3 待股東在二零二四年股東週年大會上批准後，方可作實\n4', metadata={'Author': '', 'CreationDate': "D:20240320162603+08'00'", 'Creator': 'Adobe InDesign 18.5 (Windows)', 'ModDate': "D:20240320162607+08'00'", 'Producer': 'Adobe PDF Library 17.0', 'Title': '240400-02', 'Trapped': 'False', 'file_path': '腾讯2023年第四季度及全年业绩.pdf', 'page': 3, 'source': '腾讯2023年第四季度及全年业绩.pdf', 'total_pages': 63}),
 Document(page_content='收入。截至二零二三年十二月三十一日止年度的收入同比增長10%至人民幣6,090\n億元。下表載列本集團截至二零二三年及二零二二年十二月三十一日止年度按業務\n劃分的收入：\n截至十二月三十一日止年度\n二零二三年 二零二二年\n佔收入總額 佔收入總額\n金額 百分比 金額 百分比\n（人民幣百萬元，另有指明者除外）\n增值服務 298,375 49% 287,565 52%\n網絡廣告 101,482 17% 82,729 15%\n金融科技及企業服務 203,763 33% 177,064 32%\n其他 5,395 1% 7,194 1%\n收入總額 609,015 100% 554,552 100%\n－ 增值服務業務截至二零二三年十二月三十一日止年度的收入同比增長4%至人民\n幣2,984億元。國際市場遊戲收入增長14%至人民幣532億元，排除滙率波動的\n影響後增幅為8%，得益於《VALORANT》的強勁表現，最近發佈的遊戲《勝利女\n神：妮姬》和《Triple Match 3D》帶來的貢獻，以及《PUBG MOBILE》於本年下半\n年復甦。本土市場遊戲收入增長2%至人民幣1,267億元，得益於我們近期發佈\n的《無畏契約》和《命運方舟》的收入貢獻，以及《暗區突圍》和《金鏟鏟之戰》等新\n興遊戲強勁增長，部分被《和平精英》的較弱貢獻所抵銷。社交網絡收入同比增\n長1%至人民幣1,185億元，由於音樂付費會員及小遊戲平台服務費收入增長，\n部分被音樂直播及遊戲直播服務收入下降所抵銷。\n－ 網絡廣告業務截至二零二三年十二月三十一日止年度的收入同比增長23%至人\n民幣1,015億元，該增長受視頻號及微信搜一搜的新廣告庫存以及我們的廣告平\n台持續升級所帶動。除了汽車行業外，所有重點廣告主行業在我們的廣告平台\n上的廣告開支均有所增加，其中消費品、互聯網服務及大健康行業的開支顯著\n增加。\n7', metadata={'Author': '', 'CreationDate': "D:20240320162603+08'00'", 'Creator': 'Adobe InDesign 18.5 (Windows)', 'ModDate': "D:20240320162607+08'00'", 'Producer': 'Adobe PDF Library 17.0', 'Title': '240400-02', 'Trapped': 'False', 'file_path': '腾讯2023年第四季度及全年业绩.pdf', 'page': 6, 'source': '腾讯2023年第四季度及全年业绩.pdf', 'total_pages': 63})]
```

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

```python
rag_chain.invoke("腾讯全年的收入是多少")
```

```text title="Output"
'腾讯在截至二零二三年十二月三十一日止年度的收入为人民币6,090亿元。'
```

## 总结

:::tip
以上步骤是一个极简的实现演示，大家在尝试中可能会发现，当换做其他更为复杂的问题时，问答效果可能会出现显著下降。

在实际应用中，伴随着文档的数量增多，以及用户的问题更加开放和多样，上述极简的步骤不能满足真实应用，我们需要更多的调整和优化手段，比如对问题进行转述再检索、多种检索方法的组合等等、以至于召回文本在
prompt 中的位置调整，都是提高问答效果的重要手段。
:::
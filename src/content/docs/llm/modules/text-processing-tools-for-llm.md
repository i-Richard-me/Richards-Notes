---
title: "文本处理工具模块"
description: "本文介绍一个用于文本预处理的Python工具集,包文本清洗、无效文本过滤、语言检测、DataFrame转Markdown和文本批处理等六个核心功能。这些工具旨在提高数据质量,简化大型语言模型输入的准备工作。"
---

在大语言模型任务中，高质量的数据预处理对模型性能和分析结果的可靠性有着重要影响。
本文将介绍一个基于实际项目经验开发的Python模块。

这个模块是我根据日常工作中遇到的各种文本处理需求总结而来，它包含了一系列实用的文本处理和数据预处理工具，旨在解决实际应用中常见的数据准备问题。

我们将详细解析每个函数的功能，探讨它们的具体应用场景和特点，帮助你在LLM分析任务中更加得心应手。

### 模块概览

该模块提供了以下核心功能：

1. 参数验证
2. 文本清洗
3. 无效文本过滤
4. 语言类型检查
5. 字符和单词计数
6. DataFrame转Markdown表格
7. 文本批处理

让我们深入每个功能的细节，了解它们如何在实际项目中发挥作用。

```python
# 导入相关依赖
from typing import List, Literal, Optional, Union
import pandas as pd
import regex as re
import random
```

### 1. 参数验证

```python
def validate_params(
        df: Optional[pd.DataFrame] = None,
        text_col: Optional[str] = None,
        cols: Optional[List[str]] = None,
        rows_per_table: Optional[int] = None,
        nan_drop_method: Optional[Literal["any", "all"]] = None,
        output_format: Optional[Literal["list", "dataframe"]] = None,
        chars_per_batch: Optional[int] = None,
        random_seed: Optional[int] = None,
        drop_last_batch: Optional[bool] = None
) -> None:
    """
    验证文本处理相关参数的有效性。

    参数:
    df: 输入的DataFrame
    text_col: 文本列名
    cols: 列名列表
    rows_per_table: 每个表格的行数
    nan_drop_method: NaN值删除方法
    output_format: 输出格式
    chars_per_batch: 每批次的字符数
    random_seed: 随机种子
    drop_last_batch: 是否删除最后一个批次
    """
    if df is not None and not isinstance(df, pd.DataFrame):
        raise ValueError("df 必须是 pandas DataFrame 类型")

    if text_col is not None:
        if not isinstance(text_col, str):
            raise ValueError("text_col 必须是字符串类型")
        if df is not None and text_col not in df.columns:
            raise KeyError(f"指定的列 '{text_col}' 在DataFrame中不存在")

    if cols is not None:
        if not isinstance(cols, list):
            raise ValueError("cols 必须是列表类型")
        if df is not None:
            for col in cols:
                if col not in df.columns:
                    raise ValueError(f"cols 中的列 {col} 不存在于 df 中")

    if rows_per_table is not None and (not isinstance(rows_per_table, int) or rows_per_table <= 0):
        raise ValueError("rows_per_table 必须是一个正整数")

    if nan_drop_method is not None and nan_drop_method not in ['any', 'all']:
        raise ValueError("nan_drop_method 必须是 'any' 或 'all'")

    if output_format is not None and output_format not in ['list', 'dataframe']:
        raise ValueError("output_format 必须是 'list' 或 'dataframe'")

    if chars_per_batch is not None and (not isinstance(chars_per_batch, int) or chars_per_batch <= 0):
        raise ValueError("chars_per_batch 必须是一个正整数")

    if random_seed is not None and (not isinstance(random_seed, int) or random_seed <= 0):
        raise ValueError("random_seed 必须是一个正整数")

    if drop_last_batch is not None and not isinstance(drop_last_batch, bool):
        raise ValueError("drop_last_batch 必须是布尔类型")
```

这个函数用于验证其他函数的输入参数。它的主要特点包括：

- 灵活性：使用Optional类型提示，允许部分参数为None，适应不同函数的需求。
- 严格性：对每个参数进行类型检查和有效性验证，确保数据处理的可靠性。
- 明确的错误提示：当参数不符合要求时，抛出包含具体错误描述的异常，便于快速定位问题。

`validate_params`函数不仅检查参数类型，还验证指定的列是否存在于DataFrame中，有效防止后续处理中可能出现的KeyError。

### 2. 文本清洗

```python
def clean_text_column(df: pd.DataFrame, text_col: str) -> pd.DataFrame:
    """
    清洗DataFrame中指定文本列的内容，替换特定标点符号为反引号。

    参数:
    df: 包含待清洗文本列的DataFrame
    text_col: 需要清洗的文本列名

    返回:
    包含清洗后文本列的DataFrame副本
    """
    validate_params(df=df, text_col=text_col)

    def _clean_text(text: Union[str, float]) -> str:
        if pd.isna(text):
            return ''
        return re.sub(r"['''\"""{}]", '`', str(text))

    cleaned_df = df.copy()
    cleaned_df[text_col] = cleaned_df[text_col].apply(_clean_text)
    return cleaned_df

def clean_text(text: str) -> str:
    """
    清洗文本内容，将特定标点符号替换为反引号。

    参数:
    text: 需要清洗的文本内容

    返回:
    清洗后的文本内容
    """
    return re.sub(r"['''\"""{}]", '`', text) if isinstance(text, str) else ''
```

这两个函数用于文本清洗，主要特点如下：

- `clean_text_column`：针对DataFrame中的特定列进行清洗。
- `clean_text`：单独处理文本字符串，可用于DataFrame之外的场景。
- 清洗重点：替换特定标点符号为反引号，有助于规范化文本格式。

这个函数适用于处理网页爬取内容、用户评论等数据，可以减少特殊字符对后续任务的干扰。

### 3. 无效文本过滤

```python
def filter_invalid_text(df: pd.DataFrame, text_col: str) -> pd.DataFrame:
    """
    过滤数据集中指定列为非有效文本的行。

    参数:
    df: 输入的数据集
    text_col: 要检查的文本列名

    返回:
    过滤后的数据集
    """
    validate_params(df=df, text_col=text_col)

    def is_valid_text(text):
        if pd.isna(text):
            return False
        text = str(text).strip()
        if not text or re.match(r'^[\s\p{P}]+$', text, re.UNICODE) or text.isdigit() or \
                len(set(text)) == 1 or re.match(r'^(.)\1*(?:(.)\2*){0,2}$', text) or \
                not re.search(r'[\p{L}\p{N}]', text, re.UNICODE):
            return False
        return True

    return df[df[text_col].apply(is_valid_text)]
```

`filter_invalid_text`函数用于过滤数据集中的无效文本，其特点包括：

- 多维度过滤：检查空值、纯标点符号、纯数字、重复字符等多种无效文本类型。
- 使用正则表达式：通过正则表达式实现高效的文本模式匹配。

这个函数特别适合清理用户生成内容，如评论或帖子中的无意义文本。

### 4. 语言类型检查

```python
def check_language_type(df: pd.DataFrame, text_col: str) -> pd.DataFrame:
    """
    检查数据集中指定文本字段的内容是否为中文，并添加一个标记列。

    参数:
    df: 包含文本字段的数据集
    text_col: 需要检查的文本字段名称

    返回:
    返回原数据集，增加一个标记列 'is_chinese'，表示文本是否为中文
    """
    validate_params(df=df, text_col=text_col)

    def contains_chinese(text):
        if isinstance(text, str):
            chinese_chars = re.findall('[\u4e00-\u9fff]', text)
            return len(chinese_chars) / len(text) >= 0.5 if text else False
        return False

    df['is_chinese'] = df[text_col].apply(contains_chinese)
    return df
```

`check_language_type`函数用于识别文本是否为中文，主要特点有：

- 添加标记列：在原DataFrame中增加'is_chinese'列，方便后续处理。
- 比例判断：通过计算中文字符占比来确定文本语言类型，提高准确性。
- 适用于多语言数据集：可用于预处理需要区分中英文内容的数据集。

这个函数在进行跨语言分析或翻译任务时特别有用。 

### 5. 字符和单词计数

```python
def count_chars_and_words(text: str) -> int:
    """
    统计文本中的中文字符和英文单词数。

    参数:
    text: 要统计的文本内容

    返回:
    中文字符和英文单词的总数
    """
    chinese_char_count = len(re.findall(r'[\u4e00-\u9fff]', text))
    english_word_count = len(re.findall(r'\b[a-zA-Z]+\b', text))
    return chinese_char_count + english_word_count
```

`count_chars_and_words`函数用于统计文本中的中文字符和英文单词总数，其特点包括：

- 双语支持：同时计算中文字符和英文单词，适用于混合语言文本。
- 使用正则表达式：准确识别中文字符和英文单词。
- 返回总数：便于后续文本分割或长度限制操作。

这个函数为文本批处理提供了重要的基础，特别是在需要按字符数限制进行文本切分时。

### 6. DataFrame转Markdown表格

```python
def dataframe_to_markdown_tables(
        df: pd.DataFrame,
        cols: List[str],
        rows_per_table: int = 10,
        nan_drop_method: Literal["any", "all"] = "any",
        output_format: Literal["list", "dataframe"] = "list"
) -> Union[List[str], pd.DataFrame]:
    """
    将输入的DataFrame转换为批量的Markdown表格。

    参数:
    df: 输入的DataFrame
    cols: 要包含在Markdown表格中的列
    rows_per_table: 每个Markdown表格中的行数
    nan_drop_method: 删除包含NaN值行的方法
    output_format: 输出格式

    返回:
    Markdown表格列表或包含Markdown表格的DataFrame
    """
    validate_params(df=df, cols=cols, rows_per_table=rows_per_table,
                    nan_drop_method=nan_drop_method, output_format=output_format)

    cleaned_df = df.dropna(subset=cols, how=nan_drop_method)
    text_cols = [col for col in cols if cleaned_df[col].dtype == 'object']
    for col in text_cols:
        cleaned_df[col] = cleaned_df[col].str.replace('\r\n|\n', ' ', regex=True)

    table_data = cleaned_df[cols]
    markdown_tables = []

    for start_index in range(0, len(table_data), rows_per_table):
        table_subset = table_data.iloc[start_index:start_index + rows_per_table]
        table_header = "| " + " | ".join(cols) + " |\n"
        table_separator = "| " + " | ".join(["---"] * len(cols)) + " |\n"
        table_rows = "".join(f"| {' | '.join(map(str, row))} |\n" for _, row in table_subset.iterrows())
        markdown_tables.append(table_header + table_separator + table_rows)

    return markdown_tables if output_format == "list" else pd.DataFrame(markdown_tables, columns=['Markdown Table'])
```

这个函数将DataFrame转换为Markdown格式的表格，主要特点包括：

- 灵活的输出控制：可选择输出为字符串列表或DataFrame。
- 自定义表格大小：通过`rows_per_table`参数控制每个表格的行数。
- NaN值处理：提供'any'和'all'两种NaN值删除方法。
- 文本预处理：自动处理换行符，确保Markdown表格格式正确。

这个函数在需要将大型数据集转换为Markdown格式时特别有用，便于将表格数据提供给大模型。

### 7. 文本批处理

```python
def dataframe_to_batched_texts(
        df: pd.DataFrame,
        cols: List[str],
        chars_per_batch: int = 1000,
        random_seed: int = 94,
        drop_last_batch: bool = False
) -> List[List[str]]:
    """
    预处理文本列并将文本按字符限制分批。

    参数:
    df: 输入的DataFrame
    cols: 要预处理和分批的列
    chars_per_batch: 每批次的最大字符数
    random_seed: 随机种子
    drop_last_batch: 是否删除最后一个批次

    返回:
    批次列表，每个批次包含预处理后的文本列表
    """
    validate_params(df=df, cols=cols, chars_per_batch=chars_per_batch,
                    random_seed=random_seed, drop_last_batch=drop_last_batch)

    random.seed(random_seed)
    df[cols] = df[cols].applymap(clean_text)
    all_texts = df[cols].values.flatten().tolist()
    random.shuffle(all_texts)

    batched_texts = []
    current_batch = []
    current_batch_char_count = 0

    for text in all_texts:
        text_char_count = count_chars_and_words(text)
        if current_batch_char_count + text_char_count > chars_per_batch and current_batch:
            batched_texts.append(current_batch)
            current_batch = []
            current_batch_char_count = 0
        current_batch.append(text)
        current_batch_char_count += text_char_count

    if current_batch and not drop_last_batch:
        batched_texts.append(current_batch)

    return batched_texts
```

`dataframe_to_batched_texts`函数用于将大型文本数据集分割成小批量，其主要特点包括：

- 字符数控制：通过`chars_per_batch`参数精确控制每个批次的大小。
- 随机化处理：使用`random_seed`参数确保可重复的随机化过程，避免相似文本集中在一起。
- 灵活的批次处理：可选是否保留最后一个不完整批次。

这个函数特别适合处理需要分批输入到大型语言模型的文本数据，可以有效控制每批数据的大小，优化模型处理效率。
---
title: "大模型调用工具模块"
description: "为简化大规模LLM应用开发而设计的Python模块，包括模型初始化、语言模型链构建和批量数据处理。"
---

该模块包含了模型初始化、批量处理等关键功能，旨在简化LLM的使用流程，提高开发效率。

模块概览
语言模型工具集主要包含以下核心功能：

1. 环境变量加载
2. 语言模型初始化
3. 语言模型链构建
4. 批量数据处理

### 1. 参数验证

这个函数检查所有输入参数的类型和有效性，确保在模块的各个部分都能得到正确的输入。

```python
def validate_params(
        llm_chain: Optional[Any] = None,
        df: Optional[pd.DataFrame] = None,
        field_map: Optional[Dict[str, str]] = None,
        static_params: Optional[Dict[str, Any]] = None,
        model_cls: Optional[Type[BaseModel]] = None,
        extra_fields: Optional[List[str]] = None,
        batch_size: Optional[int] = None,
        sys_msg: Optional[str] = None,
        user_msg: Optional[str] = None,
        model: Optional[Any] = None,
        max_retries: Optional[int] = None,
        call_interval: Optional[float] = None
) -> None:
    """验证语言模型相关参数的有效性"""
    if df is not None and not isinstance(df, pd.DataFrame):
        raise ValueError("df 必须是 pandas DataFrame 类型")

    if field_map:
        if not isinstance(field_map, dict):
            raise ValueError("field_map 必须是字典类型")
        for invoke_field, data_field in field_map.items():
            if not all(isinstance(f, str) for f in (invoke_field, data_field)):
                raise ValueError("field_map 中的键和值必须都是字符串")
            if df is not None and data_field not in df.columns:
                raise ValueError(f"field_map 中的数据字段 {data_field} 不存在于 df 中")

    if static_params and not isinstance(static_params, dict):
        raise ValueError("static_params 必须是字典类型或 None")

    if extra_fields:
        if not isinstance(extra_fields, list):
            raise ValueError("extra_fields 必须是列表类型或 None")
        if df is not None:
            missing_fields = set(extra_fields) - set(df.columns)
            if missing_fields:
                raise ValueError(f"extra_fields 中的字段 {', '.join(missing_fields)} 不存在于 df 中")

    if batch_size is not None and (not isinstance(batch_size, int) or batch_size <= 0):
        raise ValueError("batch_size 必须是一个正整数")

    if llm_chain is not None and not hasattr(llm_chain, 'batch'):
        raise ValueError("llm_chain 必须有一个 batch 方法")

    if model_cls is not None and not issubclass(model_cls, BaseModel):
        raise ValueError("model_cls 必须是 Pydantic BaseModel 的子类")

    if any(msg is not None and not isinstance(msg, str) for msg in (sys_msg, user_msg)):
        raise ValueError("sys_msg 和 user_msg 必须是字符串类型")

    if model is not None and not callable(model):
        raise ValueError("model 必须是可调用对象")

    if max_retries is not None and (not isinstance(max_retries, int) or max_retries < 0):
        raise ValueError("max_retries 必须是一个非负整数")

    if call_interval is not None and (not isinstance(call_interval, (int, float)) or call_interval < 0):
        raise ValueError("call_interval 必须是一个非负数或 None")
```

### 2. 环境变量加载

安全管理API密钥等敏感信息是工程化的常见问题，在我的项目中一般使用YAML文件存储这些信息，并提供简单的加载函数：

```python
def load_yaml(file_path: str) -> Any:
    """加载 YAML 文件"""
    with open(file_path, 'r') as file:
        return yaml.safe_load(file)


def load_env_vars(env_path: str = 'env.yaml') -> None:
    """加载环境变量"""
    os.environ.update(load_yaml(env_path))
```

这种方法允许将敏感信息与代码分离，提高了项目的安全性和可维护性。

### 3. 语言模型初始化

init_language_model 函数支持多种模型提供商，包括OpenAI、内部模型、以及兼容openai接口的服务商。考虑了不同场景的需求，无论是使用在线API还是私有部署的模型，都能轻松适配。

```python
def init_language_model(
        model_name: str = "gpt-4",
        temperature: float = 0.0,
        provider: str = "openai",
        token: Optional[str] = None,
        config_path: Optional[str] = None,
        **kwargs: Any
) -> ChatOpenAI:
    """
    初始化语言模型，支持OpenAI、公司内部模型和其他模型供应商。

    参数:
    model_name (str): 选择的模型名称。
    temperature (float): 模型输出的温度，控制随机性。
    provider (str): 模型提供商，例如 "openai"、"internal"、"siliconcloud"。
    token (str): 用户的令牌。如果未提供，则使用配置文件中的默认令牌（仅对 internal 有效）。
    config_path (str): 配置文件的路径（仅对 internal 有效）。
    **kwargs: 其他可选参数，将传递给模型初始化。

    返回:
    ChatOpenAI: 初始化后的语言模型实例。

    异常:
    ValueError: 当提供的参数无效或缺少必要的配置时抛出。
    """
    validate_params()

    if provider == "internal":
        if not config_path:
            raise ValueError("内部模型需要提供配置路径")
        config = load_yaml(config_path)

        if model_name not in config['default_headers']['Service-Id']:
            valid_models = list(config['default_headers']['Service-Id'].keys())
            raise ValueError(f"无效的模型选择: {model_name}。请从以下选项中选择: {', '.join(valid_models)}")

        token = token or config['default_headers']['Token']

        default_headers = {
            "Service-Id": config['default_headers']['Service-Id'][model_name],
            "Token": token
        }

        model_params = {
            "model": "Default",
            "openai_api_key": "EMPTY",
            "openai_api_base": config['api_base_url'],
            "default_headers": default_headers,
            "temperature": temperature,
            "max_tokens": kwargs.get("max_tokens", 1024),
        }
    else:
        api_key_env_var = f'OPENAI_API_KEY_{provider.upper()}'
        api_base_env_var = f'OPENAI_API_BASE_{provider.upper()}'

        openai_api_key = os.environ.get(api_key_env_var)
        openai_api_base = os.environ.get(api_base_env_var)

        if not openai_api_key or not openai_api_base:
            raise ValueError(f"无法找到 {provider} 的 API 密钥或基础 URL。请检查环境变量设置。")

        model_params = {
            "model": model_name,
            "openai_api_key": openai_api_key,
            "openai_api_base": openai_api_base,
            "temperature": temperature,
            **kwargs
        }

    return ChatOpenAI(**model_params)
```

:::caution
函数中internal模型的调用方式，需要根据公司自己部署模型的API文档做相应调整。
:::

### 4. 语言模型链构建

LanguageModelChain类封装了完整的处理流程，包括提示模板、模型调用和输出解析：

```python
class LanguageModelChain:
    """
    语言模型链，用于处理输入并生成符合指定模式的输出。

    属性:
    model_cls (Type[BaseModel]): Pydantic 模型类，定义输出的结构。
    parser (JsonOutputParser): JSON 输出解析器。
    prompt_template (ChatPromptTemplate): 聊天提示模板。
    chain (Any): 完整的处理链。

    方法:
    __init__: 初始化 LanguageModelChain 实例。
    __call__: 调用处理链。
    """

    def __init__(self, model_cls: Type[BaseModel], sys_msg: str, user_msg: str, model: Any):
        """
        初始化 LanguageModelChain 实例。

        参数:
        model_cls (Type[BaseModel]): Pydantic 模型类，定义输出的结构。
        sys_msg (str): 系统消息。
        user_msg (str): 用户消息。
        model (Any): 语言模型实例。

        异常:
        ValueError: 当提供的参数无效时抛出。
        """
        validate_params(model_cls=model_cls, sys_msg=sys_msg, user_msg=user_msg, model=model)

        self.model_cls = model_cls
        self.parser = JsonOutputParser(pydantic_object=model_cls)

        format_instructions = """
        Output your answer as a JSON object that conforms to the following schema:
        ```json
        {schema}
        ```
        
        Important instructions:
        1. Wrap your entire response between ```json and ``` tags.
        2. Ensure your JSON is valid and properly formatted.
        3. Do not include the schema definition in your answer.
        4. Only output the data instance that matches the schema.
        5. Do not include any explanations or comments within the JSON output.
        """

        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", sys_msg + format_instructions),
            ("human", user_msg),
        ]).partial(schema=model_cls.model_json_schema())

        self.chain = self.prompt_template | model | self.parser

    def __call__(self) -> Any:
        """
        调用处理链。

        返回:
        Any: 处理链的输出。
        """
        return self.chain
```

### 5. 批量数据处理

batch_process_data函数是这个模块的核心，它实现了高效的批量处理，包括错误处理和重试机制：

```python
def batch_process_data(
        llm_chain: Any,
        df: pd.DataFrame,
        field_map: Dict[str, str],
        model_cls: Type[BaseModel],
        static_params: Optional[Dict[str, Any]] = None,
        extra_fields: Optional[List[str]] = None,
        batch_size: int = 10,
        max_retries: int = 1,
        call_interval: Optional[float] = None,
        output_json: bool = False,
        config: Any = None
) -> Union[Tuple[pd.DataFrame, pd.DataFrame], Tuple[List[Dict[str, Any]], pd.DataFrame]]:
    """
    批量处理数据集，调用大模型任务链，并返回处理结果和错误信息。包含重试机制和可选的调用间隔。

    参数:
    llm_chain (Any): 语言模型链实例。
    df (pd.DataFrame): 输入数据集。
    field_map (Dict[str, str]): 字段映射，将输入字段映射到模型所需字段。
    model_cls (Type[BaseModel]): Pydantic 模型类，定义输出的结构。
    static_params (Optional[Dict[str, Any]]): 静态参数，应用于所有批次。
    extra_fields (Optional[List[str]]): 要包含在结果中的额外字段。
    batch_size (int): 每个批次的大小。
    max_retries (int): 批处理失败时的最大重试次数。
    call_interval (Optional[float]): 每次调用后的停顿时间（秒）。如果为None，则不进行停顿。
    output_json (bool): 是否输出原始JSON列表而不是DataFrame。默认为False。

    返回:
    Union[Tuple[pd.DataFrame, pd.DataFrame], Tuple[List[Dict[str, Any]], pd.DataFrame]]:
    如果output_json为False，返回包含处理结果的DataFrame和错误日志的DataFrame。
    如果output_json为True，返回包含原始JSON的列表和错误日志的DataFrame。

    异常:
    ValueError: 当提供的参数无效时抛出。
    """
    validate_params(llm_chain=llm_chain, df=df, field_map=field_map,
                    static_params=static_params, model_cls=model_cls,
                    extra_fields=extra_fields, batch_size=batch_size,
                    max_retries=max_retries, call_interval=call_interval)

    processed_results = []
    error_logs = []

    def construct_params(row: pd.Series) -> Dict[str, Any]:
        return {**{invoke_field: row[data_field] for invoke_field, data_field in field_map.items()},
                **(static_params or {})}

    def handle_response(response: Any, extra_data: Dict[str, Any]) -> Dict[str, Any]:
        if output_json:
            # 当输出JSON时，直接返回原始响应并在最外层添加extra_fields
            return {**response, **extra_data}
        else:
            # 当不输出JSON时，保持原有逻辑
            model_field = next(iter(model_cls.__annotations__))
            if isinstance(response, dict):
                if model_field in response:
                    result = response[model_field] if isinstance(response[model_field], list) else [response]
                else:
                    result = [response]
            elif isinstance(response, list):
                result = response
            else:
                result = [response]
            return [{**item, **extra_data} for item in result]

    def process_batch(batch: pd.DataFrame, start_idx: int) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        batch_results = []
        batch_errors = []
        batch_params = [construct_params(row) for _, row in batch.iterrows()]

        for retry in range(max_retries + 1):
            try:
                responses = llm_chain.batch(batch_params, config=config)
                for i, response in enumerate(responses):
                    extra_data = {field: batch.iloc[i][field] for field in (extra_fields or [])}
                    processed_response = handle_response(response, extra_data)
                    batch_results.append(processed_response if output_json else processed_response[0])
                return batch_results, batch_errors
            except Exception as e:
                retry_delay = 10 if call_interval is None else call_interval * 10
                if retry < max_retries:
                    print(f"处理批次 {start_idx // batch_size + 1} 时发生错误，{retry_delay:.1f}秒后进行第{retry+1}次重试:")
                    print(f"错误类型: {type(e).__name__}")
                    print(f"错误信息: {str(e)}")
                    time.sleep(retry_delay)
                else:
                    for i in range(len(batch)):
                        error_info = {field: batch.iloc[i][field] for field in (extra_fields or [])}
                        error_info.update({"index": start_idx + i, "error": str(e)})
                        batch_errors.append(error_info)
                    print(f"处理批次 {start_idx // batch_size + 1} 失败，已达到最大重试次数:")
                    print(f"错误类型: {type(e).__name__}")
                    print(f"错误信息: {str(e)}")
                    traceback.print_exc()

        return batch_results, batch_errors

    total_batches = (len(df) + batch_size - 1) // batch_size
    for start_idx in tqdm(range(0, len(df), batch_size), desc="批处理进度", total=total_batches):
        end_idx = min(start_idx + batch_size, len(df))
        batch = df.iloc[start_idx:end_idx]

        batch_results, batch_errors = process_batch(batch, start_idx)
        processed_results.extend(batch_results)
        error_logs.extend(batch_errors)

        if call_interval is not None:
            time.sleep(call_interval)

    if output_json:
        print(f"\n处理完成:")
        print(f"成功处理的条目数: {len(processed_results)}")
        print(f"处理失败的条目数: {len(error_logs)}")
        return processed_results, pd.DataFrame(error_logs)
    else:
        result_df = pd.DataFrame(processed_results)
        error_df = pd.DataFrame(error_logs)

        print(f"\n处理完成:")
        print(f"成功处理的行数: {len(result_df)}")
        print(f"处理失败的行数: {len(error_df)}")

        return result_df, error_df
```

这个函数的主要特点包括：

1. 支持大规模数据的批量处理
2. 灵活的字段映射机制
3. 内置的错误处理和重试逻辑
4. 可选的调用间隔，防止API限流
5. 支持输出为DataFrame或原始JSON格式
import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocSearch from '@astrojs/starlight-docsearch';
import starlightBlog from 'starlight-blog';
import starlightImageZoom from 'starlight-image-zoom';
// import starlightUtils from "@lorenzo_lewis/starlight-utils";

// https://astro.build/config
export default defineConfig({

    // Enable sitemap generation
    site: 'https://docs.irichard.wang',

    integrations: [
        starlight({
            title: 'Richard\'s Notes',
            customCss: [
                // 你的自定义 CSS 文件的相对路径
                './src/styles/custom.css',
                // './src/styles/fontawesome.css'
            ],
            plugins: [
                starlightDocSearch({
                        appId: 'SA6K3EPNJ6',
                        apiKey: 'bd88af8b218fcda47a26e09d9c11465f',
                        indexName: 'irichard',
                    },
                ),
                // starlightUtils({
                //     multiSidebar: {
                //         switcherStyle: "horizontalList",
                //     },
                // }),
                starlightImageZoom(),
                starlightBlog(
                    {
                        authors: {
                            richard: {
                                name: 'Richard Wang',
                                title: '博主',
                                picture: '/avatar_128x128.png',
                                url: 'https://docs.irichard.wang',
                            },
                        },
                    }
                ),
            ],
            head: [
                {
                    tag: 'script',
                    attrs: {
                        src: 'https://plausible.homelab.wang/js/script.js',
                        'data-domain': 'docs.irichard.wang',
                        defer: true,
                    },
                },
            ],
            social: {
                github: 'https://github.com/i-Richard-me/docs',
            },
            sidebar: [
                {label: 'Welcome', link: '/guides/intro/'},
                {
                    label: "Intelligent HR 产品文档",
                    items: [
                        {
                            label: 'Introduction', link: '/intelligenthr/intelligenthr-intro',
                            badge: {text: 'Intro', variant: 'success'},
                        },
                        {
                            label:
                                '功能模块详解',
                            items:
                                [
                                    {label: '🔍 AI 研究助手', link: '/intelligenthr/function_modules/ai-researcher'},
                                    {
                                        label: '📊 驱动因素分析',
                                        link: '/intelligenthr/function_modules/feature-importance'
                                    },

                                    {label: '🧮 表格处理助手', link: '/intelligenthr/function_modules/table-operation'},
                                    {label: '🏢 数据标签清洗', link: '/intelligenthr/function_modules/data-cleaning'},

                                    {label: '🌐 AI数据集翻译', link: '/intelligenthr/function_modules/translation'},
                                    {
                                        label: '🏷️ 情感分析与标注',
                                        link: '/intelligenthr/function_modules/text-classification'
                                    },
                                    {label: '🔬 文本聚类分析', link: '/intelligenthr/function_modules/text-clustering'},

                                    {label: '📄 简历信息提取', link: '/intelligenthr/function_modules/resume-extractor'},
                                    {
                                        label: '👥 简历推荐助手',
                                        link: '/intelligenthr/function_modules/resume-recommender'
                                    },
                                ]
                        }]
                },
                {
                    label: 'AI与大模型',
                    items: [
                        {
                            label: 'Introduction', link: '/llm/llm-intro',
                            badge: {text: 'Intro', variant: 'success'},
                            // attrs: {style: 'font-size: var(--sl-text-base); font-weight: 600; color: var(--sl-color-white)'},
                        },
                        {
                            label:
                                '大模型应用探索',
                            items:
                                [
                                    {
                                        label: '突破传统NLP情感分类精度瓶颈',
                                        link: '/llm/application/sentiment_classification'
                                    },
                                    {label: '不同模型尺寸的文本任务对比', link: '/llm/application/llm_compare'},
                                    {
                                        label: '利用大模型进行实体及属性抽取',
                                        link: '/llm/application/performance-eval-analysis'
                                    },
                                    {
                                        label: '爬虫&大模型获取行业动态 (一)',
                                        link: '/llm/application/spider-and-llm-part-one'
                                    },
                                    {
                                        label: '爬虫&大模型获取行业动态 (二)',
                                        link: '/llm/application/spider-and-llm-part-two'
                                    },
                                    {label: '简单实现文档检索和生成', link: '/llm/application/rag_basic'},
                                    {label: '基于SQL数据库的简单问答', link: '/llm/application/sqlbot_basic'},
                                    {
                                        label: '简单构建岗位与技能知识图谱',
                                        link: '/llm/application/knowledge-graph'
                                    },
                                ]
                        },
                        {
                            label:
                                '高效优化策略',
                            items:
                                [
                                    {
                                        label: '大模型高效微调-训练集准备',
                                        link: '/llm/optimizing/fine-tuning-data-preparation'
                                    },
                                    {
                                        label: '大模型高效微调-调参训练',
                                        link: '/llm/optimizing/fine-tuning-result'
                                    },
                                    {
                                        label: '示例选择器动态调整提示词',
                                        link: '/llm/optimizing/example-selector'
                                    },
                                    {label: '复杂问题分解', link: '/llm/optimizing/rag-with-decomposition'},
                                    {
                                        label: '多向量检索之假设提问',
                                        link: '/llm/optimizing/multivector-retriever-hypothetical-queries'
                                    },
                                    {
                                        label: '多向量检索之段落摘要',
                                        link: '/llm/optimizing/multivector-retriever-summarize'
                                    },
                                    {label: 'ReAct模式 SQL Agent', link: '/llm/optimizing/react-sql-agent'},
                                    {
                                        label: '提升大语言模型生成SQL准确性',
                                        link: '/llm/optimizing/nl2sql-optimizing'
                                    },
                                    {
                                        label: 'Unstructured多格式数据加载',
                                        link: '/llm/optimizing/unstructured-loder'
                                    },
                                    {
                                        label: 'Unstructured按元素切分文档',
                                        link: '/llm/optimizing/unstructured-split'
                                    },
                                ]
                        },
                        {
                            label:
                                '实战案例详解',
                            badge: {text: 'Hot', variant: 'caution'},
                            items:
                                [
                                    {
                                        label: '框架设计与工具节点实现',
                                        link: '/llm/project/school-name-standardization-part-1'
                                    },
                                    {
                                        label: '数据模型与高效提示词设计',
                                        link: '/llm/project/school-name-standardization-part-2'
                                    },
                                    {
                                        label: '任务节点函数与决策路由实现',
                                        link: '/llm/project/school-name-standardization-part-3'
                                    },
                                    {
                                        label: '构建完整流程图及案例展示',
                                        link: '/llm/project/school-name-standardization-part-4'
                                    },
                                ]
                        },
                        {
                            label:
                                '特色案例拓展',
                            badge: {text: 'Hot', variant: 'caution'},
                            items:
                                [
                                    {label: '智能化公司标签清洗流程', link: '/llm/project/data-cleaning-case'},
                                    {
                                        label: '非结构化文本数据分析解决方案',
                                        link: '/llm/project/feedback-clustering-classification-workflow'
                                    },
                                    {
                                        label: '大模型批量调用技巧与实践',
                                        link: '/llm/project/batch-processing-efficiency'
                                    },
                                ]
                        },
                        {
                            label:
                                '工具模块分享',
                            items:
                                [
                                    {
                                        label: '文本处理工具模块',
                                        link: '/llm/modules/text-processing-tools-for-llm'
                                    },
                                    {
                                        label: '大模型调用工具模块',
                                        link: '/llm/modules/language-model-utilities'
                                    },
                                ]
                        },
                        {
                            label:
                                '模型部署指南',
                            items:
                                [
                                    {label: 'Langfuse: 本地大模型监控利器', link: '/llm/tools/langfuse'},
                                    {label: 'Lobechat 个人专属AI聊天平台', link: '/llm/lobe-chat-deployment'},
                                    {label: '使用Ollama部署Qwen-110B', link: '/llm/ollama-deploy'},
                                    {label: '大模型部署容器环境', link: '/llm/llm-docker-env'},
                                    {label: 'Milvus 向量数据库', link: '/llm/milvus'},
                                    {label: '开源大模型兼容Openai接口', link: '/llm/openai-api-for-open-llm'},
                                ]
                        },
                    ]
                },
                {
                    label:
                        '机器学习',
                    items: [
                        {
                            label: 'Introduction', link: '/machine-learning/machine-learning-intro',
                            badge: {text: 'Intro', variant: 'success'},
                        },
                        {
                            label:
                                '机器学习基础',
                            items:
                                [
                                    {label: '建模目标与数据质量', link: '/machine-learning/data-preprocessing'},
                                    {
                                        label: '数据探查与分析',
                                        badge: {text: 'Hot', variant: 'caution'},
                                        link: '/machine-learning/data-exploration'
                                    },
                                    {
                                        label: '特征工程之手动特征衍生',
                                        link: '/machine-learning/basic-feature-engineering'
                                    },
                                    {
                                        label: '建模调参流程与逻辑回归',
                                        badge: {text: 'Hot', variant: 'caution'},
                                        link: '/machine-learning/model-logisticregression'
                                    },
                                    // {label: '特征筛选', link: '/machine-learning/feature-selection'},
                                ],
                        },
                        {
                            label:
                                '集成学习',
                            items:
                                [
                                    {
                                        label: '随机森林与贝叶斯优化器',
                                        link: '/machine-learning/random-forest-bayesian-optimizer'
                                    },
                                    {label: 'XGBoost 极端梯度提升树', link: '/machine-learning/xgboost'},
                                    {label: 'LightGBM 轻量梯度提升树', link: '/machine-learning/lightgbm'},
                                ]
                        },
                    ]
                },
                {
                    label: '数据分析',
                    items: [
                        {
                            label: 'Introduction', link: '/analysis/analysis-intro',
                            badge: {text: 'Intro', variant: 'success'},
                        },
                        {
                            label:
                                '数据处理',
                            items:
                                [
                                    {
                                        label: '虚构数据集集合',
                                        link: '/analysis/dataprocessing/fictional-dataset'
                                    },
                                    {
                                        label: '以员工晋升记录为例虚构数据集',
                                        link: '/analysis/dataprocessing/fictional-promotion-dataset'
                                    },
                                    {
                                        label: '模拟员工入职三年的成长与保留',
                                        link: '/analysis/dataprocessing/fictional-employee-development-dataset'
                                    },
                                ]
                        },
                        {
                            label:
                                'Tableau进阶',
                            items:
                                [
                                    {
                                        label: '可视化进阶 (一) 页面布局',
                                        link: '/analysis/tableau/tableau-layout'
                                    },
                                    {
                                        label: '可视化进阶 (二) 动态区域可见性',
                                        link: '/analysis/tableau/tableau-dynamic-area'
                                    },
                                    {
                                        label: '可视化进阶 (三) 仪表板图表联动',
                                        link: '/analysis/tableau/tableau-link'
                                    },
                                    {
                                        label: '可视化进阶 (四) 动态下钻分析',
                                        link: '/analysis/tableau/tableau-drill-down'
                                    },
                                    {
                                        label: '可视化进阶 (五) 交互式分析',
                                        link: '/analysis/tableau/tableau-interactive'
                                    },
                                    {label: 'Tableau 自定义调色板', link: '/analysis/tableau/tableau-palette'},
                                ]
                        },
                        {
                            label:
                                '数据可视化',
                            items:
                                [
                                    {label: '组织网络图观测协作模式', link: '/analysis/charts/network-diagram'},
                                    {
                                        label: '桑基图描述数据流动 (一)',
                                        link: '/analysis/charts/plotly-sankey-chart'
                                    },
                                    {
                                        label: '桑基图描述数据流动 (二)',
                                        link: '/analysis/charts/echarts-sankey-chart'
                                    },
                                    {
                                        label: '带有指向的散点图描述数据变化',
                                        link: '/analysis/charts/tableau-scatter'
                                    },
                                    {
                                        label: '箱线图&小提琴图描述数据分布',
                                        link: '/analysis/charts/plotly-box-violin'
                                    },
                                    {
                                        label: '南丁格尔玫瑰图增强数据趣味性',
                                        link: '/analysis/charts/nightingale-chart'
                                    },
                                ]
                        },
                    ],
                },
                {
                    label:
                        '实用工具',
                    items:
                        [
                            {
                                label: 'Introduction', link: '/utility/utility-intro',
                                badge: {text: 'Intro', variant: 'success'},
                            },
                            {label: '工作辅助工具', link: '/utility/bookmarks-data'},
                            {label: '系统效率工具', link: '/utility/bookmarks-efficiency'},
                            {label: 'Homelab工具', link: '/utility/bookmarks-selfhosted'},
                        ]
                },
                {
                    label:
                        '个人网站',
                    items:
                        [
                            {
                                label: 'Introduction', link: '/mysite/mysite-intro',
                                badge: {text: 'Intro', variant: 'success'},
                            },
                            {
                                label:
                                    '网站构建',
                                items:
                                    [
                                        {label: '使用 Astro 框架构建个人网站', link: '/mysite/site-build'},
                                        {label: '通过 Vercel 部署网站', link: '/mysite/vercel-deploy'},
                                        {label: 'Plausible 网站分析工具', link: '/mysite/plausible'},
                                    ]
                            },
                            {
                                label:
                                    '插件与优化',
                                items:
                                    [
                                        {label: 'DocSearch 网站全文搜索', link: '/mysite/docsearch'},
                                        {label: '在文档中添加图片缩放功能', link: '/mysite/image-zoom'},
                                        {label: '自定义 Astro 文档样式', link: '/mysite/site-css'},
                                        {label: '自定义 CSS 进阶', link: '/mysite/advanced-css'},
                                    ]
                            },
                        ]
                },
                {
                    label: 'Self Hosted',
                    items: [
                        {
                            label: 'Introduction', link: '/selfhosted/homelab-intro',
                            badge: {text: 'Intro', variant: 'success'},
                        },
                        {
                            label:
                                'Bigdata',
                            items:
                                [
                                    {
                                        label: 'DolphinScheduler 调度平台',
                                        link: '/selfhosted/bigdata/dolphinscheduler-install'
                                    },
                                    {label: 'Metabase 开源BI工具', link: '/selfhosted/bigdata/metabase'},
                                    {label: 'Datalore 在线 Notebook', link: '/selfhosted/bigdata/datalore'},
                                    {label: 'Hadoop 集群部署', link: '/selfhosted/bigdata/hadoop-deploy'},
                                    {
                                        label: 'Hive on Spark 部署',
                                        link: '/selfhosted/bigdata/hive-on-spark-deploy'
                                    },
                                    {label: 'Doris 集群部署', link: '/selfhosted/bigdata/doris-deploy'},
                                ]
                        },
                        {
                            label:
                                'Services',
                            items:
                                [
                                    {label: 'Atlassian 套件', link: '/selfhosted/services/atlassian'},
                                    {label: 'Gitlab 代码仓库', link: '/selfhosted/services/gitlab'},
                                    {
                                        label: 'Vaultwarden 密码管理服务',
                                        link: '/selfhosted/services/vaultwarden'
                                    },
                                    {label: 'Authentik 身份验证服务', link: '/selfhosted/services/authentik'},
                                    {label: 'NocoDB 数据库前端', link: '/selfhosted/services/nocodb'},
                                ]
                        },
                        {
                            label:
                                'VMs',
                            items:
                                [
                                    {label: 'Proxmox PVE', link: '/selfhosted/vm/proxmox-pve'},
                                    {label: 'CUDA 虚拟机部署', link: '/selfhosted/vm/cuda-vm'},
                                    {label: 'iStoreOS 软路由', link: '/selfhosted/vm/istoreos'},
                                    {label: '黑群晖安装指南', link: '/selfhosted/vm/synology-dsm'},
                                ]
                        },
                        {
                            label: '环境配置',
                            items: [
                                {label: '替换国内镜像源', link: '/selfhosted/linux/mirror-source'},
                                {label: '必备软件包', link: '/selfhosted/linux/package-install'},
                                {label: 'NTP时间同步', link: '/selfhosted/linux/ntp'},
                                {label: 'Docker安装部署', link: '/selfhosted/linux/docker-install'},
                                {label: 'Nginx Proxy Manager', link: '/selfhosted/network/nginx-proxy-manager'},
                                {label: 'frp内网穿透', link: '/selfhosted/network/frp'},
                            ],
                        },
                    ],
                },
            ],
        }),
    ],
});
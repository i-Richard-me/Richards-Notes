import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightDocSearch from '@astrojs/starlight-docsearch';
import starlightBlog from 'starlight-blog';

// https://astro.build/config
export default defineConfig({

    // Enable sitemap generation
    site: 'https://docs.irichard.me',

    integrations: [
        starlight({
            title: 'Richard\'s Notes',
            customCss: [
                // 你的自定义 CSS 文件的相对路径
                './src/styles/custom.css',
            ],
            plugins: [
                starlightDocSearch({
                        appId: 'PBF4GAL3QH',
                        apiKey: 'cb8d1d8562fd6d9e77d1556afb91145e',
                        indexName: 'irichard',
                    },
                ),
                starlightBlog(
                    {
                        authors: {
                            richard: {
                                name: 'Richard Wang',
                                title: '博主',
                                picture: '/avatar_128x128.png',
                                url: 'https://docs.irichard.me',
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
                        'data-domain': 'docs.irichard.me',
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
                    label: 'AI与大模型',
                    items: [
                        {
                            label: 'Introduction', link: '/llm/llm-intro',
                            badge: {text: 'Intro', variant: 'success'},
                            // attrs: {style: 'font-size: var(--sl-text-base); font-weight: 600; color: var(--sl-color-white)'},
                        },
                        {
                            label:
                                '优化技巧',
                            items:
                                [
                                    {label: '示例选择器动态调整提示词', link: '/llm/optimizing/example-selector'},
                                    {label: '复杂问题分解', link: '/llm/optimizing/rag-with-decomposition'},
                                    {
                                        label: '多向量检索之假设提问',
                                        link: '/llm/optimizing/multivector-retriever-hypothetical-queries'
                                    },
                                    {label: 'ReAct模式 SQL Agent', link: '/llm/optimizing/react-sql-agent'},
                                    {label: 'Unstructured多格式数据加载', link: '/llm/optimizing/unstructured-loder'},
                                    {label: 'Unstructured按元素切分文档', link: '/llm/optimizing/unstructured-split'},
                                ]
                        },
                        {
                            label:
                                '模型应用',
                            items:
                                [
                                    {
                                        label: '提升情感分类任务准确性',
                                        link: '/llm/application/sentiment_classification'
                                    },
                                    {label: '文本分类任务中的模型效果对比', link: '/llm/application/llm_compare'},
                                    {
                                        label: '利用大模型进行实体及属性抽取',
                                        link: '/llm/application/performance-eval-analysis'
                                    },
                                    {label: '简单实现文档检索和生成', link: '/llm/application/rag_basic'},
                                    {label: '基于SQL数据库的简单问答', link: '/llm/application/sqlbot_basic'},
                                    {label: '简单构建岗位与技能知识图谱', link: '/llm/application/knowledge-graph'},
                                ]
                        },
                        {
                            label:
                                '模型部署',
                            items:
                                [
                                    {label: '大模型部署容器环境', link: '/llm/llm-docker-env'},
                                    {label: '开源大模型兼容Openai接口', link: '/llm/openai-api-for-open-llm'},
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
                                    {label: '虚构数据集', link: '/analysis/dataprocessing/fictional-dataset'},
                                ]
                        },
                        {
                            label:
                                'Tableau进阶',
                            items:
                                [
                                    {label: '可视化进阶 (一) 页面布局', link: '/analysis/tableau/tableau-layout'},
                                    {label: '可视化进阶 (二) 动态区域可见性', link: '/analysis/tableau/tableau-dynamic-area'},
                                    {label: '可视化进阶 (三) 仪表板图表联动', link: '/analysis/tableau/tableau-link'},
                                    {label: '可视化进阶 (四) 动态下钻分析', link: '/analysis/tableau/tableau-drill-down'},
                                    {label: '可视化进阶 (五) 交互式分析', link: '/analysis/tableau/tableau-interactive'},
                                ]
                        },
                        {
                            label:
                                '数据可视化',
                            items:
                                [
                                    {label: '桑基图描述数据流动 (一)', link: '/analysis/charts/plotly-sankey-chart'},
                                    {label: '箱线图&小提琴图描述数据分布', link: '/analysis/charts/plotly-box-violin'},
                                    {label: '南丁格尔玫瑰图增强数据趣味性', link: '/analysis/charts/nightingale-chart'},
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
                            {label: '数据分析工具', link: '/utility/bookmarks-data'},
                            {label: '效率工具', link: '/utility/bookmarks-efficiency'},
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
                            {label: '使用 Astro 框架构建个人网站', link: '/mysite/site-build'},
                            {label: 'Plausible 网站分析工具', link: '/mysite/plausible'},
                            {label: 'DocSearch 网站全文搜索', link: '/mysite/docsearch'},
                            {label: '自定义Astro文档样式', link: '/mysite/site-css'},
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
                                    {label: 'DolphinScheduler 调度平台', link: '/selfhosted/bigdata/dolphinscheduler-install'},
                                ]
                        },
                        {
                            label:
                                'Services',
                            items:
                                [
                                    {label: 'Milvus 向量数据库', link: '/selfhosted/services/milvus'},
                                    {label: 'Atlassian 套件', link: '/selfhosted/services/atlassian'},
                                    {label: 'Gitlab 代码仓库', link: '/selfhosted/services/gitlab'},
                                    {label: 'Vaultwarden 密码管理服务', link: '/selfhosted/services/vaultwarden'},
                                ]
                        },
                        {
                            label:
                                'VMs',
                            items:
                                [
                                    {label: 'Proxmox PVE', link: '/selfhosted/vm/proxmox-pve'},
                                    {label: 'CUDA 虚拟机部署', link: '/selfhosted/vm/cuda-vm'},
                                    {label: '黑群晖安装指南', link: '/selfhosted/vm/synology-dsm'},
                                ]
                        },
                        {
                            label: 'Linux',
                            items: [
                                {label: '替换国内镜像源', link: '/selfhosted/linux/mirror-source'},
                                {label: '必备软件包', link: '/selfhosted/linux/package-install'},
                                {label: 'NTP时间同步', link: '/selfhosted/linux/ntp'},
                                {label: 'Docker安装部署', link: '/selfhosted/linux/docker-install'},
                            ],
                        },
                        {
                            label:
                                'Network',
                            items:
                                [{label: 'Nginx Proxy Manager', link: '/selfhosted/network/nginx-proxy-manager'},
                                    {label: 'frp内网穿透', link: '/selfhosted/network/frp'},
                                ]
                        },
                    ],
                },
                // {
                //     label: 'Reference',
                //     autogenerate: {directory: 'reference'},
                // },
            ],
        }),
    ],
});
import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({

    // Enable sitemap generation
    site: 'https://docs.irichard.me',

    integrations: [
        starlight({
            title: 'My Tech Notes',
            social: {
                github: 'https://github.com/i-Richard-me/docs',
            },
            sidebar: [

                {label: 'Welcome', link: '/guides/intro/'},
                {
                    label: 'Self Hosted',
                    items: [
                        {
                            label:
                                'VMs',
                            items:
                                [{label: 'Proxmox PVE', link: '/selfhosted/vm/proxmox-pve'},
                                    {label: 'CUDA 虚拟机环境', link: '/selfhosted/vm/cuda-vm'},
                                    {label: '黑群晖', link: '/selfhosted/vm/synology-dsm'},
                                ]
                        },
                        {
                            label: 'Linux',
                            items: [
                                {label: '国内镜像源', link: '/selfhosted/linux/mirror-source'},
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
                        {
                            label:
                                'Hardware',
                            items:
                                [{label: 'IPMI 风扇转速', link: '/selfhosted/hardware/ipmi-fan'}]
                        },
                    ],
                },
                {
                    label: 'Reference',
                    autogenerate: {directory: 'reference'},
                },
            ],
        }),
    ],
});

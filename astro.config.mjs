import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'My Tech Notes',
            social: {
                github: 'https://github.com/withastro/starlight',
            },
            sidebar: [

                {label: 'Welcome', link: '/guides/intro/'},

                {
                    label: 'Linux',
                    items: [
                        {label: '国内镜像源', link: '/linux/mirror-source'},
                    ],
                },
                {
                    label: 'Self Hosted',
                    items: [
                        {
                            label:
                                'VM & Linux',
                            items:
                                [{label: 'Proxmox PVE', link: '/selfhosted/vm/proxmox-pve'},
                                    {label: 'CUDA 虚拟机', link: '/selfhosted/vm/cuda-vm'}
                                ]
                        },
                        {
                            label:
                                'Hardware',
                            items:
                                [{label: 'IPMI 风扇转速', link: '/selfhosted/hardware/ipmi-fan'}]
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
                {
                    label: 'Reference',
                    autogenerate: {directory: 'reference'},
                },
            ],
        }),
    ],
});

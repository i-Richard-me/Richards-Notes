import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'My Docs',
            social: {
                github: 'https://github.com/withastro/starlight',
            },
            sidebar: [
                {
                    label: 'Guides',
                    items: [
                        // Each item here is one entry in the navigation menu.
                        {label: 'Example Guide', link: '/guides/example/'},
                    ],
                },
                {
                    label: 'Self Hosted',
                    items: [
                        {
                            label:
                                'VM & Linux',
                            items:
                                [{label: 'Proxmox PVE', link: '/selfhosted/vm-linux/proxmox-pve'},
                                    // {label: '国内镜像源', link: '/selfhosted/mirror-source'},
                                    // {label: 'CUDA 虚拟机', link: '/selfhosted/cuda-vm'}
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
                        			// {label: 'frp内网穿透', link: '/selfhosted/frp'},
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

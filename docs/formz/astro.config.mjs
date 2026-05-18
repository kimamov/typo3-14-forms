import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	integrations: [
		starlight({
			title: 'Formz',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'guides/introduction' },
						{ label: 'Quick Start', slug: 'guides/quick-start' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Validation', slug: 'guides/validation' },
						{ label: 'Events & Hooks', slug: 'guides/events' },
						{ label: 'Plugins', slug: 'guides/plugins' },
						{ label: 'Standalone Fields', slug: 'guides/standalone-fields' },
					],
				},
				{
					label: 'TYPO3 Integration',
					items: [
						{ label: 'Setup', slug: 'guides/typo3-setup' },
						{ label: 'Multistep Forms', slug: 'guides/typo3-multistep' },
					],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
	],
});

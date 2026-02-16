import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI"',
  				'Roboto',
  				'Oxygen',
  				'Ubuntu',
  				'Cantarell',
  				'Fira Sans"',
  				'Droid Sans"',
  				'Helvetica Neue"',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono"',
  				'SF Mono"',
  				'Monaco',
  				'Menlo',
  				'Courier New"',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		typography: () => ({
  			DEFAULT: {
  				css: {
  					'--tw-prose-body': 'hsl(var(--foreground))',
  					'--tw-prose-headings': 'hsl(var(--foreground))',
  					'--tw-prose-lead': 'hsl(var(--muted-foreground))',
  					'--tw-prose-links': 'hsl(var(--primary))',
  					'--tw-prose-bold': 'hsl(var(--foreground))',
  					'--tw-prose-counters': 'hsl(var(--muted-foreground))',
  					'--tw-prose-bullets': 'hsl(var(--muted-foreground))',
  					'--tw-prose-hr': 'hsl(var(--border))',
  					'--tw-prose-quotes': 'hsl(var(--muted-foreground))',
  					'--tw-prose-quote-borders': 'hsl(var(--primary))',
  					'--tw-prose-captions': 'hsl(var(--muted-foreground))',
  					'--tw-prose-code': 'hsl(var(--foreground))',
  					'--tw-prose-pre-code': 'hsl(var(--foreground))',
  					'--tw-prose-pre-bg': 'hsl(var(--muted))',
  					'--tw-prose-th-borders': 'hsl(var(--border))',
  					'--tw-prose-td-borders': 'hsl(var(--border))',
  					'maxWidth': 'none',
  					'lineHeight': '1.8',
  					'fontSize': '0.95rem',
  					'p': {
  						marginTop: '1rem',
  						marginBottom: '1rem',
  					},
  					'h1': {
  						fontSize: '1.875rem',
  						lineHeight: '1.3',
  						fontWeight: '700',
  						marginTop: '2rem',
  						marginBottom: '1rem',
  					},
  					'h2': {
  						fontSize: '1.5rem',
  						lineHeight: '1.35',
  						fontWeight: '700',
  						marginTop: '1.75rem',
  						marginBottom: '1rem',
  						paddingBottom: '0.5rem',
  						borderBottom: '1px solid hsl(var(--border))',
  					},
  					'h3': {
  						fontSize: '1.25rem',
  						lineHeight: '1.4',
  						fontWeight: '600',
  						marginTop: '1.5rem',
  						marginBottom: '0.75rem',
  					},
  					'h4': {
  						fontSize: '1.125rem',
  						lineHeight: '1.45',
  						fontWeight: '600',
  						marginTop: '1.25rem',
  						marginBottom: '0.5rem',
  					},
  					'ul': {
  						marginTop: '1rem',
  						marginBottom: '1rem',
  						paddingLeft: '1.75rem',
  					},
  					'ol': {
  						marginTop: '1rem',
  						marginBottom: '1rem',
  						paddingLeft: '1.75rem',
  					},
  					'li': {
  						marginTop: '0.5rem',
  						marginBottom: '0.5rem',
  						lineHeight: '1.75',
  					},
  					'li p': {
  						marginTop: '0.25rem',
  						marginBottom: '0.25rem',
  					},
  					'code': {
  						backgroundColor: 'hsl(var(--muted))',
  						borderRadius: '0.25rem',
  						padding: '0.125rem 0.375rem',
  						fontSize: '0.875rem',
  						fontWeight: '500',
  						border: '1px solid hsl(var(--border))',
  					},
  					'code::before': {
  						content: '""',
  					},
  					'code::after': {
  						content: '""',
  					},
  					'pre': {
  						backgroundColor: 'hsl(var(--muted))',
  						borderRadius: '0.5rem',
  						padding: '1rem',
  						marginTop: '1rem',
  						marginBottom: '1rem',
  						border: '1px solid hsl(var(--border))',
  						lineHeight: '1.7',
  					},
  					'pre code': {
  						backgroundColor: 'transparent',
  						border: 'none',
  						padding: '0',
  						fontSize: '0.875rem',
  					},
  					'blockquote': {
  						fontStyle: 'italic',
  						borderLeftWidth: '4px',
  						borderLeftColor: 'hsl(var(--primary) / 0.5)',
  						paddingLeft: '1.25rem',
  						marginTop: '1rem',
  						marginBottom: '1rem',
  						backgroundColor: 'hsl(var(--muted) / 0.3)',
  						paddingTop: '0.25rem',
  						paddingBottom: '0.25rem',
  						borderRadius: '0 0.25rem 0.25rem 0',
  					},
  					'blockquote p': {
  						marginTop: '0.5rem',
  						marginBottom: '0.5rem',
  					},
  					'a': {
  						textUnderlineOffset: '2px',
  						'&:hover': {
  							color: 'hsl(var(--primary) / 0.8)',
  						},
  					},
  					'hr': {
  						marginTop: '2rem',
  						marginBottom: '2rem',
  					},
  					'table': {
  						marginTop: '1.25rem',
  						marginBottom: '1.25rem',
  						fontSize: '0.875rem',
  					},
  					'thead th': {
  						paddingTop: '0.625rem',
  						paddingBottom: '0.625rem',
  						paddingLeft: '1rem',
  						paddingRight: '1rem',
  					},
  					'tbody td': {
  						paddingTop: '0.625rem',
  						paddingBottom: '0.625rem',
  						paddingLeft: '1rem',
  						paddingRight: '1rem',
  					},
  				},
  			},
  		}),
  	}
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography')
  ]
}

export default config

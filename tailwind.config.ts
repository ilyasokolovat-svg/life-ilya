
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom colors for the habit tracker
				success: {
					DEFAULT: 'hsl(var(--success))',
					light: 'hsl(var(--success-light))'
				},
				warning: 'hsl(var(--warning))',
				info: 'hsl(var(--info))',
				// Category theme colors
				physical: {
					bg: 'hsl(var(--physical-bg))',
					light: 'hsl(var(--physical-light))',
					medium: 'hsl(var(--physical-medium))',
					dark: 'hsl(var(--physical-dark))'
				},
				mental: {
					bg: 'hsl(var(--mental-bg))',
					light: 'hsl(var(--mental-light))',
					medium: 'hsl(var(--mental-medium))',
					dark: 'hsl(var(--mental-dark))'
				},
				financial: {
					bg: 'hsl(var(--financial-bg))',
					light: 'hsl(var(--financial-light))',
					medium: 'hsl(var(--financial-medium))',
					dark: 'hsl(var(--financial-dark))'
				},
				skills: {
					bg: 'hsl(var(--skills-bg))',
					light: 'hsl(var(--skills-light))',
					medium: 'hsl(var(--skills-medium))',
					dark: 'hsl(var(--skills-dark))'
				},
				// Finance dashboard palette (raw hex per spec)
				'fin-bg': '#FAFAFA',
				'fin-border': '#E8E8E4',
				'fin-row': '#F0F0EE',
				'fin-primary': '#1A1A1A',
				'fin-secondary': '#6B6B6B',
				'fin-tertiary': '#A0A0A0',
				'fin-green': '#2D7D4F',
				'fin-red': '#C0392B',
				'fin-blue': '#1A56DB',
				'fin-amber': '#B45309',
			},
			fontFamily: {
				'sans-fin': ['"DM Sans"', 'system-ui', 'sans-serif'],
				'mono-fin': ['"DM Mono"', 'ui-monospace', 'monospace'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'success-pulse': {
					'0%, 100%': { 
						transform: 'scale(1)',
						opacity: '1'
					},
					'50%': { 
						transform: 'scale(1.05)', 
						opacity: '0.9'
					}
				},
				'fade-in': {
					from: { 
						opacity: '0',
						transform: 'translateY(4px)'
					},
					to: { 
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-6px)' },
					'75%': { transform: 'translateX(6px)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'success-pulse': 'success-pulse 0.5s ease-in-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'shake': 'shake 0.4s ease-in-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

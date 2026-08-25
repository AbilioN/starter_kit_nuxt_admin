import type { ThemeTypes } from '@/types/themeTypes/ThemeType';

// Original palette for this admin console — slate neutrals with a deep teal
// accent, distinct from the generic light-blue look of the base template.
// This is the pre-tenant-branding default; useTenantTheme overrides
// primary/secondary/tertiary at runtime once a tenant's branding loads.
//
// `tertiary` is declared here rather than only assigned at runtime: Vuetify
// generates the bg-*/text-* utility classes from the keys present at build
// time, so a color that only ever appears at runtime gets its CSS variable
// but no usable class.
const APP_THEME: ThemeTypes = {
    name: 'APP_THEME',
    dark: false,
    variables: {
        'border-color': '#e2e8f0'
    },
    colors: {
        primary: '#0f766e',
        secondary: '#475569',
        tertiary: '#94a3b8',
        info: '#0ea5e9',
        success: '#15803d',
        warning: '#b45309',
        error: '#dc2626',
        indigo: '#6d28d9',
        lightprimary: '#e6f4f3',
        lightinfo: '#e3f4fc',
        lightsecondary: '#eceff2',
        lightsuccess: '#e5f6ea',
        lighterror: '#fdeaea',
        lightwarning: '#fdf1e3',
        lightindigo: '#f0eafb',
        textPrimary: '#101828',
        textSecondary: '#475467',
        borderColor: '#e2e8f0',
        inputBorder: '#d7dee8',
        containerBg: '#ffffff',
        background: '#f5f7f8',
        hoverColor: '#f1f5f4',
        surface: '#ffffff',
        grey100: '#64748b',
        grey200: '#0f172a',
        darkbg: '#1e2530',
        bglight: '#f4f7f6',
        bgdark: '#0f172a'
    }
};

export { APP_THEME };

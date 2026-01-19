/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                'near-black': '#000000',
                'near-white': '#FFFFFF',
                'near-green': '#00EC97',
                'near-blue': '#5F8AFA',
                'near-red': '#FF585D',
                'near-yellow': '#F4B03E',
                'dark-bg': '#111111',
                'dark-card': '#1C1C1C',
                'dark-border': '#2A2A2A',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
        },
    },
    plugins: [],
}

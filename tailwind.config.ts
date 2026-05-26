import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        'poe-bg':           '#030a03',
        'poe-bg-mid':       '#050f05',
        'poe-bg-light':     '#071407',
        'poe-bg-panel':     '#040d04',
        'poe-green':        '#00ff41',
        'poe-green-dim':    '#7fff8f',
        'poe-green-dark':   '#009922',
        'poe-green-darker': '#005511',
        'poe-green-faint':  '#002a0a',
        'poe-amber':        '#ffb300',
        'poe-amber-dim':    '#cc8800',
        'poe-red':          '#ff2200',
        'poe-red-dim':      '#991500',
        'poe-cyan':         '#00ffcc',
        'poe-cyan-dim':     '#00aa88',
        'poe-text':         '#00ff41',
        'poe-text-dim':     '#7fff8f',
        'poe-text-mid':     '#39ff6b',
        'poe-text-dark':    '#00cc33',
        'poe-text-faint':   '#004a15',
        'poe-border':       '#00441a',
        'poe-border-bright':'#007722',
      },
      fontFamily: {
        vt323:    ['var(--font-vt323)', 'monospace'],
        'share':  ['var(--font-share)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config

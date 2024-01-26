/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [ "./src/**/*.{js,jsx,ts,tsx}" ],
  theme: {
    extend: {
      colors: {
        invarchPink: '#785EA0',
        invarchSoftPink: '#ffd1dc',
        invarchCream: '#fffaf0',
        invarchLightCream: '#f7f4e9',
        invarchDarkCream: '#e2dcd5',
        invarchRose: '#f2c6cf',
        invarchTextPink: '#d17a8d',
        invarchOffBlack: '#050505',
        // Gradient colors
        invarchGradientLightPurple: '#785EA0',
        invarchGradientPurple: '#241C3B',
        invarchGradientPink: '#E34885',
        invarchGradientYellow: '#F7CE66',
        defaultHeading: '#fffaf0', // Same as invarchCream
      },
      scrollbar: [ 'dark' ],
      backgroundImage: [ 'hover' ],
      fontFamily: {
        sans: [ "InterVariable", ...defaultTheme.fontFamily.sans ],
      },
      fontSize: {
        'xxs': '0.7rem',
      },
      keyframes: {
        colorChange: {
          '0%': { backgroundColor: '#8B5CF6' }, // purple
          '15%': { backgroundColor: '#D946EF' }, // violet
          '30%': { backgroundColor: '#F59E0B' }, // orange
          '45%': { backgroundColor: '#FCD34D' }, // amber
          '60%': { backgroundColor: '#FBBF24' }, // yellow
          '75%': { backgroundColor: '#34D399' }, // teal
          '90%': { backgroundColor: '#60A5FA' }, // light blue
          '100%': { backgroundColor: '#8B5CF6' }, // back to purple
        },
      },
      animation: {
        colorChange: 'colorChange 13s infinite',
      },
      scale: {
        '10': '.1',
        '20': '.2',
        '30': '.3',
        '40': '.4',
        '50': '.5',
        '60': '.6',
        '70': '.7',
        '80': '.8',
        '90': '.9',
        '100': '1',
        '110': '1.1',
        '120': '1.2',
        '130': '1.3',
        '140': '1.4',
        '150': '1.5',
      },
    },
  },
  plugins: [ require("@tailwindcss/forms"), require('tailwind-scrollbar'), function ({ addUtilities, theme }) {
    const newUtilities = {
      '.hover\\:gradient-text:hover': {
        background: `linear-gradient(45deg, ${ theme('colors.invarchGradientPurple') }, ${ theme('colors.invarchGradientPink') }, ${ theme('colors.invarchGradientYellow') }`,
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'transparent',
      },
    };
    addUtilities(newUtilities, [ 'responsive', 'hover' ]);
  } ],
};

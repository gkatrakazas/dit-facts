/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
				'primary': '#257b93',
        'secondary': '#36abcc'
			},
    },
  },
  plugins: [],
}
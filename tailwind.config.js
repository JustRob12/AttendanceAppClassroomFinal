module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  compiler: {
    type: 'local',
    mode: 'jit',
    web: {
      enabled: true,
      compiler: {
        type: 'local',
        mode: 'jit',
        remote: false
      }
    }
  }
} 
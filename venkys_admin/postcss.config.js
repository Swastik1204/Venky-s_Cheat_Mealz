import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

// Strip unsupported CSS Houdini @property at-rules (e.g., from some UI libs)
// to avoid "Unknown at rule: @property" warnings in the optimizer.
const stripPropertyAtRule = () => ({
  postcssPlugin: 'strip-property-atrule',
  AtRule: {
    property: (atRule) => {
      // Remove the entire @property block
      atRule.remove()
    },
  },
})
stripPropertyAtRule.postcss = true

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    stripPropertyAtRule(),
  ],
}

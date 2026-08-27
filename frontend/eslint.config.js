import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '19.0' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': ['error', { ignore: ['args', 'attach', 'position', 'rotation', 'intensity', 'transparent', 'wireframe', 'emissive', 'emissiveIntensity', 'metalness', 'roughness', 'toneMapped', 'vertexColors', 'sizeAttenuation', 'depthWrite', 'blending', 'side', 'object', 'geometry', 'material', 'dispose', 'frustumCulled', 'castShadow', 'receiveShadow', 'scale', 'visible', 'count', 'array', 'itemSize', 'color', 'opacity', 'linewidth', 'map', 'envMapIntensity', 'clearcoat', 'clearcoatRoughness', 'transmission', 'thickness', 'ior', 'distort', 'speed', 'factor', 'penumbra', 'angle', 'decay', 'distance', 'target', 'groundColor', 'fog', 'near', 'far', 'fov', 'makeDefault', 'lookAt', 'up', 'quaternion', 'matrixAutoUpdate', 'renderOrder', 'layers', 'userData'] }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]

// Learn more about Vitest configuration options at https://vitest.dev/config/

import { defineConfig } from 'vitest/config'

export default defineConfig({
  // resolve: {
  //   alias: {
  //     "ngx-quill/config": path.resolve(__dirname, "config/src/public_api.ts"),
  //     "ngx-quill": path.resolve(__dirname, "src/public_api.ts")
  //   },
  // },
  // plugins: [
  //   angular({ tsconfig: 'projects/ngx-quill/tsconfig.spec.json' }),
  //   {
  //     config: () => {
  //       return {
  //         resolve: { conditions: [...defaultClientConditions] },
  //         ssr: {
  //           resolve: {
  //             conditions: [...defaultServerConditions],
  //             externalConditions: [...defaultServerConditions]
  //           }
  //         }
  //       }
  //     },
  //     enforce: 'post',
  //     name: 'tslib-fix'
  //   }],
  test: {
    // browser: {
    //   provider: playwright(),
    //   enabled: true,
    //   headless: true,
    //   instances: [{
    //     browser: 'chromium'
    //   }]
    // },
    reporters: process.env.GITHUB_ACTIONS ?
      ['dot', 'github-actions'] :
      ['dot'],
    globals: true,
    pool: 'threads',
    css: false,
    environment: 'jsdom',
    deps: {
      optimizer: {
        web: {
          enabled: true
        }
      }
    }
  }
})

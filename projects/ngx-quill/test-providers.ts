import { EnvironmentProviders, provideCheckNoChangesConfig, provideZonelessChangeDetection } from '@angular/core'

const testProviders: EnvironmentProviders[] = [
  provideZonelessChangeDetection(),
  provideCheckNoChangesConfig({
    exhaustive: true,
    interval: 3000
  })
]

export default testProviders

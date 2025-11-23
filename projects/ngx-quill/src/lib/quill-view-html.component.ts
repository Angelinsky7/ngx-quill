import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { QuillService } from './quill.service'

import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  signal
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { combineLatest } from 'rxjs'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'quill-view-html',
  styles: [`
.ql-container.ngx-quill-view-html {
  border: 0;
}
`],
  template: `
  <div class="ql-container" [class]="themeClass()">
    <div class="ql-editor" [innerHTML]="innerHTML()">
    </div>
  </div>
`
})
export class QuillViewHTMLComponent {
  readonly content = input('')
  readonly theme = input<string | undefined>(undefined)
  readonly sanitize = input<boolean | undefined>(undefined)

  readonly innerHTML = signal<SafeHtml>('')
  readonly themeClass = signal('ql-snow')

  private readonly _sanitizer = inject(DomSanitizer)
  private readonly _service = inject(QuillService)

  constructor() {
    toObservable(this.theme).subscribe((newTheme) => {
      if (newTheme) {
        const theme = newTheme || (this._service.config.theme ? this._service.config.theme : 'snow')
        this.themeClass.set(`ql-${theme} ngx-quill-view-html`)
      } else {
        const theme = this._service.config.theme ? this._service.config.theme : 'snow'
        this.themeClass.set(`ql-${theme} ngx-quill-view-html`)
      }
    })

    combineLatest([toObservable(this.content), toObservable(this.sanitize)]).subscribe(([content, shouldSanitize]) => {
      const sanitize = [true, false].includes(shouldSanitize) ? shouldSanitize : (this._service.config.sanitize || false)
      const innerHTML = sanitize ? content : this._sanitizer.bypassSecurityTrustHtml(content)
      this.innerHTML.set(innerHTML)
    })
  }
}

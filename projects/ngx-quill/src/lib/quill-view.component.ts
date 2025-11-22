import { isPlatformServer } from '@angular/common'
import type QuillType from 'quill'

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  PendingTasks,
  Renderer2,
  SecurityContext,
  ViewEncapsulation,
  afterNextRender,
  inject,
  input
} from '@angular/core'
import { outputFromObservable, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { DomSanitizer } from '@angular/platform-browser'
import { mergeMap } from 'rxjs/operators'

import { CustomModule, CustomOption, QuillBeforeRender, QuillModules } from 'ngx-quill/config'

import { Subject } from 'rxjs'
import { getFormat, raf$ } from './helpers'
import { QuillService } from './quill.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'quill-view',
  styles: [`
.ql-container.ngx-quill-view {
  border: 0;
}
`],
  template: `
  <div quill-view-element></div>
`,
})
export class QuillViewComponent {
  readonly format = input<'object' | 'html' | 'text' | 'json' | undefined>(
    undefined
  )
  readonly theme = input<string | undefined>(undefined)
  readonly modules = input<QuillModules | undefined>(undefined)
  readonly debug = input<'warn' | 'log' | 'error' | false>(false)
  readonly formats = input<string[] | null | undefined>(undefined)
  readonly sanitize = input<boolean | undefined>(undefined)
  readonly beforeRender = input<QuillBeforeRender>()
  readonly strict = input(true)
  readonly content = input<any>()
  readonly customModules = input<CustomModule[]>([])
  readonly customOptions = input<CustomOption[]>([])

  private readonly _onEditorCreated$ = new Subject<QuillType>()
  readonly onEditorCreated = outputFromObservable(this._onEditorCreated$)

  quillEditor!: QuillType
  editorElem!: HTMLElement

  private readonly _pendingTasks = inject(PendingTasks)
  private readonly _elementRef = inject(ElementRef)
  private readonly _renderer = inject(Renderer2)
  private readonly _service = inject(QuillService)
  private readonly _sanitizer = inject(DomSanitizer)
  private readonly _platformId = inject(PLATFORM_ID)
  private readonly _destroyRef = inject(DestroyRef)

  constructor() {
    const taskCleanup = this._pendingTasks.add()

    afterNextRender(() => {
      if (isPlatformServer(this._platformId)) {
        return
      }

      const quillSubscription = this._service.getQuill().pipe(
        mergeMap((Quill) => this._service.beforeRender(Quill, this.customModules(), this.beforeRender()))
      ).subscribe(Quill => {
        const modules = Object.assign({}, this.modules() || this._service.config.modules)
        modules.toolbar = false

        this.customOptions().forEach((customOption) => {
          const newCustomOption = Quill.import(customOption.import)
          newCustomOption.whitelist = customOption.whitelist
          Quill.register(newCustomOption, true)
        })

        let debug = this.debug()
        if (!debug && debug !== false && this._service.config.debug) {
          debug = this._service.config.debug
        }

        let formats = this.formats()
        if (formats === undefined) {
          formats = this._service.config.formats ? [...this._service.config.formats] : (this._service.config.formats === null ? null : undefined)
        }
        const theme = this.theme() || (this._service.config.theme ? this._service.config.theme : 'snow')

        this.editorElem = this._elementRef.nativeElement.querySelector(
          '[quill-view-element]'
        ) as HTMLElement

        this.quillEditor = new Quill(this.editorElem, {
          debug,
          formats,
          modules,
          readOnly: true,
          strict: this.strict(),
          theme
        })

        this._renderer.addClass(this.editorElem, 'ngx-quill-view')

        if (this.content()) {
          this.valueSetter(this.quillEditor, this.content())
        }

        // The `requestAnimationFrame` triggers change detection. There's no sense to invoke the `requestAnimationFrame` if anyone is
        // listening to the `onEditorCreated` event inside the template, for instance `<quill-view (onEditorCreated)="...">`.
        if (!this._onEditorCreated$.observed) {
          taskCleanup()
          return
        }

        // The `requestAnimationFrame` will trigger change detection and `onEditorCreated` will also call `markDirty()`
        // internally, since Angular wraps template event listeners into `listener` instruction. We're using the `requestAnimationFrame`
        // to prevent the frame drop and avoid `ExpressionChangedAfterItHasBeenCheckedError` error.
        raf$().pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
          this._onEditorCreated$.next(this.quillEditor)
          taskCleanup()
        })
      })

      this._destroyRef.onDestroy(() => quillSubscription.unsubscribe())
    })

    toObservable(this.content).subscribe((content) => {
      if (!this.quillEditor) {
        return
      }

      if (content) {
        this.valueSetter(this.quillEditor, content)
      }
    })
  }

  valueSetter = (quillEditor: QuillType, value: any): any => {
    const format = getFormat(this.format(), this._service.config.format)
    let content = value
    if (format === 'text') {
      quillEditor.setText(content)
    } else {
      if (format === 'html') {
        const sanitize = [true, false].includes(this.sanitize()) ? this.sanitize() : (this._service.config.sanitize || false)
        if (sanitize) {
          value = this._sanitizer.sanitize(SecurityContext.HTML, value)
        }
        content = quillEditor.clipboard.convert({ html: value })
      } else if (format === 'json') {
        try {
          content = JSON.parse(value)
        } catch {
          content = [{ insert: value }]
        }
      }
      quillEditor.setContents(content)
    }
  }
}

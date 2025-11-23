import { isPlatformServer } from '@angular/common'
import { DomSanitizer } from '@angular/platform-browser'

import type QuillType from 'quill'
import type { QuillOptions } from 'quill'
import type DeltaType from 'quill-delta'

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  input,
  PendingTasks,
  PLATFORM_ID,
  Renderer2,
  SecurityContext,
  signal,
  ViewEncapsulation
} from '@angular/core'
import { outputFromObservable, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { fromEvent, Subject, Subscription } from 'rxjs'
import { debounceTime, mergeMap } from 'rxjs/operators'

import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator } from '@angular/forms'

import { CustomModule, CustomOption, defaultModules, QuillBeforeRender, QuillModules } from 'ngx-quill/config'

import type History from 'quill/modules/history'
import type Toolbar from 'quill/modules/toolbar'
import { getFormat, raf$ } from './helpers'
import { QuillService } from './quill.service'

export interface Range {
  index: number
  length: number
}

export interface ContentChange {
  content: DeltaType
  delta: DeltaType
  editor: QuillType
  html: string | null
  oldDelta: DeltaType
  source: string
  text: string
}

export interface SelectionChange {
  editor: QuillType
  oldRange: Range | null
  range: Range | null
  source: string
}

export interface Blur {
  editor: QuillType
  source: string
}

export interface Focus {
  editor: QuillType
  source: string
}

export type EditorChangeContent = ContentChange & { event: 'text-change' }
export type EditorChangeSelection = SelectionChange & { event: 'selection-change' }

@Directive()
export abstract class QuillEditorBase implements ControlValueAccessor, Validator {
  readonly format = input<'object' | 'html' | 'text' | 'json' | undefined>(
    undefined
  )
  readonly theme = input<string | undefined>(undefined)
  readonly modules = input<QuillModules | undefined>(undefined)
  readonly debug = input<'warn' | 'log' | 'error' | false>(false)
  readonly readOnly = input<boolean | undefined>(false)
  readonly placeholder = input<string | undefined>(undefined)
  readonly maxLength = input<number | undefined>(undefined)
  readonly minLength = input<number | undefined>(undefined)
  readonly required = input(false)
  readonly formats = input<string[] | null | undefined>(undefined)
  readonly customToolbarPosition = input<'top' | 'bottom'>('top')
  readonly sanitize = input<boolean | undefined>(undefined)
  readonly beforeRender = input<QuillBeforeRender>(undefined)
  readonly styles = input<any>(null)
  readonly registry = input<QuillOptions['registry']>(
    undefined
  )
  readonly bounds = input<HTMLElement | string | undefined>(undefined)
  readonly customOptions = input<CustomOption[]>([])
  readonly customModules = input<CustomModule[]>([])
  readonly trackChanges = input<'user' | 'all' | undefined>(undefined)
  readonly classes = input<string | undefined>(undefined)
  readonly trimOnValidation = input(false)
  readonly linkPlaceholder = input<string | undefined>(undefined)
  readonly compareValues = input(false)
  readonly filterNull = input(false)
  readonly debounceTime = input<number | undefined>(undefined)
  /*
  https://github.com/KillerCodeMonkey/ngx-quill/issues/1257 - fix null value set

  provide default empty value
  by default null

  e.g. defaultEmptyValue="" - empty string

  <quill-editor
    defaultEmptyValue=""
    formControlName="message"
  ></quill-editor>
  */
  readonly defaultEmptyValue = input<any>(null)

  private readonly _onEditorCreated$ = new Subject<QuillType>()
  readonly onEditorCreated = outputFromObservable(this._onEditorCreated$)

  private readonly _onEditorChanged$ = new Subject<EditorChangeContent | EditorChangeSelection>()
  readonly onEditorChanged = outputFromObservable(this._onEditorChanged$)

  private readonly _onContentChanged$ = new Subject<ContentChange>()
  readonly onContentChanged = outputFromObservable(this._onContentChanged$)

  private readonly _onSelectionChanged$ = new Subject<SelectionChange>()
  readonly onSelectionChanged = outputFromObservable(this._onSelectionChanged$)

  private readonly _onFocus$ = new Subject<Focus>()
  readonly onFocus = outputFromObservable(this._onFocus$)

  private readonly _onBlur$ = new Subject<Blur>()
  readonly onBlur = outputFromObservable(this._onBlur$)

  private readonly _onNativeFocus$ = new Subject<Focus>()
  readonly onNativeFocus = outputFromObservable(this._onNativeFocus$)

  private readonly _onNativeBlur$ = new Subject<Blur>()
  readonly onNativeBlur = outputFromObservable(this._onNativeBlur$)

  private _quillEditor!: QuillType
  private _editorElem!: HTMLElement
  private _content: any
  private _disabled = false // used to store initial value before ViewInit

  get quillEditor() { return this._quillEditor }

  readonly toolbarPosition = signal('top')

  private _onModelChange: (modelValue?: any) => void
  private _onModelTouched: () => void
  private _onValidatorChanged: () => void

  private _eventsSubscription: Subscription | null = null
  private _quillSubscription: Subscription | null = null

  private readonly _elementRef = inject(ElementRef)

  private readonly _domSanitizer = inject(DomSanitizer)
  private readonly _platformId = inject<string>(PLATFORM_ID)
  private readonly _renderer = inject(Renderer2)
  private readonly _service = inject(QuillService)
  private readonly _destroyRef = inject(DestroyRef)
  private readonly _pendingTasks = inject(PendingTasks)

  private _previousStyles: any
  private _previousClasses: any

  constructor() {
    toObservable(this.customToolbarPosition).subscribe((customToolbarPosition) => {
      if (this.toolbarPosition() !== customToolbarPosition) {
        this.toolbarPosition.set(customToolbarPosition)
      }
    })
    toObservable(this.readOnly).subscribe((readOnly) => this._quillEditor?.enable(readOnly))
    toObservable(this.placeholder).subscribe((placeholder) => { if (this._quillEditor) this._quillEditor.root.dataset.placeholder = placeholder })
    toObservable(this.styles).subscribe((styles) => {
      const currentStyling = styles
      const previousStyling = this._previousStyles

      if (previousStyling) {
        Object.keys(previousStyling).forEach((key: string) => {
          this._renderer.removeStyle(this._editorElem, key)
        })
      }
      if (currentStyling) {
        Object.keys(currentStyling).forEach((key: string) => {
          this._renderer.setStyle(this._editorElem, key, this.styles()[key])
        })
      }

      this._previousStyles = currentStyling
    })
    toObservable(this.classes).subscribe((classes) => {
      const currentClasses = classes
      const previousClasses = this._previousClasses

      if (previousClasses) {
        this.removeClasses(previousClasses)
      }

      if (currentClasses) {
        this.addClasses(currentClasses)
      }

      this._previousClasses = currentClasses
    })
    toObservable(this.debounceTime).subscribe((debounceTime) => {
      if (!this._quillEditor) {
        return this._quillEditor
      }
      if (debounceTime) {
        this._addQuillEventListeners()
      }
    })

    afterNextRender(() => {
      const taskCleanup = this._pendingTasks.add()

      if (isPlatformServer(this._platformId)) {
        taskCleanup()
        return
      }

      // The `quill-editor` component might be destroyed before the `quill` chunk is loaded and its code is executed
      // this will lead to runtime exceptions, since the code will be executed on DOM nodes that don't exist within the tree.

      this._quillSubscription = this._service.getQuill().pipe(
        mergeMap((Quill) => this._service.beforeRender(Quill, this.customModules(), this.beforeRender()))
      ).subscribe(Quill => {
        this._editorElem = this._elementRef.nativeElement.querySelector(
          '[quill-editor-element]'
        )

        const toolbarElem = this._elementRef.nativeElement.querySelector(
          '[quill-editor-toolbar]'
        )
        const modules = Object.assign({}, this.modules() || this._service.config.modules)

        if (toolbarElem) {
          modules.toolbar = toolbarElem
        } else if (modules.toolbar === undefined) {
          modules.toolbar = defaultModules.toolbar
        }

        let placeholder = this.placeholder() !== undefined ? this.placeholder() : this._service.config.placeholder
        if (placeholder === undefined) {
          placeholder = 'Insert text here ...'
        }

        const styles = this.styles()
        if (styles) {
          Object.keys(styles).forEach((key: string) => {
            this._renderer.setStyle(this._editorElem, key, styles[key])
          })
          this._previousStyles = styles
        }

        const classes = this.classes()
        if (classes) {
          this.addClasses(classes)
          this._previousClasses = classes
        }

        this.customOptions().forEach((customOption) => {
          const newCustomOption = Quill.import(customOption.import)
          newCustomOption.whitelist = customOption.whitelist
          Quill.register(newCustomOption, true)
        })

        let bounds = this.bounds() && this.bounds() === 'self' ? this._editorElem : this.bounds()
        if (!bounds) {
          // Can use global `document` because we execute this only in the browser.
          bounds = this._service.config.bounds ? this._service.config.bounds : document.body
        }

        let debug = this.debug()
        if (!debug && debug !== false && this._service.config.debug) {
          debug = this._service.config.debug
        }

        let readOnly = this.readOnly()
        if (!readOnly && this.readOnly() !== false) {
          readOnly = this._service.config.readOnly !== undefined ? this._service.config.readOnly : false
        }

        let formats = this.formats()
        if (!formats && formats === undefined) {
          formats = this._service.config.formats ? [...this._service.config.formats] : (this._service.config.formats === null ? null : undefined)
        }

        this._quillEditor = new Quill(this._editorElem, {
          bounds,
          debug,
          formats,
          modules,
          placeholder,
          readOnly,
          registry: this.registry(),
          theme: this.theme() || (this._service.config.theme ? this._service.config.theme : 'snow')
        })

        if (this._onNativeBlur$.observed) {
          // https://github.com/quilljs/quill/issues/2186#issuecomment-533401328
          fromEvent(this._quillEditor.scroll.domNode, 'blur').pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => this._onNativeBlur$.next({
            editor: this._quillEditor,
            source: 'dom'
          }))
          // https://github.com/quilljs/quill/issues/2186#issuecomment-803257538
          const toolbar = this._quillEditor.getModule('toolbar') as Toolbar
          if (toolbar.container) {
            fromEvent(toolbar.container, 'mousedown').pipe(takeUntilDestroyed(this._destroyRef)).subscribe(e => e.preventDefault())
          }
        }

        if (this._onNativeFocus$.observed) {
          fromEvent(this._quillEditor.scroll.domNode, 'focus').pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => this._onNativeFocus$.next({
            editor: this._quillEditor,
            source: 'dom'
          }))
        }

        // Set optional link placeholder, Quill has no native API for it so using workaround
        if (this.linkPlaceholder()) {
          const tooltip = (this._quillEditor as any)?.theme?.tooltip
          const input = tooltip?.root?.querySelector('input[data-link]')
          if (input?.dataset) {
            input.dataset.link = this.linkPlaceholder()
          }
        }

        if (this._content) {
          const format = getFormat(this.format(), this._service.config.format)

          if (format === 'text') {
            this._quillEditor.setText(this._content, 'silent')
          } else {
            const valueSetter = this.valueSetter()
            const newValue = valueSetter(this._quillEditor, this._content)
            this._quillEditor.setContents(newValue, 'silent')
          }

          const history = this._quillEditor.getModule('history') as History
          history.clear()
        }

        // initialize disabled status based on this.disabled as default value
        this.setDisabledState()

        this._addQuillEventListeners()

        // The `requestAnimationFrame` triggers change detection. There's no sense to invoke the `requestAnimationFrame` if anyone is
        // listening to the `onEditorCreated` event inside the template, for instance `<quill-view (onEditorCreated)="...">`.
        if (this._onEditorCreated$.observed == false && !this._onValidatorChanged) {
          taskCleanup()
          return
        }

        // The `requestAnimationFrame` will trigger change detection and `onEditorCreated` will also call `markDirty()`
        // internally, since Angular wraps template event listeners into `listener` instruction. We're using the `requestAnimationFrame`
        // to prevent the frame drop and avoid `ExpressionChangedAfterItHasBeenCheckedError` error.
        raf$().pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
          if (this._onValidatorChanged) {
            this._onValidatorChanged()
          }
          this._onEditorCreated$.next(this._quillEditor)
          taskCleanup()
        })
      })
    })

    this._destroyRef.onDestroy(() => {
      this._dispose()

      this._quillSubscription?.unsubscribe()
      this._quillSubscription = null
    })
  }

  static normalizeClassNames(classes: string): string[] {
    const classList = classes.trim().split(' ')
    return classList.reduce((prev: string[], cur: string) => {
      const trimmed = cur.trim()
      if (trimmed) {
        prev.push(trimmed)
      }

      return prev
    }, [])
  }

  valueGetter = input((quillEditor: QuillType): string | any => {
    let html: string | null = quillEditor.getSemanticHTML()
    if (this._isEmptyValue(html)) {
      html = this.defaultEmptyValue()
    }
    let modelValue: string | DeltaType | null = html
    const format = getFormat(this.format(), this._service.config.format)

    if (format === 'text') {
      modelValue = quillEditor.getText()
    } else if (format === 'object') {
      modelValue = quillEditor.getContents()
    } else if (format === 'json') {
      try {
        modelValue = JSON.stringify(quillEditor.getContents())
      } catch {
        modelValue = quillEditor.getText()
      }
    }

    return modelValue
  })

  valueSetter = input((quillEditor: QuillType, value: any): any => {
    const format = getFormat(this.format(), this._service.config.format)
    if (format === 'html') {
      const sanitize = [true, false].includes(this.sanitize()) ? this.sanitize() : (this._service.config.sanitize || false)
      if (sanitize) {
        value = this._domSanitizer.sanitize(SecurityContext.HTML, value)
      }
      return quillEditor.clipboard.convert({ html: value })
    } else if (format === 'json') {
      try {
        return JSON.parse(value)
      } catch {
        return [{ insert: value }]
      }
    }

    return value
  })

  selectionChangeHandler = (range: Range | null, oldRange: Range | null, source: string) => {
    const trackChanges = this.trackChanges() || this._service.config.trackChanges
    const shouldTriggerOnModelTouched = !range && !!this._onModelTouched && (source === 'user' || trackChanges && trackChanges === 'all')

    // only emit changes when there's any listener
    if (
      !this._onBlur$.observed &&
      !this._onFocus$.observed &&
      !this._onSelectionChanged$.observed &&
      !shouldTriggerOnModelTouched
    ) {
      return
    }

    if (range === null) {
      this._onBlur$.next({
        editor: this._quillEditor,
        source
      })
    } else if (oldRange === null) {
      this._onFocus$.next({
        editor: this._quillEditor,
        source
      })
    }

    this._onSelectionChanged$.next({
      editor: this._quillEditor,
      oldRange,
      range,
      source
    })

    if (shouldTriggerOnModelTouched) {
      this._onModelTouched()
    }
  }

  textChangeHandler = (delta: DeltaType, oldDelta: DeltaType, source: string): void => {
    // only emit changes emitted by user interactions
    const text = this._quillEditor.getText()
    const content = this._quillEditor.getContents()

    let html: string | null = this._quillEditor.getSemanticHTML()
    if (this._isEmptyValue(html)) {
      html = this.defaultEmptyValue()
    }

    const trackChanges = this.trackChanges() || this._service.config.trackChanges
    const shouldTriggerOnModelChange = (source === 'user' || trackChanges && trackChanges === 'all') && !!this._onModelChange

    // only emit changes when there's any listener
    if (!this._onContentChanged$.observed && !shouldTriggerOnModelChange) {
      return
    }

    if (shouldTriggerOnModelChange) {
      const valueGetter = this.valueGetter()
      this._onModelChange(
        valueGetter(this._quillEditor)
      )
    }

    this._onContentChanged$.next({
      content,
      delta,
      editor: this._quillEditor,
      html,
      oldDelta,
      source,
      text
    })
  }

  editorChangeHandler = (
    event: 'text-change' | 'selection-change',
    current: any | Range | null, old: any | Range | null, source: string
  ): void => {
    // only emit changes when there's any listener
    if (!this._onEditorChanged$.observed) {
      return
    }

    // only emit changes emitted by user interactions
    if (event === 'text-change') {
      const text = this._quillEditor.getText()
      const content = this._quillEditor.getContents()

      let html: string | null = this._quillEditor.getSemanticHTML()
      if (this._isEmptyValue(html)) {
        html = this.defaultEmptyValue()
      }

      this._onEditorChanged$.next({
        content,
        delta: current,
        editor: this._quillEditor,
        event,
        html,
        oldDelta: old,
        source,
        text
      })
    } else {
      this._onEditorChanged$.next({
        editor: this._quillEditor,
        event,
        oldRange: old,
        range: current,
        source
      })
    }
  }

  addClasses(classList: string): void {
    QuillEditorBase.normalizeClassNames(classList).forEach((c: string) => {
      this._renderer.addClass(this._editorElem, c)
    })
  }

  removeClasses(classList: string): void {
    QuillEditorBase.normalizeClassNames(classList).forEach((c: string) => {
      this._renderer.removeClass(this._editorElem, c)
    })
    console.log('remov', classList)
  }

  writeValue(currentValue: any) {
    // optional fix for https://github.com/angular/angular/issues/14988
    if (this.filterNull() && currentValue === null) {
      return
    }

    this._content = currentValue

    if (!this._quillEditor) {
      return
    }

    const format = getFormat(this.format(), this._service.config.format)
    const valueSetter = this.valueSetter()
    const newValue = valueSetter(this._quillEditor, currentValue)

    if (this.compareValues()) {
      const currentEditorValue = this._quillEditor.getContents()
      if (JSON.stringify(currentEditorValue) === JSON.stringify(newValue)) {
        return
      }
    }

    if (currentValue) {
      if (format === 'text') {
        this._quillEditor.setText(currentValue)
      } else {
        this._quillEditor.setContents(newValue)
      }
      return
    }
    this._quillEditor.setText('')

  }

  setDisabledState(isDisabled: boolean = this._disabled): void {
    // store initial value to set appropriate disabled status after ViewInit
    this._disabled = isDisabled
    if (this._quillEditor) {
      if (isDisabled) {
        this._quillEditor.disable()
        this._renderer.setAttribute(this._elementRef.nativeElement, 'disabled', 'disabled')
      } else {
        if (!this.readOnly()) {
          this._quillEditor.enable()
        }
        this._renderer.removeAttribute(this._elementRef.nativeElement, 'disabled')
      }
    }
  }

  registerOnChange(fn: (modelValue: any) => void): void {
    this._onModelChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this._onModelTouched = fn
  }

  registerOnValidatorChange(fn: () => void) {
    this._onValidatorChanged = fn
  }

  validate() {
    if (!this._quillEditor) {
      return null
    }

    const err: {
      minLengthError?: {
        given: number
        minLength: number
      }
      maxLengthError?: {
        given: number
        maxLength: number
      }
      requiredError?: { empty: boolean }
    } = {}
    let valid = true

    const text = this._quillEditor.getText()
    // trim text if wanted + handle special case that an empty editor contains a new line
    const textLength = this.trimOnValidation() ? text.trim().length : (text.length === 1 && text.trim().length === 0 ? 0 : text.length - 1)
    const deltaOperations = this._quillEditor.getContents().ops
    const onlyEmptyOperation = !!deltaOperations && deltaOperations.length === 1 && ['\n', ''].includes(deltaOperations[0].insert?.toString())

    if (this.minLength() && textLength && textLength < this.minLength()) {
      err.minLengthError = {
        given: textLength,
        minLength: this.minLength()
      }

      valid = false
    }

    if (this.maxLength() && textLength > this.maxLength()) {
      err.maxLengthError = {
        given: textLength,
        maxLength: this.maxLength()
      }

      valid = false
    }

    if (this.required() && !textLength && onlyEmptyOperation) {
      err.requiredError = {
        empty: true
      }

      valid = false
    }

    return valid ? null : err
  }

  private _addQuillEventListeners(): void {
    this._dispose()

    this._eventsSubscription = new Subscription()
    this._eventsSubscription.add(
      // mark model as touched if editor lost focus
      fromEvent(this.quillEditor, 'selection-change').subscribe(
        ([range, oldRange, source]) => {
          this.selectionChangeHandler(range as any, oldRange as any, source)
        }
      )
    )

    // The `fromEvent` supports passing JQuery-style event targets, the editor has `on` and `off` methods which
    // will be invoked upon subscription and teardown.
    let textChange$ = fromEvent(this.quillEditor, 'text-change')
    let editorChange$ = fromEvent(this.quillEditor, 'editor-change')

    if (typeof this.debounceTime() === 'number') {
      textChange$ = textChange$.pipe(debounceTime(this.debounceTime()))
      editorChange$ = editorChange$.pipe(debounceTime(this.debounceTime()))
    }

    this._eventsSubscription.add(
      // update model if text changes
      textChange$.subscribe(([delta, oldDelta, source]) => {
        this.textChangeHandler(delta as any, oldDelta as any, source)
      })
    )

    this._eventsSubscription.add(
      // triggered if selection or text changed
      editorChange$.subscribe(([event, current, old, source]) => {
        this.editorChangeHandler(event as 'text-change' | 'selection-change', current, old, source)
      })
    )
  }

  private _dispose(): void {
    this._eventsSubscription?.unsubscribe()
    this._eventsSubscription = null
  }

  private _isEmptyValue(html: string | null) {
    return html === '<p></p>' || html === '<div></div>' || html === '<p><br></p>' || html === '<div><br></div>'
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuillEditorComponent)
    },
    {
      multi: true,
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => QuillEditorComponent)
    }
  ],
  selector: 'quill-editor',
  template: `
    @if (toolbarPosition() !== 'top') {
        <div quill-editor-element></div>
    }

    <ng-content select="[above-quill-editor-toolbar]"></ng-content>
    <ng-content select="[quill-editor-toolbar]"></ng-content>
    <ng-content select="[below-quill-editor-toolbar]"></ng-content>

    @if (toolbarPosition() === 'top') {
        <div quill-editor-element></div>
    }
  `,
  styles: [
    `
    :host {
      display: inline-block;
    }
    `
  ]
})
export class QuillEditorComponent extends QuillEditorBase { }

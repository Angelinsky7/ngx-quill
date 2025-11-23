import { ComponentFixture, TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, MockInstance } from 'vitest'

import { QuillEditorComponent } from './quill-editor.component'

import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { provideQuillConfig, QuillConfig } from 'ngx-quill/config'
import Quill from 'quill'
import { defer } from 'rxjs'
import { QuillModule } from './quill.module'

class CustomModule {
  quill: Quill
  options: any

  constructor(quill: Quill, options: any) {
    this.quill = quill
    this.options = options
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuillModule, FormsModule],
  selector: 'quill-test',
  template: `
<quill-editor
  (onBlur)="blured = true"
  (onFocus)="focused = true"
  (onNativeBlur)="bluredNative = true"
  (onNativeFocus)="focusedNative = true"
  [(ngModel)]="title"
  [customOptions]="[{import: 'attributors/style/size', whitelist: ['14']}]"
  [styles]="style"
  [required]="required"
  [minLength]="minLength"
  [maxLength]="maxLength"
  [readOnly]="isReadOnly"
  [debounceTime]="debounceTime"
  [trimOnValidation]="trimOnValidation"
  (onEditorCreated)="handleEditorCreated($event)"
  (onEditorChanged)="handleEditorChange($event)"
  (onContentChanged)="handleChange($event)"
  (onSelectionChanged)="handleSelection($event)"
  (onValidatorChanged)="handleValidatorChange($event)"
></quill-editor>
`
})
class TestComponent {
  @ViewChild(QuillEditorComponent, { static: true }) editorComponent!: QuillEditorComponent
  title: any = 'Hallo'
  isReadOnly = false
  required = false
  minLength = 0
  focused = false
  blured = false
  focusedNative = false
  bluredNative = false
  trimOnValidation = false
  maxLength = 0
  style: {
    backgroundColor?: string
    color?: string
    height?: string
  } | null = { height: '30px' }
  editor: any
  debounceTime: number

  changed: any
  changedEditor: any
  selected: any
  validator: any

  handleEditorCreated(event: any) {
    this.editor = event
  }

  handleChange(event: any) {
    this.changed = event
  }

  handleEditorChange(event: any) {
    this.changedEditor = event
  }

  handleSelection(event: any) {
    this.selected = event
  }

  handleValidatorChange(event: any) {
    this.validator = event
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, QuillModule],
  selector: 'quill-toolbar-test',
  template: `
<quill-editor
  [customToolbarPosition]="toolbarPosition"
  [(ngModel)]="title" [required]="true"
  [minLength]="minLength"
  [maxLength]="maxLength"
  [readOnly]="isReadOnly"
  (onEditorCreated)="handleEditorCreated()"
  (onContentChanged)="handleChange()"
>
  <div quill-editor-toolbar="true">
    <span class="ql-formats">
      <button class="ql-bold" [title]="'Bold'"></button>
    </span>
    <span class="ql-formats">
      <select class="ql-align" [title]="'Aligment'">
        <option selected></option>
        <option value="center"></option>
        <option value="right"></option>
        <option value="justify"></option>
      </select>
      <select class="ql-align">
        <option selected></option>
        <option value="center"></option>
        <option value="right"></option>
        <option value="justify"></option>
      </select>
    </span>
  </div>
  <div above-quill-editor-toolbar="true">
    <span>above</span>
  </div>
  <div below-quill-editor-toolbar="true">
    <span>below</span>
  </div>
</quill-editor>
`
})
class TestToolbarComponent {
  title = 'Hallo'
  isReadOnly = false
  minLength = 0
  maxLength = 0
  toolbarPosition = 'top'

  handleEditorCreated() { return }
  handleChange() { return }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuillModule, ReactiveFormsModule, FormsModule],
  selector: 'quill-reactive-test',
  template: `
    <quill-editor [formControl]='formControl' [minLength]='minLength'></quill-editor>
`
})
class ReactiveFormTestComponent {
  @ViewChild(QuillEditorComponent, { static: true }) editor!: QuillEditorComponent
  formControl: FormControl = new FormControl('a')
  minLength = 3
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuillModule],
  selector: 'quill-module-test',
  template: `
    <quill-editor [modules]="{custom: true}" [customModules]="[{path: 'modules/custom', implementation: impl}]"></quill-editor>
`
})
class CustomModuleTestComponent {
  @ViewChild(QuillEditorComponent, { static: true }) editor!: QuillEditorComponent
  impl = CustomModule
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuillModule],
  selector: 'quill-async-module-test',
  template: `
    <quill-editor [modules]="{custom: true}" [customModules]="customModules"></quill-editor>
`
})
class CustomAsynchronousModuleTestComponent {
  @ViewChild(QuillEditorComponent, { static: true }) editor!: QuillEditorComponent
  customModules = [
    {
      path: 'modules/custom',
      implementation: defer(() => Promise.resolve(CustomModule))
    }
  ]
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuillModule, FormsModule],
  selector: 'quill-link-placeholder-test',
  template: `
    <quill-editor [ngModel]="content" [linkPlaceholder]="'https://test.de'"></quill-editor>
`
})
class CustomLinkPlaceholderTestComponent {
  @ViewChild(QuillEditorComponent, { static: true }) editor!: QuillEditorComponent
  content = ''
}

describe('Basic QuillEditorComponent', () => {
  let fixture: ComponentFixture<QuillEditorComponent>
  let component: QuillEditorComponent

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [QuillEditorComponent]
    })
    fixture = TestBed.createComponent(QuillEditorComponent)
    component = fixture.componentInstance

    fixture.autoDetectChanges()
    await fixture.whenStable()
  })

  // beforeEach(async () => {
  //   await vi.waitUntil(() => !!component.quillEditor)
  //   fixture.detectChanges()
  // })

  test('ngOnDestroy - removes listeners', async () => {
    const spy = vi.spyOn(component.quillEditor, 'off')

    fixture.destroy()
    await fixture.whenStable()

    expect(spy).toHaveBeenCalledTimes(3)
    const quillEditor: any = component.quillEditor
    expect(quillEditor.emitter._events['editor-change'].length).toBe(4)
    expect(quillEditor.emitter._events['selection-change']).toBeInstanceOf(Object)
    expect(quillEditor.emitter._events['text-change']).toBeFalsy()
  })

  test('should render toolbar', async () => {
    const element = fixture.nativeElement
    expect(element.querySelectorAll('div.ql-toolbar.ql-snow').length).toBe(1)
    expect(component.quillEditor).toBeDefined()
  })

  test('should render text div', async () => {
    const element = fixture.nativeElement
    expect(element.querySelectorAll('div.ql-container.ql-snow').length).toBe(1)
    expect(component.quillEditor).toBeDefined()
  })
})

describe('Formats', () => {
  describe('object', () => {
    @Component({
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [QuillModule, FormsModule],
      template: `
    <quill-editor [(ngModel)]="title" format="object" (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
    `
    })
    class ObjectComponent {
      title = signal<any>([{
        insert: 'Hello'
      }])
      editor: any

      handleEditorCreated(event: any) {
        this.editor = event
      }
    }

    let fixture: ComponentFixture<ObjectComponent>
    let component: ObjectComponent

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [provideQuillConfig({})],
        imports: [ObjectComponent]
      })
      fixture = TestBed.createComponent(ObjectComponent, {}) as ComponentFixture<ObjectComponent>
      component = fixture.componentInstance

      fixture.autoDetectChanges()
      await fixture.whenStable()
    })

    test('should be set object', async () => {
      expect(JSON.stringify(component.editor.getContents())).toEqual(JSON.stringify({ ops: [{ insert: 'Hello\n' }] }))
    })

    test('should update text', async () => {
      component.title.set([{ insert: '1234' }])
      await fixture.whenStable()
      expect(JSON.stringify(component.editor.getContents())).toEqual(JSON.stringify({ ops: [{ insert: '1234\n' }] }))
    })

    test('should update model if editor text changes', async () => {
      component.editor.setContents([{ insert: '123' }], 'user')
      await fixture.whenStable()
      expect(JSON.stringify(component.title())).toEqual(JSON.stringify({ ops: [{ insert: '123\n' }] }))
    })
  })

  describe('html', () => {
    @Component({
      imports: [QuillModule, FormsModule],
      template: `
    <quill-editor [(ngModel)]="title" format="html" (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
    `
    })
    class HTMLComponent {
      title = signal<string>('<p>Hallo<ol><li>ordered</li></ol><ul><li>unordered</li></ul></p>')
      editor: any

      handleEditorCreated(event: any) {
        this.editor = event
      }
    }

    @Component({
      imports: [QuillModule, FormsModule],
      template: `
    <quill-editor [(ngModel)]="title" [sanitize]="true" format="html" (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
    `
    })
    class HTMLSanitizeComponent {
      title = signal<string>('<p>Hallo <img src="wroooong.jpg" onerror="window.alert(\'sanitize me\')"></p>')
      editor: any

      handleEditorCreated(event: any) {
        this.editor = event
      }
    }

    let fixture: ComponentFixture<HTMLComponent>
    let component: HTMLComponent

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [provideQuillConfig({})],
        imports: [HTMLComponent]
      })
      fixture = TestBed.createComponent(HTMLComponent)
      component = fixture.componentInstance

      fixture.autoDetectChanges()
      await fixture.whenStable()
    })

    test('should be set html', async () => {
      expect(component.editor.getText().trim()).toEqual(`Hallo
ordered
unordered`)
    })

    test('should update html', async () => {
      component.title.set('<p>test</p>')
      await fixture.whenStable()
      expect(component.editor.getText().trim()).toEqual('test')
    })

    test('should update model if editor html changes', async () => {
      expect(component.title().trim()).toEqual('<p>Hallo<ol><li>ordered</li></ol><ul><li>unordered</li></ul></p>')
      component.editor.setText('1234', 'user')
      await fixture.whenStable()
      expect(component.title().trim()).toEqual('<p>1234</p>')
    })

    test('should sanitize html', async () => {
      const sanfixture = TestBed.createComponent(HTMLSanitizeComponent) as ComponentFixture<HTMLSanitizeComponent>
      const incomponent = sanfixture.componentInstance
      sanfixture.autoDetectChanges()
      await sanfixture.whenStable()

      expect(JSON.stringify(incomponent.editor.getContents()))
        .toEqual(JSON.stringify({ ops: [{ insert: 'Hallo ' }, { insert: { image: 'wroooong.jpg' } }, { insert: '\n' }] }))

      incomponent.title.set('<p><img src="xxxx" onerror="window.alert()"></p>')
      await sanfixture.whenStable()
      expect(JSON.stringify(incomponent.editor.getContents())).toEqual(JSON.stringify({ ops: [{ insert: { image: 'xxxx' } }, { insert: '\n' }] }))
    })
  })

  describe('text', () => {
    @Component({
      imports: [QuillModule, FormsModule],
      template: `
    <quill-editor [(ngModel)]="title" format="text" (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
    `
    })
    class TextComponent {
      title = signal<string>('Hallo')
      editor: any

      handleEditorCreated(event: any) {
        this.editor = event
      }
    }

    let fixture: ComponentFixture<TextComponent>
    let component: TextComponent

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [provideQuillConfig({})],
        imports: [TextComponent],
      })
      fixture = TestBed.createComponent(TextComponent)
      component = fixture.componentInstance

      fixture.autoDetectChanges()
      await fixture.whenStable()
    })

    test('should be set text', async () => {
      expect(component.editor.getText().trim()).toEqual('Hallo')
    })

    test('should update text', async () => {
      component.title.set('test')
      await fixture.whenStable()
      expect(component.editor.getText().trim()).toEqual('test')
    })

    test('should update model if editor text changes', async () => {
      component.editor.setText('123', 'user')
      await fixture.whenStable()
      expect(component.title().trim()).toEqual('123')
    })

    test('should not update model if editor content changed by api', async () => {
      component.editor.setText('123')
      fixture.detectChanges()
      await fixture.whenStable()
      expect(component.title().trim()).toEqual('Hallo')
    })
  })

  describe('json', () => {
    @Component({
      imports: [QuillModule, FormsModule],
      selector: 'json-valid',
      template: `
    <quill-editor [(ngModel)]="title" format="json" (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
    `
    })
    class JSONComponent {
      title = signal<string>(JSON.stringify([{
        insert: 'Hallo'
      }]))
      editor: any

      handleEditorCreated(event: any) {
        this.editor = event
      }
    }

    @Component({
      imports: [QuillModule, FormsModule],
      selector: 'quill-json-invalid',
      template: `
    <quill-editor [(ngModel)]="title" format="json" (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
    `
    })
    class JSONInvalidComponent {
      title = signal<string>(JSON.stringify([{
        insert: 'Hallo'
      }]) + '{')
      editor: any

      handleEditorCreated(event: any) {
        this.editor = event
      }
    }

    let fixture: ComponentFixture<JSONComponent>
    let component: JSONComponent

    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [provideQuillConfig({})],
        imports: [JSONComponent]
      })
      fixture = TestBed.createComponent(JSONComponent)
      component = fixture.componentInstance

      fixture.autoDetectChanges()
      await fixture.whenStable()
    })

    test('should set json string', async () => {
      expect(JSON.stringify(component.editor.getContents())).toEqual(JSON.stringify({ ops: [{ insert: 'Hallo\n' }] }))
    })

    test('should update json string', async () => {
      component.title.set(JSON.stringify([{
        insert: 'Hallo 123'
      }]))
      await fixture.whenStable()
      expect(JSON.stringify(component.editor.getContents())).toEqual(JSON.stringify({ ops: [{ insert: 'Hallo 123\n' }] }))
    })

    test('should update model if editor changes', async () => {
      component.editor.setContents([{
        insert: 'Hallo 123'
      }], 'user')
      await fixture.whenStable()
      expect(component.title()).toEqual(JSON.stringify({ ops: [{ insert: 'Hallo 123\n' }] }))
    })

    test('should set as text if invalid JSON', async () => {
      const infixture = TestBed.createComponent(JSONInvalidComponent) as ComponentFixture<JSONInvalidComponent>
      const incomponent = infixture.componentInstance
      infixture.autoDetectChanges()
      await infixture.whenStable()

      expect(incomponent.editor.getText().trim()).toEqual(JSON.stringify([{
        insert: 'Hallo'
      }]) + '{')

      incomponent.title.set(JSON.stringify([{
        insert: 'Hallo 1234'
      }]) + '{')
      await infixture.whenStable()
      expect(incomponent.editor.getText().trim()).toEqual(JSON.stringify([{
        insert: 'Hallo 1234'
      }]) + '{')
    })
  })
})

describe('Dynamic styles', () => {
  @Component({
    imports: [QuillModule, FormsModule],
    template: `
  <quill-editor
    [bounds]="'self'"
    [(ngModel)]="title"
    format="text"
    [styles]="style()"
    (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
  `
  })
  class StylingComponent {
    title = signal<string>('Hallo')
    style = signal({
      backgroundColor: 'red'
    })
    editor: any

    handleEditorCreated(event: any) {
      this.editor = event
    }
  }

  let fixture: ComponentFixture<StylingComponent>
  let component: StylingComponent

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [StylingComponent],
    })
    fixture = TestBed.createComponent(StylingComponent)
    component = fixture.componentInstance

    fixture.autoDetectChanges()
    await fixture.whenStable()
  })

  test('set inital styles', async () => {
    expect(component.editor.container.style.backgroundColor).toEqual('red')
  })

  test('set style', async () => {
    component.style.set({
      backgroundColor: 'gray'
    })
    await fixture.whenStable()
    expect(component.editor.container.style.backgroundColor).toEqual('gray')
  })
})

describe('Dynamic classes', () => {
  @Component({
    imports: [QuillModule, FormsModule],
    template: `
  <quill-editor
    [bounds]="'self'"
    [(ngModel)]="title"
    format="text"
    [classes]="classes()"
    (onEditorCreated)="handleEditorCreated($event)"></quill-editor>
  `
  })
  class ClassesComponent {
    title = signal<string>('Hallo')
    classes = signal<string>('test-class1 test-class2')
    editor: any

    handleEditorCreated(event: any) {
      this.editor = event
    }
  }

  let fixture: ComponentFixture<ClassesComponent>
  let component: ClassesComponent

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [ClassesComponent],
    })
    fixture = TestBed.createComponent(ClassesComponent)
    component = fixture.componentInstance

    fixture.autoDetectChanges()
    await fixture.whenStable()
  })

  test('should set initial classes', async () => {
    expect(component.editor.container.classList.contains('test-class1')).toBe(true)
    expect(component.editor.container.classList.contains('test-class2')).toBe(true)
  })

  test('should set class', async () => {
    component.classes.set('test-class2 test-class3')
    await fixture.whenStable()

    console.log(component.editor.container.classList)
    expect(component.editor.container.classList.contains('test-class1')).toBe(false)
    expect(component.editor.container.classList.contains('test-class2')).toBe(true)
    expect(component.editor.container.classList.contains('test-class3')).toBe(true)
  })
})

describe('class normalization function', () => {
  test('should trim white space', () => {
    const classList = QuillEditorComponent.normalizeClassNames('test-class  ')
    expect(classList).toEqual(['test-class'])
  })

  test('should not return empty strings as class names', () => {
    const classList = QuillEditorComponent.normalizeClassNames('test-class   test-class2')
    expect(classList).toEqual(['test-class', 'test-class2'])
  })
})

describe('Reactive forms integration', () => {
  let fixture: ComponentFixture<ReactiveFormTestComponent>
  let component: ReactiveFormTestComponent

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [ReactiveFormTestComponent],
    })
    fixture = TestBed.createComponent(ReactiveFormTestComponent)
    component = fixture.componentInstance

    fixture.autoDetectChanges()
    await fixture.whenStable()
  })

  test('should be disabled', () => {
    component.formControl.disable()
    expect((component.editor.quillEditor as any).container.classList.contains('ql-disabled')).toBeTruthy()
  })

  test('has "disabled" attribute', () => {
    component.formControl.disable()
    expect(fixture.nativeElement.children[0].attributes.disabled).toBeDefined()
  })

  test('should re-enable', () => {
    component.formControl.disable()
    component.formControl.enable()

    expect((component.editor.quillEditor as any).container.classList.contains('ql-disabled')).toBeFalsy()
    expect(fixture.nativeElement.children[0].attributes.disabled).not.toBeDefined()
  })

  test('should leave form pristine when content of editor changed programmatically', async () => {
    const values: (string | null)[] = []
    fixture.componentInstance.formControl.valueChanges.subscribe((value: string) => values.push(value))
    fixture.componentInstance.formControl.patchValue('1234')

    // fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.nativeElement.querySelector('div.ql-editor').textContent).toEqual('1234')
    expect(fixture.componentInstance.formControl.value).toEqual('1234')
    expect(fixture.componentInstance.formControl.pristine).toBeTruthy()
    expect(values).toEqual(['1234'])
  })

  test('should mark form dirty when content of editor changed by user', async () => {
    fixture.componentInstance.editor.quillEditor.setText('1234', 'user')

    // fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.nativeElement.querySelector('div.ql-editor').textContent).toEqual('1234')
    expect(fixture.componentInstance.formControl.dirty).toBeTruthy()
    expect(fixture.componentInstance.formControl.value).toEqual('<p>1234</p>')
  })

  test('should validate initial content and do not mark it as invalid', async () => {
    expect(fixture.nativeElement.querySelector('div.ql-editor').textContent).toEqual('a')
    expect(fixture.componentInstance.formControl.pristine).toBeTruthy()
    expect(fixture.componentInstance.formControl.value).toEqual('a')
    expect(fixture.componentInstance.formControl.invalid).toBeTruthy()
  })

  test('should write the defaultEmptyValue when editor is emptied', async () => {
    fixture.componentInstance.editor.quillEditor.setText('', 'user')

    // fixture.detectChanges()
    await fixture.whenStable()

    // default empty value is null
    expect(fixture.componentInstance.formControl.value).toEqual(null)
  })
})

describe('Advanced QuillEditorComponent', () => {
  let fixture: ComponentFixture<TestComponent>
  let component: TestComponent
  let importSpy: MockInstance
  let registerSpy: MockInstance
  let handleEditorCreatedSpy: MockInstance

  beforeAll(() => {
    importSpy = vi.spyOn(Quill, 'import')
    registerSpy = vi.spyOn(Quill, 'register')
  })

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [FormsModule, TestComponent],
    })
    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance

    fixture.autoDetectChanges()
    await fixture.whenStable()

    handleEditorCreatedSpy = vi.spyOn(fixture.componentInstance, 'handleEditorCreated')

    expect(importSpy).toBeCalled()
    expect(registerSpy).toBeCalled()
    expect(handleEditorCreatedSpy).toBeCalled()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should set editor settings', async () => {
    const editorElem = fixture.debugElement.children[0]
    const editorCmp = fixture.debugElement.children[0].componentInstance

    expect(editorCmp.readOnly()).toBe(false)

    component.isReadOnly = true

    expect(Quill.import).toHaveBeenCalledWith('attributors/style/size')
    expect(Quill.register).toHaveBeenCalled()

    // fixture.detectChanges()
    await fixture.whenStable()

    expect(editorCmp.readOnly()).toBe(true)
    expect(editorElem.nativeElement.querySelectorAll('div.ql-container.ql-disabled').length).toBe(1)
    expect(editorElem.nativeElement.querySelector('div[quill-editor-element]').style.height).toBe('30px')
  })

  test('should update editor style', async () => {
    const editorElem = fixture.debugElement.children[0]

    component.style = { backgroundColor: 'red' }
    // fixture.detectChanges()
    await fixture.whenStable()

    expect(editorElem.nativeElement.querySelector('div[quill-editor-element]').style.backgroundColor).toBe('red')
    expect(editorElem.nativeElement.querySelector('div[quill-editor-element]').style.height).toEqual('')
  })

  test('should update editor style to null and readd styling', async () => {
    const editorElem = fixture.debugElement.children[0]

    component.style = null
    // fixture.detectChanges()
    await fixture.whenStable()

    component.style = { color: 'red' }
    expect(editorElem.nativeElement.querySelector('div[quill-editor-element]').style.height).toEqual('')

    // fixture.detectChanges()
    await fixture.whenStable()

    expect(editorElem.nativeElement.querySelector('div[quill-editor-element]').style.color).toBe('red')
  })

  test('should not update editor style if nothing changed', async () => {
    const editorElem = fixture.debugElement.children[0]

    component.isReadOnly = true
    // fixture.detectChanges()
    await fixture.whenStable()

    expect(editorElem.nativeElement.querySelector('div[quill-editor-element]').style.height).toEqual('30px')
  })

  test('should set touched state correctly', async () => {
    const editorFixture = fixture.debugElement.children[0]

    editorFixture.componentInstance.quillEditor.setSelection(0, 5)
    // fixture.detectChanges()
    await fixture.whenStable()
    editorFixture.componentInstance.quillEditor.setSelection(null)
    // fixture.detectChanges()
    await fixture.whenStable()

    expect(editorFixture.nativeElement.className).toMatch('ng-untouched')

    editorFixture.componentInstance.quillEditor.setSelection(0, 5, 'user')
    // fixture.detectChanges()
    await fixture.whenStable()
    editorFixture.componentInstance.quillEditor.setSelection(null, 'user')
    // fixture.detectChanges()
    await fixture.whenStable()

    expect(editorFixture.nativeElement.className).toMatch('ng-touched')
  })

  test('should set required state correctly', async () => {
    // get editor component
    const editorElement = fixture.debugElement.children[0].nativeElement

    fixture.componentInstance.title = ''
    // fixture.detectChanges()
    await fixture.whenStable()
    expect(editorElement.className).toMatch('ng-valid')
  })

  test('should emit onEditorCreated with editor instance', async () => {
    const editorComponent = fixture.debugElement.children[0].componentInstance
    expect(fixture.componentInstance.handleEditorCreated).toHaveBeenCalledWith(editorComponent.quillEditor)
  })

  test('should emit onContentChanged when content of editor changed + editor changed', async () => {
    vi.spyOn(fixture.componentInstance, 'handleChange')
    vi.spyOn(fixture.componentInstance, 'handleEditorChange')

    const editorFixture = fixture.debugElement.children[0]
    editorFixture.componentInstance.quillEditor.setText('1234', 'user')
    // fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.componentInstance.handleChange).toHaveBeenCalledWith(fixture.componentInstance.changed)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledWith(fixture.componentInstance.changedEditor)
  })

  test('should emit onContentChanged with a delay after content of editor changed + editor changed', async () => {
    fixture.componentInstance.debounceTime = 400
    vi.spyOn(fixture.componentInstance, 'handleChange')
    vi.spyOn(fixture.componentInstance, 'handleEditorChange')

    const editorFixture = fixture.debugElement.children[0]
    editorFixture.componentInstance.quillEditor.setText('foo', 'bar')
    // fixture.detectChanges()
    // TestBed.tick()
    await fixture.whenStable()

    expect(fixture.componentInstance.handleChange).not.toHaveBeenCalled()
    expect(fixture.componentInstance.handleEditorChange).not.toHaveBeenCalled()

    // TestBed.tick()
    await fixture.whenStable()

    expect(fixture.componentInstance.handleChange).toHaveBeenCalledWith(fixture.componentInstance.changed)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledWith(fixture.componentInstance.changedEditor)
  })

  test('should emit onContentChanged once after editor content changed twice within debounce interval + editor changed', () => {
    fixture.componentInstance.debounceTime = 400
    vi.spyOn(fixture.componentInstance, 'handleChange')
    vi.spyOn(fixture.componentInstance, 'handleEditorChange')

    fixture.detectChanges()
    TestBed.tick()

    const editorFixture = fixture.debugElement.children[0]
    editorFixture.componentInstance.quillEditor.setText('foo', 'bar')
    fixture.detectChanges()
    TestBed.tick()

    editorFixture.componentInstance.quillEditor.setText('baz', 'bar')
    fixture.detectChanges()
    TestBed.tick()

    expect(fixture.componentInstance.handleChange).toHaveBeenCalledTimes(1)
    expect(fixture.componentInstance.handleChange).toHaveBeenCalledWith(fixture.componentInstance.changed)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledTimes(1)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledWith(fixture.componentInstance.changedEditor)
  })

  test(`should adjust the debounce time if the value of 'debounceTime' changes`, () => {
    fixture.componentInstance.debounceTime = 400
    const handleChangeSpy = vi.spyOn(fixture.componentInstance, 'handleChange')
    const handleEditorChangeSpy = vi.spyOn(fixture.componentInstance, 'handleEditorChange')

    fixture.detectChanges()
    TestBed.tick()

    const editorFixture = fixture.debugElement.children[0]
    editorFixture.componentInstance.quillEditor.setText('foo', 'bar')
    fixture.detectChanges()
    TestBed.tick()

    expect(fixture.componentInstance.handleChange).not.toHaveBeenCalled()
    expect(fixture.componentInstance.handleEditorChange).not.toHaveBeenCalled()

    TestBed.tick()

    expect(fixture.componentInstance.handleChange).toHaveBeenCalledWith(fixture.componentInstance.changed)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledWith(fixture.componentInstance.changedEditor)
    handleChangeSpy.mockReset()
    handleEditorChangeSpy.mockReset()

    fixture.componentInstance.debounceTime = 200
    fixture.detectChanges()
    TestBed.tick()

    editorFixture.componentInstance.quillEditor.setText('baz', 'foo')
    fixture.detectChanges()
    TestBed.tick()

    expect(fixture.componentInstance.handleChange).not.toHaveBeenCalled()
    expect(fixture.componentInstance.handleEditorChange).not.toHaveBeenCalled()

    TestBed.tick()

    expect(fixture.componentInstance.handleChange).toHaveBeenCalledWith(fixture.componentInstance.changed)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledWith(fixture.componentInstance.changedEditor)
  })

  test('should unsubscribe from Quill events on destroy', async () => {
    fixture.componentInstance.debounceTime = 400
    fixture.detectChanges()
    await fixture.whenStable()

    const editorFixture = fixture.debugElement.children[0]
    const quillOffSpy = vi.spyOn(editorFixture.componentInstance.quillEditor, 'off')
    editorFixture.componentInstance.quillEditor.setText('baz', 'bar')
    fixture.detectChanges()
    await fixture.whenStable()

    fixture.destroy()

    expect(quillOffSpy).toHaveBeenCalledTimes(3)
    expect(editorFixture.componentInstance.eventsSubscription).toEqual(null)
    expect(quillOffSpy).toHaveBeenCalledWith('text-change', expect.any(Function))
    expect(quillOffSpy).toHaveBeenCalledWith('editor-change', expect.any(Function))
    expect(quillOffSpy).toHaveBeenCalledWith('selection-change', expect.any(Function))
  })

  test('should emit onSelectionChanged when selection changed + editor changed', async () => {
    vi.spyOn(fixture.componentInstance, 'handleSelection')
    vi.spyOn(fixture.componentInstance, 'handleEditorChange')

    fixture.detectChanges()
    await fixture.whenStable()

    const editorFixture = fixture.debugElement.children[0]

    editorFixture.componentInstance.quillEditor.focus()
    editorFixture.componentInstance.quillEditor.blur()
    fixture.detectChanges()

    expect(fixture.componentInstance.handleSelection).toHaveBeenCalledWith(fixture.componentInstance.selected)
    expect(fixture.componentInstance.handleEditorChange).toHaveBeenCalledWith(fixture.componentInstance.changedEditor)
  })

  test('should emit onFocus when focused', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    const editorFixture = fixture.debugElement.children[0]

    editorFixture.componentInstance.quillEditor.focus()
    fixture.detectChanges()

    expect(fixture.componentInstance.focused).toBe(true)
  })

  test('should emit onNativeFocus when scroll container receives focus', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    const editorFixture = fixture.debugElement.children[0]

    editorFixture.componentInstance.quillEditor.scroll.domNode.focus()
    fixture.detectChanges()

    expect(fixture.componentInstance.focusedNative).toBe(true)
  })

  test('should emit onBlur when blured', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    const editorFixture = fixture.debugElement.children[0]

    editorFixture.componentInstance.quillEditor.focus()
    editorFixture.componentInstance.quillEditor.blur()
    fixture.detectChanges()

    expect(fixture.componentInstance.blured).toBe(true)
  })

  test('should emit onNativeBlur when scroll container receives blur', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    const editorFixture = fixture.debugElement.children[0]

    editorFixture.componentInstance.quillEditor.scroll.domNode.focus()
    editorFixture.componentInstance.quillEditor.scroll.domNode.blur()
    fixture.detectChanges()

    expect(fixture.componentInstance.bluredNative).toBe(true)
  })

  test('should validate minlength', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    // get editor component
    const editorComponent = fixture.debugElement.children[0].componentInstance
    const editorElement = fixture.debugElement.children[0].nativeElement

    expect(editorElement.className).toMatch('ng-valid')

    // set minlength
    fixture.componentInstance.minLength = 8
    fixture.detectChanges()
    await fixture.whenStable()
    expect(editorComponent.minLength()).toBe(8)

    fixture.componentInstance.title = 'Hallo1'
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(editorElement.className).toMatch('ng-invalid')
  })

  test('should set valid minlength if model is empty', async () => {

    fixture.detectChanges()
    await fixture.whenStable()

    // get editor component
    const editorComponent = fixture.debugElement.children[0].componentInstance
    const editorElement = fixture.debugElement.children[0].nativeElement

    // set min length
    fixture.componentInstance.minLength = 2
    // change text
    editorComponent.quillEditor.setText('', 'user')

    fixture.detectChanges()
    await fixture.whenStable()

    fixture.detectChanges()
    expect(editorElement.className).toMatch('ng-valid')
  })

  test('should validate maxlength', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    // get editor component
    const editorComponent = fixture.debugElement.children[0].componentInstance
    const editorElement = fixture.debugElement.children[0].nativeElement

    expect(fixture.debugElement.children[0].nativeElement.className).toMatch('ng-valid')

    fixture.componentInstance.maxLength = 3
    fixture.componentInstance.title = '1234'
    fixture.detectChanges()

    await fixture.whenStable()
    fixture.detectChanges()

    expect(editorComponent.maxLength()).toBe(3)
    expect(editorElement.className).toMatch('ng-invalid')
  })

  test('should validate maxlength and minlength', async () => {
    fixture.detectChanges()
    await fixture.whenStable()

    // get editor component
    const editorElement = fixture.debugElement.children[0].nativeElement

    expect(fixture.debugElement.children[0].nativeElement.className).toMatch('ng-valid')

    fixture.componentInstance.minLength = 3
    fixture.componentInstance.maxLength = 5
    fixture.componentInstance.title = '123456'

    fixture.detectChanges()
    await fixture.whenStable()

    fixture.detectChanges()
    expect(editorElement.className).toMatch('ng-invalid')

    fixture.componentInstance.title = '1234'

    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(editorElement.className).toMatch('ng-valid')
  })

  test('should validate maxlength and minlength with trimming white spaces', async () => {
    // get editor component
    const editorElement = fixture.debugElement.children[0].nativeElement
    fixture.componentInstance.trimOnValidation = true

    fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.debugElement.children[0].nativeElement.className).toMatch('ng-valid')

    fixture.componentInstance.minLength = 3
    fixture.componentInstance.maxLength = 5
    fixture.componentInstance.title = '  1234567  '

    fixture.detectChanges()
    await fixture.whenStable()

    fixture.detectChanges()
    expect(editorElement.className).toMatch('ng-invalid')

    fixture.componentInstance.title = '  1234  '

    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(editorElement.className).toMatch('ng-valid')
  })

  test('should validate required', async () => {
    // get editor component
    const editorElement = fixture.debugElement.children[0].nativeElement
    const editorComponent = fixture.debugElement.children[0].componentInstance

    fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.debugElement.children[0].nativeElement.className).toMatch('ng-valid')
    expect(editorComponent.required()).toBeFalsy()

    fixture.componentInstance.required = true
    fixture.componentInstance.title = ''

    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(editorComponent.required()).toBeTruthy()
    expect(editorElement.className).toMatch('ng-invalid')

    fixture.componentInstance.title = '1'

    fixture.detectChanges()
    await fixture.whenStable()

    fixture.detectChanges()
    expect(editorElement.className).toMatch('ng-valid')

    fixture.componentInstance.title = '<img src="test.jpg">'
    fixture.detectChanges()
    await fixture.whenStable()

    fixture.detectChanges()
    expect(editorElement.className).toMatch('ng-valid')
  })

  test('should add custom toolbar', async () => {
    // get editor component
    const toolbarFixture = TestBed.createComponent(TestToolbarComponent) as ComponentFixture<TestToolbarComponent>

    toolbarFixture.detectChanges()
    await toolbarFixture.whenStable()

    expect(toolbarFixture.debugElement.children[0].nativeElement.children[0].attributes['above-quill-editor-toolbar']).toBeDefined()
    expect(toolbarFixture.debugElement.children[0].nativeElement.children[1].attributes['quill-editor-toolbar']).toBeDefined()
    expect(toolbarFixture.debugElement.children[0].nativeElement.children[2].attributes['below-quill-editor-toolbar']).toBeDefined()
    expect(toolbarFixture.debugElement.children[0].nativeElement.children[3].attributes['quill-editor-element']).toBeDefined()

    const editorComponent = toolbarFixture.debugElement.children[0].componentInstance
    expect(editorComponent.required()).toBe(true)
    expect(editorComponent.customToolbarPosition()).toEqual('top')
  })

  test('should add custom toolbar at the end', async () => {
    // get editor component
    const toolbarFixture = TestBed.createComponent(TestToolbarComponent) as ComponentFixture<TestToolbarComponent>
    toolbarFixture.componentInstance.toolbarPosition = 'bottom'

    toolbarFixture.detectChanges()
    await toolbarFixture.whenStable()

    expect(toolbarFixture.debugElement.children[0].nativeElement.children[0].attributes['quill-editor-element']).toBeDefined()
    expect(toolbarFixture.debugElement.children[0].nativeElement.children[1].attributes['above-quill-editor-toolbar']).toBeDefined()
    expect(toolbarFixture.debugElement.children[0].nativeElement.children[2].attributes['quill-editor-toolbar']).toBeDefined()
    expect(toolbarFixture.debugElement.children[0].nativeElement.children[3].attributes['below-quill-editor-toolbar']).toBeDefined()

    const editorComponent = toolbarFixture.debugElement.children[0].componentInstance
    expect(editorComponent.customToolbarPosition()).toEqual('bottom')
  })

  test('should render custom link placeholder', async () => {
    const linkFixture = TestBed.createComponent(CustomLinkPlaceholderTestComponent) as ComponentFixture<CustomLinkPlaceholderTestComponent>

    linkFixture.detectChanges()
    await linkFixture.whenStable()

    const el = linkFixture.nativeElement.querySelector('input[data-link]')

    expect(el.dataset.link).toBe('https://test.de')
  })
})

describe('QuillEditor - base config', () => {
  let fixture: ComponentFixture<TestComponent>
  let component: TestComponent
  let importSpy: MockInstance
  let registerSpy: MockInstance

  beforeAll(() => {
    importSpy = vi.spyOn(Quill, 'import')
    registerSpy = vi.spyOn(Quill, 'register')
  })

  const quillModuleConfig: QuillConfig = {
    customModules: [{
      path: 'modules/custom',
      implementation: CustomModule
    }],
    customOptions: [{
      import: 'attributors/style/size',
      whitelist: ['14']
    }],
    suppressGlobalRegisterWarning: true,
    bounds: 'body',
    debug: false,
    format: 'object',
    formats: ['bold'],
    modules: {
      toolbar: [
        ['bold']
      ]
    },
    placeholder: 'placeholder',
    readOnly: true,
    theme: 'snow',
    trackChanges: 'all'
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig(quillModuleConfig)],
      imports: [FormsModule, TestComponent],
    })
    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance

    expect(registerSpy).toHaveBeenCalledWith('modules/custom', CustomModule, true)
    expect(importSpy).toHaveBeenCalledWith('attributors/style/size')
  })

  test('renders editor with config', async () => {
    const editor = component.editor as Quill

    expect(fixture.nativeElement.querySelector('.ql-toolbar').querySelectorAll('button').length).toBe(1)
    expect(fixture.nativeElement.querySelector('.ql-toolbar').querySelector('button.ql-bold')).toBeDefined()

    editor.updateContents([{
      insert: 'content',
      attributes: {
        bold: true,
        italic: true
      }
    }] as any, 'api')
    fixture.detectChanges()

    expect(JSON.stringify(component.title))
      .toEqual(JSON.stringify({
        ops: [{
          attributes: { bold: true },
          insert: 'content'
        }, { insert: '\n' }]
      }))
    expect(editor.root.dataset.placeholder).toEqual('placeholder')
    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attrName: 'size',
        keyName: 'font-size',
        scope: 5,
        whitelist: ['14']
      }), true, true
    )

    expect(component.editorComponent.quillEditor['options'].modules.toolbar)
      .toEqual(expect.objectContaining({
        container: [
          ['bold']
        ]
      }))
  })
})

describe('QuillEditor - customModules', () => {
  let fixture: ComponentFixture<CustomModuleTestComponent>
  let component: CustomModuleTestComponent
  let registerSpy: MockInstance

  beforeAll(() => {
    registerSpy = vi.spyOn(Quill, 'register')
  })

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [CustomModuleTestComponent]
    })
    fixture = TestBed.createComponent(CustomModuleTestComponent)
    component = fixture.componentInstance

    expect(registerSpy).toHaveBeenCalled()
  })

  test('renders editor with config', async () => {
    expect(component.editor.quillEditor['options'].modules.custom).toBeDefined()
  })
})

describe('QuillEditor - customModules (asynchronous)', () => {
  let fixture: ComponentFixture<CustomAsynchronousModuleTestComponent>
  let component: CustomAsynchronousModuleTestComponent
  let registerSpy: MockInstance

  beforeAll(() => {
    registerSpy = vi.spyOn(Quill, 'register')
  })

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [CustomAsynchronousModuleTestComponent]
    })
    fixture = TestBed.createComponent(CustomAsynchronousModuleTestComponent)
    component = fixture.componentInstance

    expect(registerSpy).toHaveBeenCalled()
  })

  test('renders editor with config', async () => {
    expect(component.editor.quillEditor['options'].modules.custom).toBeDefined()
  })
})

describe('QuillEditor - defaultEmptyValue', () => {
  @Component({
    imports: [QuillModule],
    template: `
      <quill-editor defaultEmptyValue=""></quill-editor>
  `
  })
  class DefaultEmptyValueTestComponent {
    @ViewChild(QuillEditorComponent, { static: true }) editor!: QuillEditorComponent
  }

  let fixture: ComponentFixture<DefaultEmptyValueTestComponent>
  let component: DefaultEmptyValueTestComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [DefaultEmptyValueTestComponent]
    })
    fixture = TestBed.createComponent(DefaultEmptyValueTestComponent)
    component = fixture.componentInstance
  })

  test('should change default empty value', async () => {
    expect(component.editor.defaultEmptyValue).toBeDefined()
  })
})

describe('QuillEditor - beforeRender', () => {
  @Component({
    imports: [QuillModule],
    template: `
      <quill-editor [beforeRender]="beforeRender"></quill-editor>
  `
  })
  class BeforeRenderTestComponent {
    @ViewChild(QuillEditorComponent, { static: true }) editor!: QuillEditorComponent

    beforeRender?: () => Promise<any>
  }

  let fixture: ComponentFixture<BeforeRenderTestComponent>
  let component: BeforeRenderTestComponent
  // let beforeRenderSpy: MockInstance

  const config = { beforeRender: () => Promise.resolve() }

  // beforeAll(() => {
  //   beforeRenderSpy = vi.spyOn(config, 'beforeRender')
  // })

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideQuillConfig({})],
      imports: [BeforeRenderTestComponent]
    })
    fixture = TestBed.createComponent(BeforeRenderTestComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should call beforeRender provided on the config level', async () => {
    expect(component.editor.defaultEmptyValue).toHaveBeenCalled()
  })

  test('should call beforeRender provided on the component level and should not call beforeRender on the config level', async () => {
    expect(config.beforeRender).not.toHaveBeenCalled()
    expect(component.beforeRender).toHaveBeenCalled()
  })
})

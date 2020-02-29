import { Component, Input, Output, EventEmitter, AfterViewChecked, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { HostBinding, HostListener, Inject, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { filter, map, timeInterval } from 'rxjs/operators';
import { EmojiRegex, EmojiNative } from '../utils';
import { EmojiText, emSegment } from '../text';
import { Subject, Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'wm-emoji-input',
  templateUrl: '../text/emoji-text.component.html',
  styleUrls: ['./emoji-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { "class": "wm-emoji-input" }
})
export class EmojiInput extends EmojiText implements OnInit, AfterViewChecked, OnChanges, OnDestroy {

  // Current selection
  private start: number;
  private end: number;
  private marked: boolean;

  /** Returns the current selection in the for of start/end offset */
  public get selection(): [number, number] {
    return [ this.start, this.end ];
  }

  /** True whenever the curernt selection is collapsed in a cursor */
  public get collapsed(): boolean {
    return this.start === this.end;
  }

  /** Input's HTMLElement */
  public get element(): HTMLElement {
    return this.root.nativeElement;
  }

  private get window(): Window {
    return this.document.defaultView;
  }

  private get mac(): boolean {
    const window = this.document.defaultView;
    return /Mac|^iP/.test(window.navigator.platform);
  }

  constructor(@Inject(DOCUMENT) private document: Document, private root: ElementRef<HTMLElement>,
              @Inject(EmojiRegex) regex: RegExp, @Inject(EmojiNative) native: boolean) {
                
    super(regex, native);
  }

  ngOnInit() { this.enableHistory(this.historyTime, this.historyLimit); }

  ngAfterViewChecked() {
    // Applies the current selection to the document when needed. This is essential even when the selection
    // isn't modified since view changes (aka rendering) affects the selection that requires to be restored
    if(this.marked) {

      Promise.resolve().then( () => {
        
        // Emits the updated source text
        this.change.emit(this.value);

        // Makes sure to restore the selection after the view has been rendered but anyhow well before
        // the next change will be applied to the data tree (such as while typing) 
        this.restore();

        // Resets the flag after the update 
        this.marked = false; 
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {

    if(changes.historyTime || changes.historyLimit) {
      this.enableHistory(this.historyTime, this.historyLimit);
    }

    // Calls the supr version when needed
    (changes.value || changes.mode) && super.ngOnChanges(changes);
  }

  ngOnDestroy() { this.clearHistory(); }

  @HostBinding('attr.contenteditable') get editable() { return this.disabled ? undefined : ''; }

  @HostBinding('class.empty') get showPlaceholder(): boolean {
    return !this.value;
  }

  @Input('value') set input(value: string) {
    this.value = value;
  }

  @HostBinding('attr.placeholder')
  @Input() placeholder: string;

  /** Disables the input */
  @Input('disabled') set disableInput(value: boolean) { this.disabled = coerceBooleanProperty(value); }
  public disabled = false; 

  /** Disables the input */
  @Input('required') set requireInput(value: boolean) { this.required = coerceBooleanProperty(value); }
  public required = false; 

  @Input() historyTime: number = 1000;
  @Input() historyLimit: number = 128;

  /** Emits the new text on changes */
  @Output() change = new EventEmitter<string>();

  /** Prevents insertion from input systems (iOS swipe keyboard and such) */
  @HostListener('beforeinput', ['$event']) beforeInput(ev: InputEvent) { 
    // Divert the insertion content to the internal implementation
    if(ev.data) { this.query().insert(ev.data); }
    // Prevents the default behavior
    return false;
  }

  @HostListener('mouseup', ['$event']) onMouseDown(ev: MouseEvent) {
    // Query for the current selection
    this.query();
  }

  @HostListener('keydown', ['$event']) keyDown(ev: KeyboardEvent) {
    // Query for the current selection
    this.query();

    switch(ev.key) {

      // Reverts navigation to default
      case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': 
      case 'Tab': case 'Home': case 'End': case 'PageUp': case 'PageDown':
      return true;
     
      case 'Delete':
      this.del(); break;
      
      case 'Backspace':
      this.back(); break;

      case 'Enter':
      this.enter(ev.shiftKey); break;

      // Editing
      default: if(ev.key.length === 1 || this.regex.test(ev.key) ) {

        // Intercepts accelerators
        if(ev.metaKey && this.mac || ev.ctrlKey) {
          return this.keyAccellerators(ev);
        }

        // Inserts new content
        this.insert(ev.key);
      }
    }

    // Prevents default
    return false;
  }

  @HostListener('cut', ['$event']) editCut(ev: ClipboardEvent) {
    // Reverts the cut request to copy the content first...
    this.editCopy(ev);
    // Deletes the selection when succeeded
    this.del();
    // Always prevent default
    return false;
  } 
  
  @HostListener('copy', ['$event']) editCopy(ev: ClipboardEvent) {

    // Gets the clipboard
    const cp = ev.clipboardData || (this.window as any).clipboardData;
    if(!cp) { return true; }
    
    // Copies the selected text
    try { cp.setData('text', this.value.slice(this.start, this.end) ); }
    catch(e) { /*console.error(e);*/ }

    // Prevents default
    return false;
  }

  @HostListener('paste', ['$event']) editPaste(ev: ClipboardEvent) {

    // Gets the clipboard
    const cp = (ev.clipboardData || (window as any).clipboardData);
    if(!cp) { return false; }
    // Pastes the data from the clipboard
    try { this.insert( cp.getData('text') ); }
    catch(e) { /*console.error(e);*/ }
    // Prevents default
    return false;
  }

  private keyAccellerators(ev: KeyboardEvent) {

    switch(ev.key) {

      case 'z': case 'Z': 
      
      if(ev.shiftKey && this.mac) { return this.redo(), false; }

      return this.undo(), false;

      case 'y': case 'Y': 
      
      if(!this.mac) { return this.redo(), false; }
    }
    return true;
  }

  /** True whenever this input has focus */
  public get focused(): boolean { 
    return this.document.activeElement === this.element; 
  }

  /** Sets the focus on the input */
  public focus() { this.element.focus(); }

  public typein(key: string) {

    this.focused && this.query().insert(key);
  }

  /** Insert a new text at the current cursor position */
  public insert(ins: string) {
    // Stores the current values in history
    this.store();
    // Deletes the selection, if any
    if(!this.collapsed) { this.del(); }
    // Insert the new text at the current position  
    const text = this.value.slice(0, this.start) + ins + this.value.slice(this.start);
    // Updates the source and compiles the segment for rendering 
    this.compile(this.value = text);
    // Updates the cursor position
    this.end = (this.start += ins.length);
    // Marks the selection for restoration after rendering 
    this.marked = true;
  }

  /** Deletes the current selection (Del-like) */
  public del() {
    // Stores the current values in history
    this.store();
    // Whenevevr collapsed...
    if(this.collapsed){
      // Skips when at the end of the text
      if(this.end === this.value.length) { return; }
      // Moves the end side of the selection ahead otherwise
      this.end = this.next(this.end);
    } 
    // Removes the selected text
    const text = this.value.slice(0, this.start) + this.value.slice(this.end);
    // Updates the source and compiles the segment for rendering 
    this.compile(this.value = text);
    // Collapses the selection
    this.end = this.start;
    // Marks the selection for restoration after rendering 
    this.marked = true;
  }

  public enter(shift?: boolean) {

  }

  /** Deletes the previous character (Backspace-like) */
  public back() {
    // Stores the current values in history
    this.store();
    // Whenevevr collapsed...
    if(this.collapsed) {
      // Skips when at the start of the text
      if(this.start <= 0) { return; } 
      // Moves the start side of the selection back otherwise
      this.start = this.prev(this.start);
    }
    // Deletes the selected block 
    this.del();
  }

  /** Moves the given selection index ahead by one character */
  private next(pos: number): number { 
    // Moving ahead requires to jump one or more character depending on the letngh of the emoji, if any.
    // So, search for a match with an emoij, first
    this.regex.lastIndex = 0;
    const match = this.regex.exec(this.value.slice(pos));
    // Updates teh position accordingly
    return pos + ((match && match.index === 0) ? match[0].length : 1); 
  }

  /** Moves the given selection index back by one character */
  private prev(pos: number): number {
    // Moving the cursor backwards is performed by moving forward from index 0 up until one step before the starting position.
    // This accounts for the variable length of emoji(s) that can't be successfully matched backwards
    let offset = 0; let next = 0;
    while((next = this.next(next)) < pos) {
      offset = next;
    }

    return offset;
  }

  /** Queries the current selection */
  public query(): this {

    try {
      // Gets the current document selection first
      const sel = this.document.getSelection();
      // Gets the first range, if any
      const range = (!!sel && sel.rangeCount > 0) && sel.getRangeAt(0);
      if(range) {
        // Computes the start offset
        this.start = this.match(range.startContainer, range.startOffset);
        // Computes the end offset
        this.end = range.collapsed ? this.start : this.match(range.endContainer, range.endOffset);
      }
      else { this.start = this.end = 0; }
    }
    catch(e) { this.start = this.end = 0; /*console.error(e);*/ }

    return this;
  }

  /** Restores the current selection back to the dom */ 
  private restore(): this {

    try {
      // Gets the document selection object first
      const sel = this.document.getSelection();
      // Clears the current documetn selection
      sel.removeAllRanges();
      // Creates a new range
      const range = this.document.createRange();
      // Computes the node/offset pair
      const [node, offset] = this.range(this.start);
      // Applies the pair to the range as a collapsed selection
      range.setStart(node, offset);
      range.setEnd(node, offset);
      // Updated the docuemtn selection
      sel.addRange(range);
    }
    catch(e) {}

    return this;
  }

  private match(node: Node, offset: number): number {

    if(!node) { return 0; }

    const findIndex = (node: Node) => {

      if(!node) { return 0; }

      const first = node.parentNode.firstChild;

      let count = 0;
      while(node && node !== first) { 

        node = node.previousSibling; 

        if(node && (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE)) {
          count++;
        }
      }

      return count;
    }

    if(node && node.nodeType === Node.TEXT_NODE) {
      return this.offset(this.segments[findIndex(node)], offset );
    }
    else {

      node = node && node.childNodes.item(Math.min(offset, node.childNodes.length - 1));

      if(node && node.nodeType !== Node.ELEMENT_NODE) {

        while(node && node.nodeType !== Node.ELEMENT_NODE) {
          node = node.previousSibling;
        }

        const segment = this.segments[findIndex(node)];
        return this.offset(segment, segment && segment.content.length);
      }

      return this.offset(this.segments[findIndex(node)], 0);
    }

    return 0 as never;
  }

  private offset(segment: emSegment, offset: number = 0): number {

    if(!segment) { return 0; }

    for(let seg of this.segments) {

      if(segment === seg) { break; }
      offset += seg.content.length;
    }

    return offset;
  }

  private range(start: number): [ Node, number ] {

    const [index, offset] = this.split(start);

    const parent = this.element;
    let node = parent.firstChild;

    let i = 0;let count = 0;
    while(node) {

      if(node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
        if(i === index) { break; }
        i++;
      }
      count++;

      node = node.nextSibling;
    }

    if(!node) { return [parent, 0]; }

    if(node.nodeType === Node.TEXT_NODE) {
      return [ node, offset ];
    }
    
    if(offset > 0) { 

      do { count++; node = node.nextSibling; }
      while(node && node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE) ;
    }

    return [ parent, count ];
  }

  private split(offset: number): [number, number] {

    let index = 0;
    for(let seg of this.segments) { 

      if(offset <= (seg.content || '').length) { return [ index, offset ]; }
      offset -= (seg.content || '').length;
      index++;
    }

    return [0, 0];
  }

  /***** HISTORY UNDO/REDO *****/
  private store$ = new Subject<{ value: string, selection: [number, number] }>();
  private history: { value: string, selection: [number, number] }[];
  private timeIndex: number;
  private sub$: Subscription;

  /** Clears the history buffer */
  public clearHistory(): this {
    // Unsubscribe the previous subscription, if any
    if(!!this.sub$) { this.sub$.unsubscribe(); }
    // Initializes the history buffer
    this.timeIndex = 0;
    this.history = [];
    return this;
  }

  /** Initilizes the history buffer */
  public enableHistory(debounce: number = 1000, limit: number = 128): this {
    // Clears the history buffer
    this.clearHistory();
    // Builts up the stream optimizing the amout of snapshot saved in the history 
    this.sub$ = this.store$.pipe( 
      // Append a time interval between storing emissions
      timeInterval(), 
      // Filters requests coming too fast (within 'debounce time')
      filter( payload => this.history.length === 0 || payload.interval > debounce), 
      // Gets a snapshot of the value with updated selection
      map( payload => payload.value ),
    // Subscribes the history save handler
    ).subscribe( snapshot => {
      // Wipes the further future undoed snapshots since they are now 
      if(this.timeIndex > 0) {
        // Save the last snapshot wiping the further future undoed once
        this.history.splice(0, this.timeIndex + 1, snapshot);
        // Resets the time index
        this.timeIndex = 0;
      }
      // Saves the last snapshot in the history
      else { this.history.unshift(snapshot); }
      // Removes the oldest snapshot when exceeeding the history limit
      if(this.history.length > limit) { this.history.pop(); }
    });

    return this;
  }

  /** Stores a snapshot in the undo/redo history buffer 
   * @param force (option) when true forces the storage unconditionally.
   * Storage will be performed conditionally to the time elapsed since 
   * the last modification otherwise.
  */
  public store(force?: boolean): this { 

    if(!!force) {
      // Pushes a snapshot into the history buffer unconditionally
      this.history.unshift({ value: this.value, selection: this.selection }); 
      return this; 
    }
    // Pushes the document for conditional history save
    this.store$.next({ value: this.value, selection: this.selection });
    return this; 
  }
 
  /** Returns true whenever the last modifications can be undone */
  get undoable(): boolean { return this.history.length > 0 && this.timeIndex < this.history.length - (!!this.timeIndex ? 1 : 0); }

  /** Undoes the latest changes. It requires enableHistory() to be called */
  public undo(): this {
    // Stops undoing when history is finished
    if(!this.undoable) { return this; }
    // Saves the present moment to be restored eventually
    if(this.timeIndex === 0) { this.store(true); }
    // Gets the latest snapshot from the history
    const snapshot = this.history[++this.timeIndex];
    // Reloads the snapshot's content restoring the selection too
    return this.apply(snapshot);
  }

  /** Returns true whenever the last undone modifications can be redone */
  get redoable(): boolean { return this.history.length > 0 && this.timeIndex > 0; }

  /** Redoes the last undone modifications. It requires enableHistory() to be called */
  public redo(): this {
    // Stops redoing when back to the present
    if(!this.redoable) { return this; }
    // Gets the previous snapshot from the history
    const snapshot = this.history[--this.timeIndex];
    // Removes the newest snapshot when back to the present
    if(this.timeIndex === 0) { this.history.shift(); }
    // Reloads the snapshot's content restoring the selection too
    return this.apply(snapshot);
  }

  private apply(snapshot: { value: string, selection: [number, number] }): this {

    this.compile(this.value = snapshot.value);
    [this.start, this.end] = snapshot.selection;
    this.marked = true;
    return this;
  }
}
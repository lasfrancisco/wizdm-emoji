import { Directive, ElementRef, Optional, Self, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';
import { EmojiInput } from './emoji-support/input';

@Directive({
  selector: 'textarea[typein], wm-emoji-input[typein]'
})
export class TypeinAdapter {

  get element(): HTMLElement { return this.elref.nativeElement; }

  get textarea(): HTMLTextAreaElement { 

    if(this.element.tagName !== 'TEXTAREA') { throw new Error('Something is wrong'); }  
    return this.element as HTMLTextAreaElement;
  }

  constructor(private elref: ElementRef, @Optional() @Self() private emoji: EmojiInput) {}

  @HostListener('input', ['event$']) onInput(ev: InputEvent) {
    this.valueChange.emit(this.textarea.value); 
  }

  @Output() valueChange = new EventEmitter<string>();


  public typein(key: string) {

    if(this.emoji) { this.emoji.insert(key); }
    else {

      this.textarea.setRangeText(key, this.textarea.selectionStart, this.textarea.selectionEnd, 'end');
      this.valueChange.emit(this.textarea.value);
    }
  }
}
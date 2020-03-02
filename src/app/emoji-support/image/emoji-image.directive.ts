import { Directive, Input, Output, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { EmojiUtils } from '../utils';

@Directive({
  selector: 'img[wm-emoji]',
  host: { "style": "width: 1.25em; height: 1.25em; vertical-align: text-bottom; margin: 0 0.05em; box-sizing: border-box;" }
})
export class EmojiImage { 

  constructor(private utils: EmojiUtils) { }

  @HostBinding('attr.src') get src(): string {
    return this.utils.imageFilePath(this.emoji);
  }

  //@HostBinding('attr.alt')
  @Input('wm-emoji') emoji: string; 
}
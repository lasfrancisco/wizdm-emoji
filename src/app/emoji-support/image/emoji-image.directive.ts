import { Directive, Input, Output, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { EmojiLoader } from '../loader';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'img[wm-emoji]',
  host: { "style": "width: 1.25em; height: 1.25em; vertical-align: text-bottom; margin: 0 0.05em; box-sizing: border-box;" }
})
export class EmojiImage implements OnDestroy { 

  private sub: Subscription; 

  constructor(private loader: EmojiLoader) { }

  @HostBinding('attr.src') src: string;

  //@HostBinding('attr.alt') alt: string;
  
  @Input('wm-emoji') set emoji(emoji: string) {

    this.src = undefined;

    this.sub && this.sub.unsubscribe();

    this.sub = this.loader.loadEmoji(/*this.alt = */emoji).subscribe( 
      encoded => this.src = encoded, 
      error => this.error.emit(error) 
    );
  }

  @Output() error = new EventEmitter<Error>();

  ngOnDestroy() {
    this.sub && this.sub.unsubscribe();
  }
}
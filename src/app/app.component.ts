import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { EmojiRegex, EmojiNative } from './emoji-support/utils';
//import emojiData from 'emoji-datasource-google/emoji.json';

@Component({
  selector: 'body',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: { 'class': 'mat-typography' }
})
export class AppComponent { 

  public text = "Playing with emoji \ud83d\ude03\u{1F976}\u{1F469}\u{1F3FB}\u200D\u{1F9B0} - \u{1F64F}\u{1F64F}\u{1F3FF}";
  public debug: string;
  public mode = 'auto';
  

  readonly keys = ['😂', '👋🏻', '💕', '😈', '💣', '🚖', '🐵', '👩‍🦰', '🙏🏾'];

  constructor(@Inject(EmojiRegex) private regex: RegExp, @Inject(EmojiNative) readonly native: boolean) {

    this.updateText(this.text);
  }

  updateText(text: string) {
    this.debug = this.decode(this.text = text);
  }

  private decode(text: string): string {

    return text && text.replace(this.regex, match => {

      let decoded = "";

      for (let codePoint of match) {
        decoded += "\\u" + codePoint.codePointAt(0).toString(16);
      } 

      return decoded;
    });
  }

  onLoad(ev: Event) {
    console.log(ev);
  }

  onError(error: Error) {
    console.error(error);
  }

  private popup(to: any) {
    window.alert("Congratulation! You successfully tested navigation:\n" + to);
  }
}

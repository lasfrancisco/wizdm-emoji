import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { EmojiRegex, EmojiNative } from './emoji-support/utils';
import { EmojiInput } from './emoji-support/input';
import { TypeinAdapter } from './typein-adapter.directive';
//import emojiData from 'emoji-datasource-google/emoji.json';

@Component({
  selector: 'body',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: { 'class': 'mat-typography' }
})
export class AppComponent { 

  @ViewChild(TypeinAdapter) typeinAdapter: TypeinAdapter;

  public text = "Playing with emoji \ud83d\ude03\u{1F976}\u{1F469}\u{1F3FB}\u200D\u{1F9B0} - \u{1F64F}\u{1F64F}\u{1F3FF}";
  public mode = 'auto';
  public decoded: string;
 
  readonly keys = ['😂', '👋🏻', '💕', '😈', '💣', '🚖', '🐵', '👩‍🦰', '🙏🏾'];

  constructor(@Inject(EmojiRegex) private regex: RegExp, @Inject(EmojiNative) readonly native: boolean) {

    this.updateText(this.text);
  }

  updateText(text: string) {
    this.decoded = this.decode(this.text = text);
  }

  public typein(key: string) {

    if(!this.typeinAdapter) { return false; }
    // Types the key in the textarea/EmojiInput
    this.typeinAdapter.typein(key);
    // Prevents the default behavior avoiding focus change
    return false;
  }

  private decode(text: string): string {

    return text && text.replace(this.regex, match => {

      let decoded = "";

      for (let codePoint of match) {
        decoded += "\\u" + codePoint.codePointAt(0).toString(16);
      } 

      return decoded;
    }).replace(/\n/g, '\\u0013');
  }
}

import { Component, OnChanges, SimpleChanges, Input, Inject } from '@angular/core';
import { EmojiRegex, EmojiNative } from '../utils';

export interface emSegment {
  type: 'text'|'emoji';
  content: string;
}

@Component({
  selector: '[wm-emoji-text]',
  templateUrl: './emoji-text.component.html',
  styleUrls: ['./emoji-text.component.scss']
})
export class EmojiText implements OnChanges {

  readonly segments: emSegment[] = [];

  constructor(@Inject(EmojiRegex) protected regex: RegExp, @Inject(EmojiNative) protected native: boolean) { }

  /** Plain text source input */
  @Input('wm-emoji-text') value: string;
    
  /** Mode flag:
   * 'web' renders emoji as images
   * 'native' renders the text as it is relying on the OS native support
   * 'auto' detects the availability of native support and chooses accordingly
   */
  @Input() mode: 'auto'|'native'|'web' = 'auto';

  /** Behavior flag either returning 'web' or 'native' depending on the current behavior */
  get behavior(): 'native'|'web' {
    return this.mode === 'auto' ? (this.native ? 'native' : 'web') : this.mode;
  }

  public ngOnChanges(changes: SimpleChanges) {
    
    // Compiles the source text into segments
    this.compile(this.value); 
  }

  // Tracking function to render the segments by content preventing re-rendering segments where content is unchanged
  public trackByFn(index: number, item: emSegment) {
    return item.type + item.content;
  }

  /** Compiles the source text into an array of eather text or emoji segments */
  public compile(source: string): number {
    // Resets the segments array
    this.segments.splice(0);
    // Skips null or emptiìy sources
    if(!source) { return 0; }
    // Short-circuit to the source text when native behavior is requested
    if(this.behavior === 'native') {
      return this.segments.push({ type: 'text', content: source });
    }
    // Resets the start index
    let start = 0;
    // Parses the source text for emoji unicode sequences
    this.parse(source, (match, index) => {
       // Pushes the text preceeding the match 
      if(index > start){ 
        const content = source.substring(start, index);
        this.segments.push({ type: "text", content });   
      }
      // Pushes the emoji sequence
      this.segments.push({ type: 'emoji', content: match });
      // Keeps track of the next beginning for the eventual plain text between this match and the next
      start = index + match.length;
    });
    // Appends the final text chunk 
    if(start < source.length) {
      const content = source.substring(start, source.length);
      this.segments.push({ type: "text", content });
    }

    return this.segments.length;
  }

  /** Parses the source text searching for emoji unicode sequences */
  private parse(source: string, callbackfn: (match: string, index: number) => void) {

    if(typeof callbackfn !== 'function') {
      throw new Error('Callback must be a funciton');
    }

    // Resets the starting position
    this.regex.lastIndex = 0;

    // Loop on RegExp matches
    let match;
    while(match = this.regex.exec(source)) {
      callbackfn(match[0], match.index);
    }
  }
}
import { Injectable, InjectionToken, Inject } from '@angular/core';
import { EmojiRegex, EmojiNative } from './emoji-utils';
import { DOCUMENT } from '@angular/common';

export interface EmojiConfig {

  emojiPath?: string; //assets/...
  emojiExt?: string; //.png, .svg, ...
};

export const EmojiConfigToken = new InjectionToken<EmojiConfig>('wizdm-emoji-config');

@Injectable()
export class EmojiUtils {

  private readonly filePath: string;
  private readonly fileExt: string;

  constructor(@Inject(EmojiConfigToken) private config: EmojiConfig, 
              @Inject(EmojiNative) readonly native: boolean,
              @Inject(EmojiRegex) readonly regex: RegExp) { 

    // Grabs the source path and the igmage extension from the configuration object
    this.filePath = this.assessPath(config && config.emojiPath) || 'assets/emoji/';
    this.fileExt  = this.assessExt(config && config.emojiExt)  || '.png';
  }

  private assessPath(path: string): string {
    return path ? (path.endsWith('/') ? path : (path + '/')) : '';
  }

  private assessExt(ext: string): string {
    return ext ? (ext.startsWith('.') ? ext : ('.' + ext)) : '';
  }

  /** Computes the full path to load the image corersponding to the given emoji */
  public imageFilePath(emoji: string): string {

    if(!emoji) { return ''; }

    const pts: string[] = [];

    for (let cp of emoji) {
      pts.push(cp.codePointAt(0).toString(16));
    } 

    return this.filePath + pts.join('-') + this.fileExt;
  }

  public testForEmoji(source: string): boolean {
    return this.regex.test(source);
  }

  public matchEmojiCodes(source: string): RegExpExecArray {
    this.regex.lastIndex = 0;
    return this.regex.exec(source);
  }

  /** Parses the source text searching for emoji unicode sequences */
  public parseEmojiCodes(source: string, callbackfn: (match: string, index: number) => void) {

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

  /*
  public loadEmojiFile(path: string): Observable<string> {

    return this.http.get(path, { responseType: "blob" })
      .pipe( switchMap( blob => this.encodeDataURI(blob) ) );
  }

  private encodeDataURI(blob: Blob): Observable<string> {

    return new Observable( subscriber => {

      const fr = new FileReader();

      fr.onerror = () => subscriber.error(fr.error);
      fr.onloadend = () => {
        subscriber.next(fr.result as string);
        subscriber.complete();
      }
      fr.readAsDataURL(blob);

      return () => fr.abort();
    });
  }
  */

}
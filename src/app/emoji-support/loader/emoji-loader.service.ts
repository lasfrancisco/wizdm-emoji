import { Injectable, InjectionToken, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface EmojiConfig {

  filePath?: string; //assets/...
  fileExt?: string; //.png, .svg, ...

};

export const EmojiConfigToken = new InjectionToken<EmojiConfig>('wizdm-emoji-config');

@Injectable()
export class EmojiLoader {

  private readonly filePath: string;
  private readonly fileExt: string;

  constructor(private http: HttpClient, @Optional() @Inject(EmojiConfigToken) private config: EmojiConfig ) { 

    this.filePath = config && config.filePath || 'assets/emoji/';
    this.fileExt  = config && config.fileExt  || '.png';
  }

  public loadEmoji(emoji: string): Observable<string> {

    const fullPath = this.filePath + this.fileName(emoji) + this.fileExt;
    return this.loadEmojiFile(fullPath);
  }

  private fileName(emoji: string): string {

    const pts: string[] = [];

    for (let cp of emoji) {
      pts.push(cp.codePointAt(0).toString(16));
    } 

    return pts.join('-');
  }

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
}
import { InjectionToken, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import emojiRegexFactory from 'emoji-regex/es2015';

export const EmojiRegex = new InjectionToken<RegExp>('wizdm-emoji-regex', {
  providedIn: 'root',
  factory: emojiRegexFactory
});

export const EmojiNative = new InjectionToken<boolean>('wizdm-native-emoji-support', {
  providedIn: 'root',
  factory: () => checkNativeEmojiSupport( inject(DOCUMENT) )
});

function checkNativeEmojiSupport(document: Document): boolean {

  const canvas = document.createElement('canvas');
  if(!canvas.getContext || !canvas.getContext('2d') || typeof canvas.getContext('2d').fillText !== 'function') {
    return false;
  }

  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '32px Arial';
  ctx.fillText('\ud83d\ude03', 0, 0);
  return ctx.getImageData(16, 16, 1, 1).data[0] !== 0;
}
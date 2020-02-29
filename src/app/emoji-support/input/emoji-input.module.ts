import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiImageModule } from '../image';
import { EmojiInput } from './emoji-input.component';

@NgModule({
  imports: [ CommonModule, EmojiImageModule ],
  declarations: [ EmojiInput ],
  exports: [ EmojiInput ]
})
export class EmojiInputModule { }
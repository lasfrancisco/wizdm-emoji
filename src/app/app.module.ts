import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AppComponent } from './app.component';
import { EmojiSupportModule } from './emoji-support';
import { EmojiImageModule } from './emoji-support/image';
import { EmojiTextModule } from './emoji-support/text';
import { EmojiInputModule } from './emoji-support/input';
import { EmojiMaterialModule } from './emoji-support/material';

@NgModule({
  imports:      [   
    BrowserModule, 
    BrowserAnimationsModule, 
    FlexLayoutModule, 
    TextFieldModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    MatFormFieldModule,
    EmojiSupportModule.init( { emojiPath: "https://cdn.jsdelivr.net/npm/emoji-datasource-google@5.0.1/img/google/64/" }),
    EmojiImageModule,
    EmojiTextModule,
    EmojiInputModule,
    EmojiMaterialModule
  ],
  
  declarations: [ 
    AppComponent
  ],

  providers: [],
  
  bootstrap: [ AppComponent ]
})
export class AppModule { }

import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { EmojiLoader, EmojiConfig, EmojiConfigToken } from './loader';

@NgModule({
  imports: [ HttpClientModule ],
  providers: [ EmojiLoader ]
})
export class EmojiSupportModule { 

   static init(config: EmojiConfig): ModuleWithProviders<EmojiSupportModule> {
    return {
      ngModule: EmojiSupportModule,
      providers: [
        { provide: EmojiConfigToken, useValue: config }
      ]
    };
  } 
}
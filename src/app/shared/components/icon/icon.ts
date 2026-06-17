import { Component, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'calendar'
  | 'check'
  | 'book'
  | 'chart'
  | 'settings'
  | 'plus'
  | 'trash'
  | 'edit'
  | 'download'
  | 'upload'
  | 'moon'
  | 'sun'
  | 'menu'
  | 'x'
  | 'search';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html'
})
export class Icon {
  readonly name = input.required<IconName>();
}

import {Directive, Input} from '@angular/core';

@Directive({
  selector: '[appNgInit]'
})
export class NgInitDirective {
  @Input() ngInit;

  constructor() { }

  ngOnInit() {
    if (this.ngInit) {
      this.ngInit();
    }
  }

}

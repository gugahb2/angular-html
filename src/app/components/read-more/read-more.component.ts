import {AfterViewInit, Component, ElementRef, Input, OnInit} from "@angular/core";

/*@Component({
  selector: 'read-more',
  template: `
    <div [class.collapsed]="isCollapsed">
      <ng-content></ng-content>
    </div>
    <div (click)="isCollapsed = !isCollapsed">Read more</div>
  `,
  styles: [`
    div.collapsed {
      height: 3.5rem;
      overflow: hidden;
    }
  `]
})

export class ReadMoreComponent {
  isCollapsed = true;
}*/

@Component({
  selector: 'read-more',
  template: `<div style="margin-bottom: 1rem; clear: both; padding-left: 0.5rem; padding-top: 0.1rem;">
        <div [innerHTML]="text" [class.collapsed]="isCollapsed" [style.height]="isCollapsed ? maxHeight+'px' : 'auto'">
        </div>
            <a style="float: right;font-size:1rem; cursor: pointer;" *ngIf="isCollapsable" (click)="isCollapsed =! isCollapsed">Read {{isCollapsed? 'more...':'less'}}</a>
  </div>
    `,
  styles: [`
        div.collapsed {
            overflow: hidden;
        }
    `]
})
export class ReadMoreComponent implements AfterViewInit {

  //the text that need to be put in the container
  @Input() text: string;

  //maximum height of the container
  @Input() maxHeight: number = 100;

  //set these to false to get the height of the expended container
  public isCollapsed: boolean = false;
  public isCollapsable: boolean = false;

  constructor(private elementRef: ElementRef) {
  }

  ngAfterViewInit() {
    let currentHeight = this.elementRef.nativeElement.getElementsByTagName('div')[0].offsetHeight;
    //collapsable only if the contents make container exceed the max height
    if (currentHeight > this.maxHeight) {
      this.isCollapsed = true;
      this.isCollapsable = true;
    }
  }
}

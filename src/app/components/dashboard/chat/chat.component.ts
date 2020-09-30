import {Component, OnInit, ElementRef, ViewChild} from '@angular/core';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    @ViewChild('chatBlockPhoto') chatBlockEl: ElementRef;

    constructor() {
    }

    chatHeads = [...Array(20).keys()];
    status = false;
    FilterStatus = false;
    chatBlockHoverd = false;
    config = [];
    openUserChat = false;
    moreOptionPanel = false;

    ChatPanel($event) {
        $event.preventDefault();
        this.status = true;
    }

    FilterPanel($event) {
        $event.preventDefault();
        this.FilterStatus = true;
    }

    findClosest(el, sel) {
        while ((el = el.parentNode) && el.className.indexOf(sel) < 0) {
        }
        return el;
    }

    showFullDescrition($event) {
        $event.stopPropagation();
        var hoverdElement = this.findClosest($event.target, 'chat-block-head'),
            imageElement = hoverdElement.querySelectorAll('.chat-block-photo')[0],
            top = imageElement.getBoundingClientRect().top + 45,
            bottom = imageElement.getBoundingClientRect().bottom,
            left = imageElement.getBoundingClientRect().left,
            element = hoverdElement.querySelectorAll('.chat-block-hover')[0];

        if (
            hoverdElement.getBoundingClientRect().bottom + 100 >=
            document.body.getBoundingClientRect().height
        ) {
            var bottomValue =
                document.body.getBoundingClientRect().height - bottom + 55;
            element.style.bottom = bottomValue + 'px';

            element.style.left = left + 'px';
            element.style.top = 'auto';
        } else {
            element.style.bottom = 'auto';
            element.style.top = top + 'px';
            element.style.left = left + 'px';
        }

        setTimeout(() => {
            hoverdElement.classList.add('show-head-info');
        }, 800);
    }

    hideFullDescrition($event) {
        $event.stopPropagation();
        var hoverdElement = this.findClosest($event.target, 'chat-block-head'),
            imageElement = hoverdElement.querySelectorAll('.chat-block-photo')[0];
        setTimeout(() => {
            if (!this.chatBlockHoverd) {
                hoverdElement.classList.remove('show-head-info');
            }
        }, 800);
    }

    chatBlockHover($event) {
        this.chatBlockHoverd = true;
    }

    hideChatBlock($event) {
        $event.stopPropagation();
        setTimeout(() => {
            if (this.chatBlockHoverd) {
                var hoverdElement = this.findClosest($event.target, 'chat-block-head');
                hoverdElement.classList.remove('show-head-info');
                this.chatBlockHoverd = false;
            } else {
            }
        }, 800);
    }

    userProfileClick($event) {
        this.openUserChat = true;
    }

    moreOptionClick($event) {
        this.moreOptionPanel = true;
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
        // console.log(this.chatBlockEl.nativeElement);
        // this.chatBlockEl.nativeElement.addEventListener("mouseover", function (e) {
        //   var top = this.getBoundingClientRect().top + 45,
        //     left = this.getBoundingClientRect().left,
        //     element = this.parentElement.querySelectorAll(".chat-block-hover")[0];
        //   this.parentElement.classList.add("show-head-info");
        //   element.style.top = top + "px";
        //   element.style.left = left + "px";
        // });
    }
}

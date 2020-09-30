import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-groups",
  templateUrl: "./groups.component.html",
  styleUrls: ["./groups.component.scss"],
})
export class GroupsComponent implements OnInit {
  constructor() {}
  status = false;

  FindPanel($event) {
    $event.preventDefault();
    this.status = true;
  }

  ngOnInit(): void {}
}

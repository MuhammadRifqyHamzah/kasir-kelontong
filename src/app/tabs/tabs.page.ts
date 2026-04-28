import { Component } from '@angular/core';
import { IonTabs, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonRouterOutlet],
})
export class TabsPage {
  constructor() {}
}

import { Component } from '@angular/core';
import { EUI_PAGE } from '@eui/components/eui-page';

@Component({
    standalone: true,
    templateUrl: './page1.component.html',
    imports: [
        ...EUI_PAGE,
    ],
})
export class Page1Component {}

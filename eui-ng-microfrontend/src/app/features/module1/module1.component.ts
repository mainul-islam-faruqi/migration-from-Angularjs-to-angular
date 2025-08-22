import { Component } from '@angular/core';
import { EUI_PAGE } from '@eui/components/eui-page';

@Component({
    templateUrl: './module1.component.html',
    imports: [
        ...EUI_PAGE,
    ],
})
export class Module1Component {}

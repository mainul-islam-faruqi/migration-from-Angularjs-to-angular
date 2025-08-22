import { Component } from '@angular/core';
import { EUI_PAGE, EuiPageModule } from '@eui/components/eui-page';

@Component({
    templateUrl: './module2.component.html',
    imports: [
        ...EUI_PAGE,
    ],
})
export class Module2Component {}

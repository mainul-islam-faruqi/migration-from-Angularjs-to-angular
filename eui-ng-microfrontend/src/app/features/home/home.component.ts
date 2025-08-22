import { Component, Inject } from '@angular/core';
import { CONFIG_TOKEN, EuiAppConfig } from '@eui/core';
import { EUI_PAGE } from '@eui/components/eui-page';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    templateUrl: './home.component.html',
    imports: [
        TranslateModule,
        ...EUI_PAGE,
    ],
})
export class HomeComponent {
    constructor(@Inject(CONFIG_TOKEN) protected config: EuiAppConfig) {
        console.log(config);
    }
}

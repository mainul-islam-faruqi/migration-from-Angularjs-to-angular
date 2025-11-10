import { Component, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONFIG_TOKEN, EuiAppConfig } from '@eui/core';
import { EUI_PAGE } from '@eui/components/eui-page';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    standalone: true,
    templateUrl: './home.component.html',
    imports: [
        TranslateModule,
        ...EUI_PAGE,
        RouterLink,
    ],
})
export class HomeComponent {
    constructor(@Inject(CONFIG_TOKEN) protected config: EuiAppConfig) {
        console.log(config);
    }
}

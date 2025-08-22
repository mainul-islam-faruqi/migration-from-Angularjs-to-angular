import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EuiLayoutModule } from '@eui/components/layout';
import { EUI_LANGUAGE_SELECTOR } from '@eui/components/eui-language-selector';
import { EUI_USER_PROFILE } from '@eui/components/eui-user-profile';
import { EUI_ICON } from '@eui/components/eui-icon';
import { EuiMenuItem } from '@eui/components/eui-menu';

@Component({
    selector: 'app-root',
    template: `<eui-app>
    <eui-app-toolbar>
        <eui-toolbar>
            <eui-toolbar-logo/>
            <eui-toolbar-app appName="appName"/>
            <eui-toolbar-environment>MOCK</eui-toolbar-environment>

            <eui-toolbar-items>
                <eui-toolbar-item>
                    <eui-user-profile isShowAvatarInitials>
                        <eui-user-profile-menu>
                            <eui-user-profile-menu-item>
                                <eui-icon-svg icon="person:outline"/>{{ 'eui.my-profile-informations' | translate }}
                            </eui-user-profile-menu-item>
                            <eui-user-profile-menu-item>
                                <eui-icon-svg icon="log-out:outline"/>{{ 'eui.sign-out' | translate }}
                            </eui-user-profile-menu-item>
                        </eui-user-profile-menu>
                    </eui-user-profile>
                </eui-toolbar-item>

                <eui-toolbar-item>
                    <eui-notifications [count]="notificationItems?.length" [items]="notificationItems"></eui-notifications>
                </eui-toolbar-item>
            </eui-toolbar-items>

            <eui-language-selector/>
        </eui-toolbar>
    </eui-app-toolbar>
    <eui-app-sidebar>
        <eui-app-sidebar-body>
            <eui-app-sidebar-menu [items]="sidebarItems"/>
        </eui-app-sidebar-body>
    </eui-app-sidebar>
</eui-app>`,
    imports: [
        TranslateModule,
        EuiLayoutModule,
        ...EUI_ICON,
        ...EUI_USER_PROFILE,
        ...EUI_LANGUAGE_SELECTOR,
    ],
})
export class AppComponent {
    sidebarItems: EuiMenuItem[] = [
        { label: 'Home', url: 'screen/home' },
        { label: 'Module 1', url: 'screen/module1', children: [
            { label: 'page 1', url: 'screen/module1/page1' },
            { label: 'page 2', url: 'screen/module1/page2' },
        ] },
        { label: 'Module 2', url: 'screen/module2' },
    ];
    notificationItems = [
        { label: 'Title label 1', subLabel: 'Subtitle label' },
        { label: 'Title label 2', subLabel: 'Subtitle label' },
        { label: 'Title label 3', subLabel: 'Subtitle label' },
        { label: 'Title label 4', subLabel: 'Subtitle label' },
    ];
}

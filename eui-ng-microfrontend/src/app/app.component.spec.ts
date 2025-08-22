import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { EuiAppModule } from '@eui/components/layout';
import { routes } from './app.routes';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppStarterService } from './app-starter.service';
import { CONFIG_TOKEN, I18nService, I18nState, UserService} from '@eui/core';
import { EuiAppConfig } from '@eui/core';
import { Observable, of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let userServiceMock: SpyObj<UserService>;
    let i18nServiceMock: SpyObj<I18nService>;
    let configMock: EuiAppConfig;

    beforeEach(async () => {

        // Handle the overloaded getState method
        type GetStateReturnType<T> = T extends keyof I18nState ? Observable<I18nState[T]> : Observable<I18nState>;

        userServiceMock = jasmine.createSpyObj('UserService', ['init']);
        i18nServiceMock = jasmine.createSpyObj<I18nService>('I18nService', ['init', 'getState']);
        i18nServiceMock.getState.and.callFake(<K extends keyof I18nState>(key?: K): GetStateReturnType<K> => {
            if (typeof key === 'string') {
                return of({ activeLang: 'en' }[key]) as GetStateReturnType<K>;
            }
            return of({ activeLang: 'en' }) as GetStateReturnType<K>;
        });
        configMock = {global: {}, modules: {core: {base: 'localhost:3000', userDetails: 'dummy'}}};

        await TestBed.configureTestingModule({
            imports: [
                RouterModule.forRoot(routes),
                EuiAppModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                AppStarterService,
                {provide: UserService, useValue: userServiceMock},
                {provide: I18nService, useValue: i18nServiceMock},
                {provide: CONFIG_TOKEN, useValue: configMock},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
    });

    it('should create the app', () => {
        expect(component).toBeTruthy();
    });
});

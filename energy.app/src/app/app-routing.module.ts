import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { SelectivePreloadingStrategy } from './selective-preloading-strategy'
import { PageNotFoundComponent } from './page-not-found.component'
import {
  DynamicDashboardComponent, CallbackComponent, HomeComponent, UserListComponent, UserAddComponent, DashboardComponent,
  LoginComponent, RegisterComponent, MyProfileComponent,
  ChangePasswordComponent, AdminLoginComponent, SubscribersListComponent, HardwareListComponent, HardwareAddComponent,
  UserAdminListComponent, AdminUserAddComponent, AdminDashboardComponent, SubscriberDetailComponent, MeterAddComponent,
  BulkuploadAddComponent, MeterListComponent, RolesListComponent, RolesAddComponent,
  AddNewFacilityComponent, FacilityDashboardComponent, FacilityListComponent, AlertsComponent, ZoneListComponent, ZoneAddComponent, MeterDashboardComponent
} from './components/index'


import { AuthService, AdminAuthGuard } from './services/index'




const appRoutes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: '',
        component: AdminLoginComponent
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [AuthService]
      },
      {
        path: 'subscribers/:email/:productCode/:companyId',
        component: SubscriberDetailComponent,
        canActivate: [AuthService]
      },
      {
        path: 'subscribers',
        component: SubscribersListComponent,
        canActivate: [AuthService]
      },
      {
        path: 'hardwarekits',
        component: HardwareListComponent,
        canActivate: [AuthService]
      },
      {
        path: 'hardwarekits/bulkupload',
        component: BulkuploadAddComponent,
        canActivate: [AuthService]
      },
      {
        path: 'hardwarekits/addhardwarekit',
        component: HardwareAddComponent,
        canActivate: [AuthService]
      },
      {
        path: 'hardwarekits/:hardwarekitGuid',
        component: HardwareAddComponent,
        canActivate: [AuthService]
      },
      {
        path: 'users',
        component: UserAdminListComponent,
        canActivate: [AuthService]
      },
      {
        path: 'users/adduser',
        component: AdminUserAddComponent,
        canActivate: [AuthService]
      },
      {
        path: 'users/:userGuid',
        component: AdminUserAddComponent,
        canActivate: [AuthService]
      },

    ]
  },
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'callback',
    component: CallbackComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  //App routes goes here 
  {
    path: 'my-profile',
    component: MyProfileComponent,
    //canActivate: [AuthService]
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    //canActivate: [AuthService]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'zone',
    component: ZoneListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'zone/add',
    component: ZoneAddComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'zone/:zoneGuid',
    component: ZoneAddComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'meter/meter-dashboard/:meterGuid',
    component: MeterDashboardComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'meter',
    component: MeterListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'meter/add',
    component: MeterAddComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'alerts',
    component: AlertsComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'alerts/:facilityGuid/:deviceGuid',
    component: AlertsComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'users/:userGuid',
    component: UserAddComponent,
    canActivate: [AdminAuthGuard]
  }, {
    path: 'users/add',
    component: UserAddComponent,
    canActivate: [AdminAuthGuard]
  }, {
    path: 'users',
    component: UserListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'roles/:deviceGuid',
    component: RolesAddComponent,
    canActivate: [AdminAuthGuard]
  }, {
    path: 'roles',
    component: RolesListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'facilities',
    component: FacilityListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'facilities/:facilityGuid',
    component: AddNewFacilityComponent,
    canActivate: [AdminAuthGuard]
  }, {
    path: 'facilities/add',
    component: AddNewFacilityComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'facilities/facility-dashboard/:facilityGuid',
    component: FacilityDashboardComponent,
    pathMatch: 'full',
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'dynamic-dashboard',
    component: DynamicDashboardComponent,
    canActivate: [AdminAuthGuard]
  },

  {
    path: '**',
    component: PageNotFoundComponent
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes, {
      preloadingStrategy: SelectivePreloadingStrategy
    }
    )
  ],
  exports: [
    RouterModule
  ],
  providers: [
    SelectivePreloadingStrategy
  ]
})

export class AppRoutingModule { }

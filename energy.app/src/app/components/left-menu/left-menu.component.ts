import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'


@Component({
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css']
})

export class LeftMenuComponent implements OnInit {
  menuList: any = [];
  user_type: any;
  selectedMenu: any;
  currentUrl: any;
  isAdmin = false;
  constructor(private router: Router) { }

  ngOnInit() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.isAdmin = currentUser.userDetail.isAdmin;
    let tempUrl = (this.router.url).split('/');
    this.currentUrl = "/" + tempUrl[1];
    if (this.isAdmin) {
      this.menuList = [
        {
          name: 'Dashboard',
          link: '/admin/dashboard',
          li_color: '',
          icon: 'icon-dashboard',
          applylink: true
        },
        {
          name: 'Users',
          link: '/admin/users',
          li_color: '',
          icon: 'icon-usergroup',
          applylink: true
        },
        {
          name: 'Subscribers',
          link: '/admin/subscribers',
          li_color: '',
          icon: 'icon-subscribers',
          applylink: true
        },

      ];
    } else {
      this.menuList = [
        {
          name: 'Dashboard',
          link: '/dashboard',
          li_color: '',
          icon: 'icon-dashboard',
          applylink: true
        },
        {
          name: 'Facilities',
          link: "/facilities",
          li_color: '',
          icon: 'icon-facility',
          applylink: true
        },
        {
          name: 'zone',
          link: "/zone",
          li_color: '',
          icon: 'icon-zone',
          applylink: true
        },
        {
          name: 'Meters',
          link: "/meter",
          li_color: '',
          icon: 'icon-meters',
          applylink: true
        },
         {
				 	name: "Roles",
				 	link: "/roles",
				 	li_color: '',
				 	icon: 'icon-subscribers',
				 	applylink: true
				 },
				 {
				 	name: "Users",
				 	link: "/users",
				 	li_color: '',
				 	icon: 'icon-users',
				 	applylink: true
				 },
       
        {
          name: 'Alerts',
          link: '/alerts',
          li_color: '',
          icon: 'icon-alerts',
          applylink: true
        },
      ];
    }

  }

  manageNavigateUrl(url) {
    this.router.navigate([url]);
  }

  showSubMenu(menu) {
    menu.showSunMenu = !menu.showSunMenu;
  }

  onClickMenu(i) {
    this.currentUrl = false;
    this.selectedMenu = i;
  }
}

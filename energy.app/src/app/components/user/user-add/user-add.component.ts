import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms'
import { NgxSpinnerService } from 'ngx-spinner'
import { Notification, NotificationService } from 'app/services';
import { CustomValidators } from 'app/helpers/custom.validators';
import { UserService } from '../../../services';

@Component({
	selector: 'app-user-add',
	templateUrl: './user-add.component.html',
	styleUrls: ['./user-add.component.css']
})
export class UserAddComponent implements OnInit {
	public contactNoError:boolean=false;
	public mask = {
		guide: true,
		showMask: false,
		keepCharPositions: true,
		mask: ['(', /[0-9]/, /\d/, ')', '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/]
	};
	fileUrl: any;
	fileName = '';
	fileToUpload: any = null;
	status;
	moduleName = "Add User";
	userObject = {};
	userGuid = '';
	isEdit = false;
	userForm: FormGroup;
	checkSubmitStatus = false;
	buildingList = [];
	selectedBuilding = '';
	floorList = [];
	spaceList = [];
	roleList = [];
	cityList = [];
	buttonname = 'Submit'
	//arrystatus = [{ "name": "Active", "value": true }, { "name": "Inactive", "value": false }]
	timezoneList = [];
	enitityList = [];
	constructor(
		private formBuilder: FormBuilder,
		private router: Router,
		private _notificationService: NotificationService,
		private activatedRoute: ActivatedRoute,
		private spinner: NgxSpinnerService,
		public userService: UserService,
		
	) {
		this.activatedRoute.params.subscribe(params => {
			if (params.userGuid != 'add') {
				this.getUserDetails(params.userGuid);
				this.userGuid = params.userGuid;
				this.moduleName = "Edit User";
				this.isEdit = true;
				this.buttonname = 'Update'
			} else {
				this.userObject = { firstName: '', lastName: '', email: '', contactNo: '', roleGuid: '', timezoneGuid: '', isActive: '' }
			}
		});
		this.createFormGroup();
	}

	ngOnInit() {
		this.getRoleList();
		this.getTimezoneList();
		//this.getEntityList();

	}

	/**
	* For create form
	**/
	createFormGroup() {
		this.userForm = new FormGroup({
			firstName: new FormControl('', [Validators.required, Validators.pattern('^[A-Za-z0-9 ]+$')]),
			lastName: new FormControl('', [Validators.required, Validators.pattern('^[A-Za-z0-9 ]+$')]),
			email: new FormControl('', [Validators.required, Validators.email,Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
			contactNo: new FormControl('', [Validators.required]),
			entityGuid: new FormControl(''),
			isActive: new FormControl('', [Validators.required]),
			roleGuid: new FormControl(null, [Validators.required]),
			timeZoneGuid: new FormControl('', [Validators.required])
		}), {
			validators: CustomValidators.checkPhoneValue('contactNo')
		};
		// this.userForm = this.formBuilder.group({
		// 	firstName: ['', Validators.required,Validators.pattern('^[A-Za-z0-9 ]+$')],
		// 	lastName: ['', Validators.required],
		// 	email: ['', [Validators.required, Validators.email]],
		// 	contactNo: ['', Validators.required],
		// 	entityGuid: [''],
		// 	isActive: ['', Validators.required],
		// 	roleGuid: [null, Validators.required],
		// 	timeZoneGuid: ['', Validators.required]
		// },{
		// 	validators : CustomValidators.checkPhoneValue('contactNo')
		// });
	}

	/**
	* For get role list
	**/
	getRoleList() {
		this.spinner.show();
		this.userService.getroleList().subscribe(response => {
			this.spinner.hide();
			this.roleList = response.data;
		});
	}

	/**
	* For get time zone list
	**/
	getTimezoneList() {
		this.spinner.show();
		this.userService.getTimezoneList().subscribe(response => {
			this.spinner.hide();
			this.timezoneList = response.data;
		});
	}

	

	/**
	* For add new user
	**/
	addUser() {
		this.checkSubmitStatus = true;
    let contactNo = this.userForm.value.contactNo.replace("(", "")
    let contactno = contactNo.replace(")", "")
    let finalcontactno = contactno.replace("-", "")
    if(finalcontactno.match(/^0+$/)){
      this.contactNoError=true;
      return
    } else {
      this.contactNoError=false;
    }
		if (this.isEdit) {
			this.userForm.registerControl("id", new FormControl(''));
			this.userForm.patchValue({ "id": this.userGuid });
			this.userForm.get('isActive').setValue(this.userObject['isActive']);
		}
		else {
			this.userForm.get('isActive').setValue(true);
		}
		if (this.userForm.status === "VALID") {
			this.spinner.show();

			let currentUser = JSON.parse(localStorage.getItem('currentUser'));
			this.userForm.get('entityGuid').setValue(currentUser.userDetail.entityGuid);
			this.userForm.get('contactNo').setValue(contactno);
			this.userService.addUser(this.userForm.value).subscribe(response => {
				if (response.isSuccess === true) {
					this.spinner.hide();
					if (response.data.updatedBy != null) {
						this._notificationService.handleResponse({message:"User has been updated successfully."},"success");
					} else {
						this._notificationService.handleResponse({message:"User has been added successfully."},"success");
					}
					this.router.navigate(['/users']);
				} else {
					this.spinner.hide();
					this._notificationService.handleResponse(response,"error");
				}
			})
		}
	}

	/**
	* For get user detail
	**/
	getUserDetails(userGuid) {
		this.spinner.show();
		this.userService.getUserDetails(userGuid).subscribe(response => {
			this.spinner.hide();
			if (response.isSuccess === true) {
				this.userObject = response.data;
				//this.fileUrl = this.deviceObject['image'];
			}
		});
	}

	/**
	* For convert text to lowercase
	**/
	getdata(val) {
		return val = val.toLowerCase();
	}
}

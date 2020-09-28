"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@angular/core/testing");
var facility_service_1 = require("./facility.service");
describe('FacilityService', function () {
    beforeEach(function () { return testing_1.TestBed.configureTestingModule({}); });
    it('should be created', function () {
        var service = testing_1.TestBed.get(facility_service_1.FacilityService);
        expect(service).toBeTruthy();
    });
});
//# sourceMappingURL=facility.service.spec.js.map
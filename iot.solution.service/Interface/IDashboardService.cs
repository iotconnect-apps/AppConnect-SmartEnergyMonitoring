using System;
using System.Collections.Generic;
using Entity = iot.solution.entity;
using Response = iot.solution.entity.Response;

namespace iot.solution.service.Interface
{
    public interface IDashboardService
    {
        List<Entity.LookupItem> GetEntityLookup(Guid companyId);
        Entity.BaseResponse<Entity.DashboardOverviewResponse> GetOverview();
        Entity.BaseResponse<Entity.EntityOverviewResponse> GetFacilityOverview(Guid facilityId);
        Entity.BaseResponse<Response.DeviceDetailResponse> GetDeviceDetail(Guid deviceId);
        #region Dynamic Dashboard
        public Entity.ActionStatus ManageMasterWidget(Entity.MasterWidget request);
        public List<Entity.MasterWidget> GetMasterWidget();
        public Entity.MasterWidget GetMasterWidgetById(Guid Id);
        Entity.ActionStatus DeleteMasterWidget(Guid id);

        public Entity.ActionStatus ManageUserWidget(Entity.UserDasboardWidget request);
        public List<Entity.UserDasboardWidget> GetUserWidget();
        public Entity.UserDasboardWidget GetUserWidgetById(Guid Id);
        Entity.ActionStatus DeleteUserWidget(Guid id);
        #endregion

    }
}

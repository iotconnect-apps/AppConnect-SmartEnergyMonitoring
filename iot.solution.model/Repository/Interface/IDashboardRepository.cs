using System;
using System.Collections.Generic;
using System.Text;
using Model = iot.solution.model.Models;
using Entity = iot.solution.entity;
using Response = iot.solution.entity.Response;

namespace iot.solution.model.Repository.Interface
{
    public interface IDashboardRepository:IGenericRepository<Model.Device>
    {
        public Entity.BaseResponse<List<Entity.DashboardOverviewResponse>> GetStatistics();
        public Entity.BaseResponse<List<Entity.EntityOverviewResponse>> GetFacilityOverview(Guid facilityId );

        #region Device
        public Entity.BaseResponse<List<Response.DeviceDetailResponse>> GetDeviceDetail(Guid deviceId);
        #endregion
    }
}

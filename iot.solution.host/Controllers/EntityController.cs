using host.iot.solution.Filter;
using iot.solution.entity.Structs.Routes;
using iot.solution.service.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Net;
using Entity = iot.solution.entity;

namespace host.iot.solution.Controllers
{
    [Route(FacilityRoute.Route.Global)]
    [ApiController]
    public class EntityController : BaseController
    {
        private readonly IEntityService _service;
        private readonly IDeviceService _deviceService;
        private readonly ILookupService _lookupService;

        public EntityController(IEntityService locationService, IDeviceService deviceService, ILookupService lookupService)
        {
            _service = locationService;
            _deviceService = deviceService;
            _lookupService = lookupService;
        }

        [HttpGet]
        [Route(FacilityRoute.Route.GetList, Name = FacilityRoute.Name.GetList)]
        public Entity.BaseResponse<List<Entity.EntityWithCounts>> Get()
        {
            Entity.BaseResponse<List<Entity.EntityWithCounts>> response = new Entity.BaseResponse<List<Entity.EntityWithCounts>>(true);
            try
            {
                response.Data = _service.Get();

                //foreach (var item in response.Data)
                //{
                //    item.TotalDevices = 11;
                //    //item.TotalUsers = 15;
                //}
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<List<Entity.EntityWithCounts>>(false, ex.Message);
            }
            return response;
        }

        [HttpGet]
        [Route(FacilityRoute.Route.GetById, Name = FacilityRoute.Name.GetById)]
        [EnsureGuidParameterAttribute("id", "Facility")]
        public Entity.BaseResponse<Entity.Entity> Get(string id)
        {
            if (id == null || id == string.Empty)
            {
                return new Entity.BaseResponse<Entity.Entity>(false, "Invalid Request");
            }

            Entity.BaseResponse<Entity.Entity> response = new Entity.BaseResponse<Entity.Entity>(true);
            try
            {
                response.Data = _service.Get(Guid.Parse(id));

                //response.Data.TotalDisconnectedDevices = 1;
                //response.Data.TotalEneryGenerated = 3000;
                //response.Data.TotalFuelUsed = 30;
                //response.Data.TotalDevices = _deviceService.Get()?;
                //response.Data.TotalOffDevices = 1;
                //response.Data.TotalOnConnectedDevices = 3;
                response.Data.Devices = _deviceService.GetEntityWiseDevices(Guid.Parse(id));
                
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.Entity>(false, ex.Message);
            }
            return response;
        }

        [HttpPost]
        [Route(FacilityRoute.Route.Manage, Name = FacilityRoute.Name.Add)]
        public Entity.BaseResponse<Entity.Entity> Manage([FromForm]Entity.EntityModel request)
        {

            Entity.BaseResponse<Entity.Entity> response = new Entity.BaseResponse<Entity.Entity>(false);
            try
            {

                var status = _service.Manage(request);
                if(status.Success)
                {
                    response.IsSuccess = status.Success;
                    response.Message = status.Message;
                    response.Data = status.Data;
                }
                else
                {
                    response.IsSuccess = status.Success;
                    response.Message = status.Message;
                }
               
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.Entity>(false, ex.Message);
            }
            return response;
        }

        [HttpPut]
        [Route(FacilityRoute.Route.Delete, Name = FacilityRoute.Name.Delete)]
        [EnsureGuidParameterAttribute("id", "Facility")]
        public Entity.BaseResponse<bool> Delete(string id)
        {
            if (id == null || id == string.Empty)
            {
                return new Entity.BaseResponse<bool>(false, "Invalid Request");
            }

            Entity.BaseResponse<bool> response = new Entity.BaseResponse<bool>(true);
            try
            {
                var status = _service.Delete(Guid.Parse(id));
                response.IsSuccess = status.Success;
                response.Message = status.Message;
                response.Data = status.Success;
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<bool>(false, ex.Message);
            }
            return response;
        }
       
        [HttpPut]
        [Route(FacilityRoute.Route.DeleteImage, Name = FacilityRoute.Name.DeleteImage)]
        [EnsureGuidParameterAttribute("id", "Facility")]
        public Entity.BaseResponse<bool> DeleteImage(string id)
        {
            Entity.BaseResponse<bool> response = new Entity.BaseResponse<bool>(true);
            try
            {
                var status = _service.DeleteImage(Guid.Parse(id));
                response.IsSuccess = status.Success;
                response.Message = status.Message;
                response.Data = status.Success;
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<bool>(false, ex.Message);
            }
            return response;
        }
        [HttpGet]
        [Route(FacilityRoute.Route.BySearch, Name = FacilityRoute.Name.BySearch)]
        public Entity.BaseResponse<Entity.SearchResult<List<Entity.EntityDetail>>> GetBySearch(string parentEntityGuid = "", string searchText = "", int? pageNo = 1, int? pageSize = 10, string orderBy = "")
        {
            Entity.BaseResponse<Entity.SearchResult<List<Entity.EntityDetail>>> response = new Entity.BaseResponse<Entity.SearchResult<List<Entity.EntityDetail>>>(true);
            try
            {
                response.Data = _service.List(new Entity.SearchRequest()
                {
                    EntityId = string.IsNullOrEmpty(parentEntityGuid) ? Guid.Empty : new Guid(parentEntityGuid),
                    SearchText = searchText,
                    PageNumber = -1,//pageNo.Value,
                    PageSize = -1,//pageSize.Value,
                    OrderBy = orderBy
                });
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.SearchResult<List<Entity.EntityDetail>>>(false, ex.Message);
            }
            return response;
        }

        [HttpGet]
        [Route(FacilityRoute.Route.ZoneSearch, Name = FacilityRoute.Name.ZoneSearch)]
        public Entity.BaseResponse<Entity.SearchResult<List<Entity.ZoneDetail>>> GetByZoneSearch(string parentEntityGuid = "", string searchText = "", int? pageNo = 1, int? pageSize = 10, string orderBy = "")
        {
            Entity.BaseResponse<Entity.SearchResult<List<Entity.ZoneDetail>>> response = new Entity.BaseResponse<Entity.SearchResult<List<Entity.ZoneDetail>>>(true);
            try
            {
                response.Data = _service.ZoneList(new Entity.SearchRequest()
                {
                    EntityId = string.IsNullOrEmpty(parentEntityGuid) ? Guid.Empty : new Guid(parentEntityGuid),
                    SearchText = searchText,
                    PageNumber = -1,//pageNo.Value,
                    PageSize = -1,//pageSize.Value,
                    OrderBy = orderBy
                });
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.SearchResult<List<Entity.ZoneDetail>>>(false, ex.Message);
            }
            return response;
        }

        [HttpPost]
        [Route(FacilityRoute.Route.UpdateStatus, Name = FacilityRoute.Name.UpdateStatus)]
        [EnsureGuidParameterAttribute("id", "Facility")]
        public Entity.BaseResponse<bool> UpdateStatus(string id, bool status)
        {
            Entity.BaseResponse<bool> response = new Entity.BaseResponse<bool>(true);
            try
            {
                Entity.ActionStatus result = _service.UpdateStatus(Guid.Parse(id), status);
                response.IsSuccess = result.Success;
                response.Message = result.Message;
                response.Data = result.Success;
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<bool>(false, ex.Message);
            }
            return response;
        }

        #region Mobile API
        [HttpGet]
        [Route(FacilityRoute.Route.TabletBySearch, Name = FacilityRoute.Name.TabletBySearch)]
        public Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>> GetBySearchForTablet(string parentEntityGuid = "", string searchText = "", int? pageNo = 1, int? pageSize = 10, string orderBy = "")
        {
            Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>> response = new Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>>(true);
            try
            {
                response.Data = _service.TabletEntityList(new Entity.SearchRequest()
                {
                    EntityId = string.IsNullOrEmpty(parentEntityGuid) ? Guid.Empty : new Guid(parentEntityGuid),
                    SearchText = searchText,
                    PageNumber = -1,//pageNo.Value,
                    PageSize = -1,//pageSize.Value,
                    OrderBy = orderBy
                });
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>>(false, ex.Message);
            }
            return response;
        }

        [HttpGet]
        [Route(FacilityRoute.Route.TabletZoneSearch, Name = FacilityRoute.Name.TabletZoneSearch)]
        public Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletZoneDetail>>> TabletZoneSearch(string parentEntityGuid = "", string searchText = "", int? pageNo = 1, int? pageSize = 10, string orderBy = "")
        {
            Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletZoneDetail>>> response = new Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletZoneDetail>>>(true);
            try
            {
                response.Data = _service.TabletZoneList(new Entity.SearchRequest()
                {
                    EntityId = string.IsNullOrEmpty(parentEntityGuid) ? Guid.Empty : new Guid(parentEntityGuid),
                    SearchText = searchText,
                    PageNumber = -1,//pageNo.Value,
                    PageSize = -1,//pageSize.Value,
                    OrderBy = orderBy
                });
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletZoneDetail>>>(false, ex.Message);
            }
            return response;
        }

        [HttpPost]
        [Route(FacilityRoute.Route.MSearch, Name = FacilityRoute.Name.MSearch)]
        public Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>> GetBySearchForAndroid(Entity.DeviceSearchRequest request)
        {
            Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>> response = new Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>>(true);
            try
            {
                response.Data = _service.TabletEntityList(new Entity.SearchRequest()
                {
                    EntityId = string.IsNullOrEmpty(request.ParentEntityGuid) ? Guid.Empty : new Guid(request.ParentEntityGuid),
                    SearchText = request.SearchText,
                    PageNumber = -1,//pageNo.Value,
                    PageSize = -1,//pageSize.Value,
                    OrderBy = request.OrderBy
                });
            }
            catch (Exception ex)
            {
                base.LogException(ex);
                return new Entity.BaseResponse<Entity.SearchResult<List<Entity.TabletEntityDetail>>>(false, ex.Message);
            }
            return response;
        }
        #endregion


    }
}
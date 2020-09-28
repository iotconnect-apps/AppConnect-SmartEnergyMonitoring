using System;
using System.Collections.Generic;
using Entity = iot.solution.entity;
using Response = iot.solution.entity.Response;

namespace iot.solution.service.Interface
{
    public interface IEntityService
    {
        List<Entity.EntityWithCounts> Get();
        Entity.Entity Get(Guid id);
        Entity.ActionStatus Manage(Entity.EntityModel request);
        Entity.ActionStatus Delete(Guid id);
        Entity.ActionStatus DeleteImage(Guid id);
        Entity.SearchResult<List<Entity.EntityDetail>> List(Entity.SearchRequest request);
        Entity.SearchResult<List<Entity.ZoneDetail>> ZoneList(Entity.SearchRequest request);
        Entity.ActionStatus UpdateStatus(Guid id, bool status);
        Response.EntityDetailResponse GetEntityDetail(Guid locationId);

        #region Mobile API
        Entity.SearchResult<List<Entity.TabletEntityDetail>> TabletEntityList(Entity.SearchRequest request);
        Entity.SearchResult<List<Entity.TabletZoneDetail>> TabletZoneList(Entity.SearchRequest request);
        #endregion

    }
}

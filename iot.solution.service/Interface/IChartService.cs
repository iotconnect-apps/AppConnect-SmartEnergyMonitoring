using System;
using System.Collections.Generic;
using Entity = iot.solution.entity;
using Request = iot.solution.entity.Request;
using Response = iot.solution.entity.Response;

namespace iot.solution.service.Interface
{
    public interface IChartService
    {
        Entity.ActionStatus TelemetrySummary_DayWise();
        Entity.ActionStatus TelemetrySummary_HourWise();
        Entity.BaseResponse<Response.EnergyConsumptionFacilityCount> GetEnergyConsumptionByFacility(string request);
        Entity.BaseResponse<List<Response.EnergyConsumption>> GetEnergyUsage(Request.ChartRequest request);
        Entity.BaseResponse<List<Response.EnergyConsumptionByMeter>> GetEnergyConsumptionByMeter(Request.ChartRequest request);
    }
}

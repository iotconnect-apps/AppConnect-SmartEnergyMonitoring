using System;
using System.Collections.Generic;
using System.Text;

namespace iot.solution.entity.Structs.Routes
{
    public class ChartRoute
    {
        public struct Name
        {
            public const string GetEnergyConsumptionByMeter = "chart.getenergyconsumptionbymeter";
            public const string EnergyConsumption = "chart.energyconsumption";
            public const string EnergyConsumptionByFacility = "chart.getenergyconsumptionbyfacility";
        }

        public struct Route
        {
            public const string Global = "api/chart";
            public const string GetEnergyConsumptionByMeter = "getenergyconsumptionbymeter";
            public const string EnergyConsumption = "getenergyconsumption";
            public const string EnergyConsumptionByFacility = "getenergyconsumptionbyfacility/{frequency}";
        }
    }
}

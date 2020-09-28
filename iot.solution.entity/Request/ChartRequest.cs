using System;
using System.Collections.Generic;

namespace iot.solution.entity.Request
{
    public class ChartRequest
    {
        public Guid? CompanyGuid { get; set; }
        public Guid? EntityGuid { get; set; }
        public Guid? DeviceGuid { get; set; }
        public string Frequency { get; set; }
    }
}

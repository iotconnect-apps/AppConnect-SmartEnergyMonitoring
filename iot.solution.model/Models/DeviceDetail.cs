using System;
using System.Collections.Generic;
using System.Text;

namespace iot.solution.model.Models
{
    public partial class DeviceDetail : Device
    {
        public string TotalConsumption { get; set; }
        public string CurrentReading { get; set; }
        public bool IsConnected { get; set; }
        public int TotalAlert { get; set; }
        public string Status { get; set; }
        public string CurrentEnergy { get; set; }
        public string EntityName { get; set; }
        public string SubEntityName { get; set; }
    }
}

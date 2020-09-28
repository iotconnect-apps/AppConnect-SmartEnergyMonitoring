using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace iot.solution.entity
{
    //Zone
    public class Device
    {
        public Guid? Guid { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        public string EntityName { get; set; }
        public string SubEntityName { get; set; }
        public Guid TemplateGuid { get; set; }        
        public Guid CompanyGuid{ get; set; }
        [Required]
        public Guid? EntityGuid { get; set; }
        [Required]
        public string UniqueId { get; set; }        
        public string Image { get; set; }
        public string KitCode { get; set; }
        public string Tag { get; set; }
        public string Note { get; set; }
        public bool IsProvisioned { get; set; }
        public bool? IsActive { get; set; }
        public string Description { get; set; }
        public string Specification { get; set; }
        public Guid TypeGuid { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedDate { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public Guid? UpdatedBy { get; set; }

    }

    public class DeviceDetail : Device
    {
        public string TotalConsumption { get; set; }
        public string CurrentReading { get; set; }
        public bool IsConnected { get; set; }
        public int TotalAlert { get; set; }
        public string Status { get; set; }
        public string VoltageReading { get; set; }
        public string CurrentEnergy { get; set; }

    }
    public class DeviceDetailMobile
    {
        public Guid? Guid { get; set; }
        public string Name { get; set; }
        public string UniqueId { get; set; }
        public string EntityName { get; set; }
        public string SubEntityName { get; set; }
        public string CurrentEnergy { get; set; }
        public bool IsConnected { get; set; }
        public int TotalAlert { get; set; }
       

    }
    public class DeviceModel : Device
    {
        public IFormFile ImageFile { get; set; }

    }

}

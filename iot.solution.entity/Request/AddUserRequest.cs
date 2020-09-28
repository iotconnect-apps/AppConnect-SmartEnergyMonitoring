using System;
using System.ComponentModel.DataAnnotations;

namespace iot.solution.entity
{
    public class AddUserRequest
    {
        [Key]
        public Guid Id { get; set; }
        [MaxLength(50)]
        [EmailAddress(ErrorMessage = "Invalid Email Address")]
        public string Email { get; set; }
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }
        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }
        [Required]
        public Guid TimeZoneGuid { get; set; }
        [MaxLength(100)]
        public string ImageName { get; set; }
        [MaxLength(25)]
        [Required]
        public string ContactNo { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public Guid? EntityGuid { get; set; }
        public Guid? RoleGuid { get; set; }
    }
}

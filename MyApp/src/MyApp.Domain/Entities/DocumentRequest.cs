using MyApp.Domain.Common;
using MyApp.Shared.Enums;

namespace MyApp.Domain.Entities;

/// <summary>
/// A resident's request for a barangay document (Barangay Clearance or
/// Certificate of Indigency). Processed by staff: pending review, printing
/// (ready for pickup) and release/claiming at the barangay hall.
/// </summary>
public class DocumentRequest : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DocumentType DocumentType { get; set; }

    /// <summary>Why the document is needed (work, scholarship, medical assistance, ...).</summary>
    public string Purpose { get; set; } = string.Empty;

    public DocumentRequestStatus Status { get; set; } = DocumentRequestStatus.Pending;

    /// <summary>Tracking number printed on the receipt, e.g. "REQ-2026-0001".</summary>
    public string ReferenceNumber { get; set; } = string.Empty;

    /// <summary>Staff note accompanying approval/rejection.</summary>
    public string? AdminRemarks { get; set; }

    public int? ProcessedByUserId { get; set; }
    public User? ProcessedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? ReleasedAt { get; set; }
}

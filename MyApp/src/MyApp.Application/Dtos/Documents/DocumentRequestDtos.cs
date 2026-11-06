using MyApp.Shared.Enums;

namespace MyApp.Application.Dtos.Documents;

public class CreateDocumentRequestRequest
{
    /// <summary>"BarangayClearance" or "CertificateOfIndigency".</summary>
    public string DocumentType { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
}

public class UpdateDocumentRequestStatusRequest
{
    /// <summary>"Approved", "ReadyForPickup", "Released" or "Rejected".</summary>
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class DocumentRequestDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AdminRemarks { get; set; }

    public int UserId { get; set; }
    public string ResidentName { get; set; } = string.Empty;
    public string? ResidentAddress { get; set; }
    public string? ResidentContact { get; set; }

    public int? ProcessedByUserId { get; set; }
    public string? ProcessedByName { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? ReleasedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Counts per status, for the admin dashboard / cards.</summary>
public class DocumentRequestStatsDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int ReadyForPickup { get; set; }
    public int Released { get; set; }
    public int Rejected { get; set; }

    public int ClearanceRequests { get; set; }
    public int IndigencyRequests { get; set; }
}

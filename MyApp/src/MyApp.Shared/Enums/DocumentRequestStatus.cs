namespace MyApp.Shared.Enums;

/// <summary>Lifecycle of a barangay document request (clearance / indigency).</summary>
public enum DocumentRequestStatus
{
    /// <summary>Submitted by the resident; waiting for barangay review.</summary>
    Pending = 0,

    /// <summary>Verified by staff; document is being prepared.</summary>
    Approved = 1,

    /// <summary>Printed and awaiting pickup at the barangay hall.</summary>
    ReadyForPickup = 2,

    /// <summary>Claimed by the resident.</summary>
    Released = 3,

    /// <summary>Denied (reason is stored in AdminRemarks).</summary>
    Rejected = 4,
}

/// <summary>Supported document types for barangay requests.</summary>
public enum DocumentType
{
    /// <summary>Barangay Clearance.</summary>
    BarangayClearance = 0,

    /// <summary>Certificate of Indigency.</summary>
    CertificateOfIndigency = 1,
}

using MyApp.Application.Dtos.Documents;
using MyApp.Domain.Entities;

namespace MyApp.Application.Common.Mapping;

/// <summary>Entity-to-DTO mappers for the document request module.</summary>
public static class DocumentRequestMappingExtensions
{
    public static DocumentRequestDto ToDto(this DocumentRequest d) => new()
    {
        Id = d.Id,
        ReferenceNumber = d.ReferenceNumber,
        DocumentType = d.DocumentType.ToString(),
        Purpose = d.Purpose,
        Status = d.Status.ToString(),
        AdminRemarks = d.AdminRemarks,
        UserId = d.UserId,
        ResidentName = d.User?.FullName ?? string.Empty,
        ResidentAddress = d.User?.Address,
        ResidentContact = d.User?.ContactNumber,
        ProcessedByUserId = d.ProcessedByUserId,
        ProcessedByName = d.ProcessedBy?.FullName,
        ProcessedAt = d.ProcessedAt,
        ReleasedAt = d.ReleasedAt,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt ?? d.CreatedAt,
    };
}

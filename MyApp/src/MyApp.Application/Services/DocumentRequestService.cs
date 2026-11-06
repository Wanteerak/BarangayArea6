using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Extensions;
using MyApp.Application.Common.Helpers;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Common.Mapping;
using MyApp.Application.Dtos.Documents;
using MyApp.Domain.Abstractions;
using MyApp.Domain.Entities;
using MyApp.Shared.Enums;
using MyApp.Shared.Exceptions;
using MyApp.Shared.Models;

namespace MyApp.Application.Services;

public class DocumentRequestService : IDocumentRequestService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _current;

    public DocumentRequestService(IApplicationDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    /// <summary>
    /// Paged list for the admin console. Staff see every request;
    /// residents silently only see their own.
    /// </summary>
    public async Task<PagedResult<DocumentRequestDto>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.DocumentRequests
            .Include(d => d.User)
            .Include(d => d.ProcessedBy)
            .AsNoTracking()
            .AsQueryable();

        if (!_current.IsStaff)
            q = q.Where(d => d.UserId == _current.UserId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(d =>
                d.ReferenceNumber.Contains(s) ||
                d.Purpose.Contains(s) ||
                d.User.FullName.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (TryParseStatus(query.Status, out var status))
                q = q.Where(d => d.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Type))
        {
            if (Enum.TryParse<DocumentType>(query.Type.Trim(), true, out var type))
                q = q.Where(d => d.DocumentType == type);
        }

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "name" => query.IsDescending ? q.OrderByDescending(d => d.User.FullName) : q.OrderBy(d => d.User.FullName),
            "type" => query.IsDescending ? q.OrderByDescending(d => d.DocumentType) : q.OrderBy(d => d.DocumentType),
            "status" => query.IsDescending ? q.OrderByDescending(d => d.Status) : q.OrderBy(d => d.Status),
            _ => query.IsDescending ? q.OrderByDescending(d => d.Id) : q.OrderBy(d => d.Id)
        };

        return await q.ToPagedResultAsync(query, d => d.ToDto(), ct);
    }

    public async Task<DocumentRequestDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var request = await _db.DocumentRequests
            .Include(d => d.User)
            .Include(d => d.ProcessedBy)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundAppException("Document request not found.");

        if (!_current.IsStaff && request.UserId != _current.UserId)
            throw new ForbiddenAppException("You can only view your own document requests.");

        return request.ToDto();
    }

    public async Task<DocumentRequestDto> CreateAsync(CreateDocumentRequestRequest request, int userId, CancellationToken ct = default)
    {
        if (!TryParseDocumentType(request.DocumentType, out var documentType))
            throw new ValidationAppException(
                "Unsupported document type. Use BarangayClearance or CertificateOfIndigency.");

        var purpose = Guard.NotEmpty(request.Purpose, "Purpose", 2000);

        var pendingCount = await _db.DocumentRequests
            .CountAsync(d => d.UserId == userId && d.Status == DocumentRequestStatus.Pending, ct);
        if (pendingCount >= 3)
            throw new ValidationAppException(
                "You already have 3 requests being processed. Please wait until they are approved or released.");

        var entity = new DocumentRequest
        {
            UserId = userId,
            DocumentType = documentType,
            Purpose = purpose,
            Status = DocumentRequestStatus.Pending,
            ReferenceNumber = await NextReferenceNumberAsync(ct),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Add(entity);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(entity.Id, ct);
    }

    /// <summary>Staff-only status transitions: approve, print (ready), release/claim, reject.</summary>
    public async Task<DocumentRequestDto> UpdateStatusAsync(int id, UpdateDocumentRequestStatusRequest request, int actingUserId, CancellationToken ct = default)
    {
        if (!_current.IsStaff)
            throw new ForbiddenAppException("Only barangay staff can process document requests.");

        if (!TryParseStatus(request.Status, out var next))
            throw new ValidationAppException(
                "Unsupported status. Use Approved, ReadyForPickup, Released or Rejected.");

        var entity = await _db.DocumentRequests.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundAppException("Document request not found.");

        // Allowed lifecycle: Pending -> Approved/Rejected -> ReadyForPickup -> Released.
        var illegal = next switch
        {
            DocumentRequestStatus.Approved when entity.Status is not DocumentRequestStatus.Pending
                => "Only pending requests can be approved.",
            DocumentRequestStatus.ReadyForPickup when entity.Status is not DocumentRequestStatus.Approved
                => "Only approved requests can be marked ready for pickup.",
            DocumentRequestStatus.Released when entity.Status is not DocumentRequestStatus.ReadyForPickup
                => "The document must be ready for pickup before it can be released.",
            DocumentRequestStatus.Rejected when entity.Status is DocumentRequestStatus.Released
                => "A released document can no longer be rejected.",
            _ => null
        };
        if (illegal is not null)
            throw new ValidationAppException(illegal);

        entity.Status = next;
        entity.AdminRemarks = Guard.Optional(request.Remarks, "Remarks", 1000);
        if (next == DocumentRequestStatus.Rejected && string.IsNullOrWhiteSpace(entity.AdminRemarks))
            throw new ValidationAppException("Please state the reason for the rejection.");

        entity.ProcessedByUserId = actingUserId;
        entity.ProcessedAt = DateTime.UtcNow;
        if (next == DocumentRequestStatus.Released)
            entity.ReleasedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (!_current.IsHeadAdmin)
            throw new ForbiddenAppException("Only the head admin can delete document requests.");

        var entity = await _db.DocumentRequests.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundAppException("Document request not found.");

        _db.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<DocumentRequestStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var requests = await _db.DocumentRequests.AsNoTracking().ToListAsync(ct);

        return new DocumentRequestStatsDto
        {
            Total = requests.Count,
            Pending = requests.Count(r => r.Status == DocumentRequestStatus.Pending),
            Approved = requests.Count(r => r.Status == DocumentRequestStatus.Approved),
            ReadyForPickup = requests.Count(r => r.Status == DocumentRequestStatus.ReadyForPickup),
            Released = requests.Count(r => r.Status == DocumentRequestStatus.Released),
            Rejected = requests.Count(r => r.Status == DocumentRequestStatus.Rejected),
            ClearanceRequests = requests.Count(r => r.DocumentType == DocumentType.BarangayClearance),
            IndigencyRequests = requests.Count(r => r.DocumentType == DocumentType.CertificateOfIndigency),
        };
    }

    private async Task<string> NextReferenceNumberAsync(CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var countThisYear = await _db.DocumentRequests.LongCountAsync(ct);
        // Reference numbers are unique because Id is monotonic; encode the year plus sequence.
        return $"REQ-{year}-{countThisYear + 1:D4}";
    }

    private static bool TryParseStatus(string? raw, out DocumentRequestStatus status)
        => Enum.TryParse(raw?.Trim(), true, out status);

    private static bool TryParseDocumentType(string? raw, out DocumentType type)
        => Enum.TryParse(raw?.Trim(), true, out type);
}

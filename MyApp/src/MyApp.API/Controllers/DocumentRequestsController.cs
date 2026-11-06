using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Common;
using MyApp.Application.Common.Interfaces;
using MyApp.Application.Dtos.Documents;
using MyApp.Shared.Constants;
using MyApp.Shared.Models;

namespace MyApp.API.Controllers;

/// <summary>
/// Resident document requests: Barangay Clearance and Certificate of
/// Indigency. Residents file and track their own requests; staff review,
/// approve, print, release or reject them.
/// </summary>
[Route("api/document-requests")]
[Authorize]
public class DocumentRequestsController : ApiControllerBase
{
    private readonly IDocumentRequestService _requests;

    public DocumentRequestsController(IDocumentRequestService requests)
    {
        _requests = requests;
    }

    /// <summary>
    /// Paged request list. Staff see every request; residents only see their own.
    /// `search` matches reference number, purpose or resident name; `status`
    /// filters Pending/Approved/ReadyForPickup/Released/Rejected; `type`
    /// filters BarangayClearance/CertificateOfIndigency.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] SearchQuery query, CancellationToken ct)
        => Success(await _requests.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => Success(await _requests.GetByIdAsync(id, ct));

    /// <summary>Resident files a new document request (JSON body, no uploads).</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentRequestRequest request, CancellationToken ct)
        => Success(await _requests.CreateAsync(request, CurrentUserId, ct),
            "Request submitted. Please present your reference number at the barangay hall.");

    /// <summary>Staff-only status update: Approved, ReadyForPickup, Released or Rejected.</summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDocumentRequestStatusRequest request, CancellationToken ct)
        => Success(await _requests.UpdateStatusAsync(id, request, CurrentUserId, ct), "Request updated.");

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AppConstants.Policies.HeadAdminOnly)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _requests.DeleteAsync(id, ct);
        return Success("Document request deleted.");
    }

    /// <summary>Counts per status for the admin dashboard cards.</summary>
    [HttpGet("stats")]
    [Authorize(Policy = AppConstants.Policies.StaffOnly)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
        => Success(await _requests.GetStatsAsync(ct));
}

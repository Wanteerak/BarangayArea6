param([string]$FilePath)
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not (Test-Path $FilePath)) {
    Write-Output "File not found: $FilePath"
    exit 1
}

try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($FilePath)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    
    if (-not $entry) {
        Write-Output "word/document.xml not found in archive"
        $zip.Dispose()
        exit 1
    }
    
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $zip.Dispose()
    
    # Extract text between <w:t> tags (Word's text elements)
    $matches = [regex]::Matches($content, '<w:t[^>]*>([^<]*)</w:t>')
    $textParts = @()
    foreach ($m in $matches) {
        $textParts += $m.Groups[1].Value
    }
    
    $text = $textParts -join ' '
    
    # Clean XML entities
    $text = $text -replace '&amp;', '&'
    $text = $text -replace '&lt;', '<'
    $text = $text -replace '&gt;', '>'
    $text = $text -replace '&quot;', '"'
    
    # Clean up extra whitespace
    $text = $text -replace '\s+', ' '
    $text = $text.Trim()
    
    Write-Output $text
}
catch {
    Write-Output "Error: $($_.Exception.Message)"
    exit 1
}

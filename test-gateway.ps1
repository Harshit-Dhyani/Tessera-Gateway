function test-gateway {
    param(
        [string]$url = "http://127.0.0.1:7860/health"
    )
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host "Status: $($response.StatusCode)"
        Write-Host "Content: $($response.Content)"
    } catch {
        Write-Host "Error: $_"
    }
}

test-gateway
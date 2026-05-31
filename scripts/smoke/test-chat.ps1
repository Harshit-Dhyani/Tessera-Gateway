$body = @{
    model = "chatgpt"
    messages = @(
        @{role = "user"; content = "Hello"}
    )
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:7860/v1/chat/completions" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json

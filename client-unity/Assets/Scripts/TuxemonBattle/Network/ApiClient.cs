using System;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public class ApiClient
{
    private readonly string baseUrl;
    private readonly JsonSerializerOptions jsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public ApiClient(string baseUrl)
    {
        this.baseUrl = baseUrl.TrimEnd('/');

        // Server gửi enum dạng string (ví dụ "A", "B", "creature"), nên phải bật converter
        jsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    private async Task<TResponse> PostJsonAsync<TRequest, TResponse>(string path, TRequest body)
    {
        var url = $"{baseUrl}{path}";
        var json = JsonSerializer.Serialize(body, body?.GetType() ?? typeof(TRequest), jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);

        using var req = new UnityWebRequest(url, "POST");
        req.uploadHandler = new UploadHandlerRaw(bytes);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        var op = req.SendWebRequest();
        while (!op.isDone)
            await Task.Yield();

        if (req.result != UnityWebRequest.Result.Success)
            throw new Exception($"POST {path} failed: {req.responseCode} {req.error} {req.downloadHandler.text}");

        return JsonSerializer.Deserialize<TResponse>(req.downloadHandler.text, jsonOptions);
    }

    public Task<StartPracticeResponse> StartPracticeAsync(StartPracticeRequest req)
    {
        return PostJsonAsync<StartPracticeRequest, StartPracticeResponse>("/api/v1/battle/practice/start", req);
    }

    public Task<CardsResponse> GetCardsAsync()
    {
        return GetJsonAsync<CardsResponse>("/api/v1/cards");
    }

    public Task<SubmitBattleActionResponse> SubmitActionAsync(SubmitBattleActionRequest req)
    {
        return PostJsonAsync<SubmitBattleActionRequest, SubmitBattleActionResponse>($"/api/v1/battle/{req.matchId}/action", req);
    }

    private async Task<TResponse> GetJsonAsync<TResponse>(string path)
    {
        var url = $"{baseUrl}{path}";

        using var req = UnityWebRequest.Get(url);
        var op = req.SendWebRequest();
        while (!op.isDone)
            await Task.Yield();

        if (req.result != UnityWebRequest.Result.Success)
            throw new Exception($"GET {path} failed: {req.responseCode} {req.error} {req.downloadHandler.text}");

        return JsonSerializer.Deserialize<TResponse>(req.downloadHandler.text, jsonOptions);
    }

    public Task<BattleState> GetBattleStateAsync(string matchId)
    {
        throw new NotImplementedException("MVP: implement GET /api/v1/battle/{matchId}/state if needed.");
    }
}


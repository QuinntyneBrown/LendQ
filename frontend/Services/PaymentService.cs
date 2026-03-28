using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class PaymentService : IPaymentService
{
    private readonly HttpClient _http;

    public PaymentService(HttpClient http)
    {
        _http = http;
    }

    public event Action? OnChange;

    public async Task<ScheduleVersion> GetScheduleAsync(string loanId)
    {
        return await _http.GetFromJsonAsync<ScheduleVersion>($"loans/{loanId}/schedule")
            ?? throw new InvalidOperationException("Schedule not found.");
    }

    public async Task<List<PaymentTransaction>> GetPaymentsAsync(string loanId)
    {
        return await _http.GetFromJsonAsync<List<PaymentTransaction>>($"loans/{loanId}/payments")
            ?? new List<PaymentTransaction>();
    }

    public async Task<PaymentTransaction> RecordPaymentAsync(string loanId, RecordPaymentFormModel model)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"loans/{loanId}/payments");
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        request.Content = JsonContent.Create(model);

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var payment = await response.Content.ReadFromJsonAsync<PaymentTransaction>()
            ?? throw new InvalidOperationException("Record payment response was null.");
        OnChange?.Invoke();
        return payment;
    }

    public async Task<PaymentTransaction> ReversePaymentAsync(string paymentId, string reason)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"payments/{paymentId}/reverse");
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        request.Content = JsonContent.Create(new { reason });

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var payment = await response.Content.ReadFromJsonAsync<PaymentTransaction>()
            ?? throw new InvalidOperationException("Reverse payment response was null.");
        OnChange?.Invoke();
        return payment;
    }

    public async Task RescheduleAsync(string loanId, ScheduleAdjustmentFormModel model)
    {
        var response = await _http.PostAsJsonAsync($"loans/{loanId}/schedule/reschedule", model);
        response.EnsureSuccessStatusCode();
        OnChange?.Invoke();
    }

    public async Task PauseAsync(string loanId, ScheduleAdjustmentFormModel model)
    {
        var response = await _http.PostAsJsonAsync($"loans/{loanId}/schedule/pause", model);
        response.EnsureSuccessStatusCode();
        OnChange?.Invoke();
    }

    public async Task<List<object>> GetHistoryAsync(string loanId)
    {
        return await _http.GetFromJsonAsync<List<object>>($"loans/{loanId}/schedule/history")
            ?? new List<object>();
    }
}

namespace LendQ.Client.Shared;

public static class Formatters
{
    public static string FormatCurrency(string? amount, string currency = "USD")
    {
        if (string.IsNullOrWhiteSpace(amount))
            return "$0.00";

        if (decimal.TryParse(amount, out var value))
        {
            return currency switch
            {
                "EUR" => $"\u20ac{value:N2}",
                "GBP" => $"\u00a3{value:N2}",
                _ => $"${value:N2}"
            };
        }

        return amount;
    }

    public static string FormatRelativeTime(DateTime dateTime)
    {
        var now = DateTime.UtcNow;
        var diff = now - dateTime;

        if (diff.TotalMinutes < 1)
            return "just now";
        if (diff.TotalMinutes < 60)
            return $"{(int)diff.TotalMinutes}m ago";
        if (diff.TotalHours < 24)
            return $"{(int)diff.TotalHours}h ago";
        if (diff.TotalDays < 7)
            return $"{(int)diff.TotalDays}d ago";

        return dateTime.ToString("MMM d, yyyy");
    }

    public static string FormatDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr))
            return "N/A";

        if (DateTime.TryParse(dateStr, out var date))
            return date.ToString("MMM d, yyyy");

        return dateStr;
    }

    public static string FormatDateTime(DateTime dateTime)
    {
        return dateTime.ToString("MMM d, yyyy h:mm tt");
    }

    public static string GetDateGroup(DateTime dateTime)
    {
        var today = DateTime.UtcNow.Date;
        var date = dateTime.Date;

        if (date == today)
            return "Today";
        if (date == today.AddDays(-1))
            return "Yesterday";

        return "Earlier";
    }

    public static string TruncateText(string text, int maxLength = 50)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length <= maxLength)
            return text;

        return text[..maxLength] + "...";
    }
}

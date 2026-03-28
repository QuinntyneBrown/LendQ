using System.Net;
using LendQ.Client.Services;

namespace LendQ.Client.Auth;

public class AuthorizationMessageHandler : DelegatingHandler
{
    private readonly IAuthService _authService;

    public AuthorizationMessageHandler(IAuthService authService)
    {
        _authService = authService;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (_authService.AccessToken is not null)
        {
            request.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authService.AccessToken);
        }

        request.Headers.Add("X-Request-Id", Guid.NewGuid().ToString());

        var response = await base.SendAsync(request, cancellationToken);

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            var refreshed = await _authService.RefreshAsync();
            if (refreshed)
            {
                var retry = await CloneRequestAsync(request);

                if (_authService.AccessToken is not null)
                {
                    retry.Headers.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authService.AccessToken);
                }

                retry.Headers.Add("X-Request-Id", Guid.NewGuid().ToString());

                response.Dispose();
                response = await base.SendAsync(retry, cancellationToken);
            }
        }

        return response;
    }

    private static async Task<HttpRequestMessage> CloneRequestAsync(HttpRequestMessage original)
    {
        var clone = new HttpRequestMessage(original.Method, original.RequestUri);

        if (original.Content is not null)
        {
            var content = await original.Content.ReadAsByteArrayAsync();
            clone.Content = new ByteArrayContent(content);

            foreach (var header in original.Content.Headers)
            {
                clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        foreach (var header in original.Headers)
        {
            if (header.Key is not "Authorization" and not "X-Request-Id")
            {
                clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        clone.Version = original.Version;

        return clone;
    }
}

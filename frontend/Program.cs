using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using LendQ.Client;
using LendQ.Client.Auth;
using LendQ.Client.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

var apiBaseAddress = builder.Configuration.GetValue<string>("ApiBaseAddress")
    ?? "http://localhost:5000/api/v1/";

// Auth infrastructure
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddTransient<AuthorizationMessageHandler>();

// Register HttpClient with auth handler for all API services
void ConfigureHttpClient(HttpClient client)
{
    client.BaseAddress = new Uri(apiBaseAddress);
}

builder.Services.AddHttpClient<IUserService, UserService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<IRoleService, RoleService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<IAuditService, AuditService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<ILoanService, LoanService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<IPaymentService, PaymentService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<IDashboardService, DashboardService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<INotificationService, NotificationService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<ISettingsService, SettingsService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

builder.Services.AddHttpClient<ISessionService, SessionService>(ConfigureHttpClient)
    .AddHttpMessageHandler<AuthorizationMessageHandler>();

// Auth service needs its own HttpClient without the auth handler (for login/refresh)
builder.Services.AddHttpClient("AuthClient", ConfigureHttpClient);

// App-wide services
builder.Services.AddScoped<IToastService, ToastService>();

await builder.Build().RunAsync();

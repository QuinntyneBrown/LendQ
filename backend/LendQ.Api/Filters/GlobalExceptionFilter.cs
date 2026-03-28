using LendQ.Core.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LendQ.Api.Filters;

public class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;

    public GlobalExceptionFilter(ILogger<GlobalExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        var requestId = context.HttpContext.Items["RequestId"]?.ToString() ?? "";

        var problemDetails = context.Exception switch
        {
            NotFoundException ex => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.5"
            },
            Core.Exceptions.AuthenticationException ex => new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.2"
            },
            AuthorizationException ex => new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.4"
            },
            ConflictException ex => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.10"
            },
            Core.Exceptions.ValidationException ex => CreateValidationProblemDetails(ex),
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred."
            }
        };

        problemDetails.Extensions["traceId"] = requestId;

        if (problemDetails.Status == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(context.Exception, "Unhandled exception for request {RequestId}", requestId);
        }

        context.Result = new ObjectResult(problemDetails)
        {
            StatusCode = problemDetails.Status
        };
        context.ExceptionHandled = true;
    }

    private static ProblemDetails CreateValidationProblemDetails(Core.Exceptions.ValidationException ex)
    {
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status422UnprocessableEntity,
            Title = "Validation Error",
            Detail = ex.Message,
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.21"
        };

        if (ex.Errors.Count > 0)
        {
            problemDetails.Extensions["errors"] = ex.Errors;
        }

        return problemDetails;
    }
}

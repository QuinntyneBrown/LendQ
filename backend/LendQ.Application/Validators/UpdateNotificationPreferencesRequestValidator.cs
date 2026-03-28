using FluentValidation;
using LendQ.Application.DTOs.Notifications;

namespace LendQ.Application.Validators;

public class UpdateNotificationPreferencesRequestValidator : AbstractValidator<UpdateNotificationPreferencesRequest>
{
    public UpdateNotificationPreferencesRequestValidator()
    {
        // All boolean fields are value types and therefore always present.
        // Validation ensures the request object itself is valid.
        RuleFor(x => x.PaymentDueEmail).NotNull();
        RuleFor(x => x.PaymentOverdueEmail).NotNull();
        RuleFor(x => x.PaymentReceivedEmail).NotNull();
        RuleFor(x => x.ScheduleChangedEmail).NotNull();
        RuleFor(x => x.LoanModifiedEmail).NotNull();
        RuleFor(x => x.SystemEmail).NotNull();
    }
}

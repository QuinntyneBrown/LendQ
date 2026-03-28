using FluentValidation;
using LendQ.Application.DTOs.Loans.ChangeRequests;

namespace LendQ.Application.Validators;

public class CreateChangeRequestRequestValidator : AbstractValidator<CreateChangeRequestRequest>
{
    private static readonly string[] ValidTypes = { "TermChange", "Reschedule", "Pause" };

    public CreateChangeRequestRequestValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Type is required.")
            .Must(t => ValidTypes.Contains(t))
            .WithMessage("Type must be one of: TermChange, Reschedule, Pause.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.");
    }
}

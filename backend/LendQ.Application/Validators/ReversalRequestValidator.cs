using FluentValidation;
using LendQ.Application.DTOs.Payments;

namespace LendQ.Application.Validators;

public class ReversalRequestValidator : AbstractValidator<ReversalRequest>
{
    public ReversalRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MinimumLength(3).WithMessage("Reason must be at least 3 characters.");
    }
}

using FluentValidation;
using LendQ.Application.DTOs.Loans;

namespace LendQ.Application.Validators;

public class CreateLoanRequestValidator : AbstractValidator<CreateLoanRequest>
{
    private static readonly string[] ValidFrequencies = { "Weekly", "Biweekly", "Monthly", "Custom" };

    public CreateLoanRequestValidator()
    {
        RuleFor(x => x.BorrowerId)
            .NotEmpty().WithMessage("Borrower is required.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");

        RuleFor(x => x.PrincipalAmount)
            .GreaterThan(0).WithMessage("Principal amount must be greater than zero.");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required.")
            .Length(3).WithMessage("Currency must be a 3-character code.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.RepaymentFrequency)
            .NotEmpty().WithMessage("Repayment frequency is required.")
            .Must(f => ValidFrequencies.Contains(f))
            .WithMessage("Repayment frequency must be one of: Weekly, Biweekly, Monthly, Custom.");
    }
}

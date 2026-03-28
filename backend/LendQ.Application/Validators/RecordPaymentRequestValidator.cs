using FluentValidation;
using LendQ.Application.DTOs.Payments;

namespace LendQ.Application.Validators;

public class RecordPaymentRequestValidator : AbstractValidator<RecordPaymentRequest>
{
    private static readonly string[] ValidMethods = { "Cash", "BankTransfer", "Card", "Other" };

    public RecordPaymentRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .Must(m => ValidMethods.Contains(m))
            .WithMessage("Payment method must be one of: Cash, BankTransfer, Card, Other.");
    }
}

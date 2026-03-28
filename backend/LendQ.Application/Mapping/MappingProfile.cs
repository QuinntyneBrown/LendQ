using AutoMapper;
using LendQ.Application.DTOs.Dashboard;
using LendQ.Application.DTOs.Loans;
using LendQ.Application.DTOs.Loans.ChangeRequests;
using LendQ.Application.DTOs.Notifications;
using LendQ.Application.DTOs.Payments;
using LendQ.Application.DTOs.Users;
using LendQ.Core.Entities;

namespace LendQ.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserResponse>()
            .ForMember(d => d.Roles, opt => opt.MapFrom(s => s.RoleAssignments.Select(r => r.Role.ToString()).ToList()))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

        CreateMap<User, BorrowerDirectoryItemResponse>();

        // Session mappings
        CreateMap<RefreshSession, SessionResponse>();

        // Loan mappings
        CreateMap<Loan, LoanSummaryResponse>()
            .ForMember(d => d.PrincipalAmount, opt => opt.MapFrom(s => s.PrincipalAmount.ToString("F2")))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

        CreateMap<Loan, LoanDetailResponse>()
            .ForMember(d => d.PrincipalAmount, opt => opt.MapFrom(s => s.PrincipalAmount.ToString("F2")))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

        // Loan terms version mappings
        CreateMap<LoanTermsVersion, LoanTermsVersionResponse>()
            .ForMember(d => d.PrincipalAmount, opt => opt.MapFrom(s => s.PrincipalAmount.ToString("F2")))
            .ForMember(d => d.RepaymentFrequency, opt => opt.MapFrom(s => s.RepaymentFrequency.ToString()));

        // Schedule mappings
        CreateMap<ScheduleVersion, ScheduleVersionResponse>();

        CreateMap<ScheduleInstallment, ScheduleInstallmentResponse>()
            .ForMember(d => d.AmountDue, opt => opt.MapFrom(s => s.AmountDue.ToString("F2")))
            .ForMember(d => d.AmountPaid, opt => opt.MapFrom(s => s.AmountPaid.ToString("F2")))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

        // Change request mappings
        CreateMap<LoanChangeRequest, ChangeRequestResponse>()
            .ForMember(d => d.Type, opt => opt.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

        // Payment mappings
        CreateMap<PaymentTransaction, PaymentTransactionResponse>()
            .ForMember(d => d.Amount, opt => opt.MapFrom(s => s.Amount.ToString("F2")))
            .ForMember(d => d.PaymentMethod, opt => opt.MapFrom(s => s.PaymentMethod.ToString()))
            .ForMember(d => d.Direction, opt => opt.MapFrom(s => s.Direction.ToString()))
            .ForMember(d => d.TransactionType, opt => opt.MapFrom(s => s.TransactionType.ToString()));

        CreateMap<PaymentAllocation, PaymentAllocationResponse>()
            .ForMember(d => d.Amount, opt => opt.MapFrom(s => s.Amount.ToString("F2")));

        // Notification mappings
        CreateMap<Notification, NotificationResponse>()
            .ForMember(d => d.Type, opt => opt.MapFrom(s => s.Type.ToString()));

        CreateMap<NotificationPreference, NotificationPreferencesResponse>();

        // Audit event mappings
        CreateMap<AuditEvent, ActivityItemResponse>()
            .ForMember(d => d.Type, opt => opt.MapFrom(s => s.EventType));
    }
}

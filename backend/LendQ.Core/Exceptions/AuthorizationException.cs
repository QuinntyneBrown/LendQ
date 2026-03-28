namespace LendQ.Core.Exceptions;

public class AuthorizationException : AppException
{
    public AuthorizationException(string message) : base(message) { }
}

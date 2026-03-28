namespace LendQ.Core.Exceptions;

public class AuthenticationException : AppException
{
    public AuthenticationException(string message) : base(message) { }
}

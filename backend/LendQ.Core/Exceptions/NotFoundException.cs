namespace LendQ.Core.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string entityName, object key) : base($"{entityName} with key '{key}' was not found.") { }
}

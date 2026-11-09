using System.Text.Json;
using Admission.Api.Errors;
using Admission.Api.Students;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Admission.Tests;

public class StudentIdTests
{
    [Theory]
    [InlineData("20152691234567890")]
    [InlineData("  20152691234567890  ")]
    [InlineData("00000000000000000")]
    public void Accepts_exactly_17_digits(string raw)
    {
        Assert.True(StudentId.TryParse(raw, out var id));
        Assert.Equal(raw.Trim(), id.Value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("2015269123456789")]       // 16 digits
    [InlineData("201526912345678901")]     // 18 digits
    [InlineData("2015269123456789a")]      // letter
    [InlineData("2015-269-123456789")]     // separators
    [InlineData("２０１５２６９１２３４５６７８９０")] // full-width digits
    [InlineData("২০১৫২৬৯১২৩৪৫৬৭৮৯০")]   // Bengali digits
    public void Rejects_anything_else(string? raw)
    {
        Assert.False(StudentId.TryParse(raw, out _));
    }

    [Fact]
    public async Task Missing_header_gives_400_student_id_required()
    {
        var request = NewRequest();

        Assert.False(request.TryGetStudentId(out _, out var error));
        Assert.Equal(ErrorCodes.StudentIdRequired, await ExecuteAsync(error, 400));
    }

    [Fact]
    public async Task Invalid_header_gives_400_invalid_student_id()
    {
        var request = NewRequest();
        request.Headers[StudentId.HeaderName] = "12345";

        Assert.False(request.TryGetStudentId(out _, out var error));
        Assert.Equal(ErrorCodes.InvalidStudentId, await ExecuteAsync(error, 400));
    }

    [Fact]
    public void Valid_header_is_read()
    {
        var request = NewRequest();
        request.Headers[StudentId.HeaderName] = "20152691234567890";

        Assert.True(request.TryGetStudentId(out var id, out _));
        Assert.Equal("20152691234567890", id.Value);
    }

    private static HttpRequest NewRequest() => new DefaultHttpContext().Request;

    private static async Task<string?> ExecuteAsync(IResult result, int expectedStatus)
    {
        var context = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider(),
        };
        context.Response.Body = new MemoryStream();

        await result.ExecuteAsync(context);

        Assert.Equal(expectedStatus, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        var body = await JsonSerializer.DeserializeAsync<ApiError>(
            context.Response.Body, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        return body?.Error;
    }
}

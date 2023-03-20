using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text.Json;
using Newtonsoft.Json;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
  opts.DescribeAllParametersInCamelCase();
  opts.SupportNonNullableReferenceTypes();
  // opts.UseAllOfToExtendReferenceSchemas();
  opts.SchemaFilter<RequiredNotNullableSchemaFilter>();

});

var AllowLocal = "_allowLocal";
builder.Services.AddCors(options =>
{
  options.AddPolicy(name: AllowLocal,
    policy =>
    {
      policy.WithOrigins("http://localhost:4200");
    });
});

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseCors(AllowLocal);
app.MapGet("/ping", () => Results.NoContent());

var expenses = new List<ExpenseDto>
{
  new ExpenseDto(
    1,
    "EE",
    "Subscriptions",
    new Money(10)
  ),
  new ExpenseDto(
    2,
    "The Gym Group",
    "Subscriptions",
    new Money(24.99)
  ),
  new ExpenseDto(
    3,
    "Lidl",
    "Groceries",
    new Money(21.39)
  ),
  new ExpenseDto(
    4,
    "Blue Star Bus",
    "Transportation",
    new Money(6)
  ),
  new ExpenseDto(
    5,
    "Domino's Pizza",
    "Food",
    new Money(17.98)
  ),
  new ExpenseDto(
    6,
    "Wise",
    "Miscellaneous",
    new Money(30.38)
  ),
  new ExpenseDto(
    7,
    "Education",
    "Courses",
    new Money(10)
  ),
  new ExpenseDto(
    8,
    "House Owner",
    "Housing",
    new Money(695)
  ),
};

app.MapGet("api/expenses/recent", () => expenses.Take(5));
app.MapGet("api/expenses", () => expenses).WithName("GetExpenses");
app.MapGet("api/expenses/{id}", (int id) =>
{
  return expenses.SingleOrDefault(s => s.Id == id) is var expense ?
    Results.Ok(expense) :
    Results.NotFound();
}).WithName("GetOneExpense");


app.Run();

public record Money(double Amount, string Currency = "GBP");
public record ExpenseDto(long Id, string Merchant, string Category, Money TotalPrice);

public class RequiredNotNullableSchemaFilter : ISchemaFilter
{
  public void Apply(OpenApiSchema schema, SchemaFilterContext context)
  {
    if (schema.Properties == null)
    {
      return;
    }

    FixNullableProperties(schema, context);

    var notNullableProperties = schema
        .Properties
        .Where(x => !x.Value.Nullable && x.Value.Default == default && !schema.Required.Contains(x.Key))
        .ToList();

    foreach (var property in notNullableProperties)
    {
      schema.Required.Add(property.Key);
    }
  }

  /// <summary>
  /// Option "SupportNonNullableReferenceTypes" not working with complex types ({ "type": "object" }), 
  /// so they always have "Nullable = false",
  /// see method "SchemaGenerator.GenerateSchemaForMember"
  /// </summary>
  private static void FixNullableProperties(OpenApiSchema schema, SchemaFilterContext context)
  {
    foreach (var property in schema.Properties)
    {
      var field = context.Type
            .GetMembers(BindingFlags.Public | BindingFlags.Instance)
            .FirstOrDefault(x =>
                string.Equals(x.Name, property.Key, StringComparison.InvariantCultureIgnoreCase));

      if (field != null)
      {
        var fieldType = field switch
        {
          FieldInfo fieldInfo => fieldInfo.FieldType,
          PropertyInfo propertyInfo => propertyInfo.PropertyType,
          _ => throw new NotSupportedException(),
        };

        property.Value.Nullable = fieldType.IsValueType
            ? Nullable.GetUnderlyingType(fieldType) != null
            : !field.IsNonNullableReferenceType();
      }
    }
  }
}
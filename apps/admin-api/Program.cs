using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
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
      policy.WithOrigins(builder.Configuration["AllowedHosts"] ?? "localhost")
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("SnarBankDb"));
builder.Services.AddSingleton<SnarBankDbClient>();

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
    "1",
    "EE",
    "Subscriptions",
    new Money(10),
    new DateTime(2023, 3, 15, 16,30,15)
  ),
  new ExpenseDto(
    "2",
    "The Gym Group",
    "Subscriptions",
    new Money(24.99),
    new DateTime(2023, 3, 16, 06,10,00)
  ),
  new ExpenseDto(
    "3",
    "Lidl",
    "Groceries",
    new Money(21.39),
    new DateTime(2023, 2, 12, 18,30,11)
  ),
  new ExpenseDto(
    "4",
    "Blue Star Bus",
    "Transportation",
    new Money(6),
    new DateTime(2023, 2, 28, 14,01,01)
  ),
  new ExpenseDto(
    "5",
    "Domino's Pizza",
    "Food",
    new Money(17.98),
    new DateTime(2023, 3, 20, 11,30,29)
  ),
  new ExpenseDto(
    "6",
    "Wise",
    "Miscellaneous",
    new Money(30.38),
    new DateTime(2023, 4, 4, 13,45,03)
  ),
  new ExpenseDto(
    "7",
    "Education",
    "Courses",
    new Money(10),
    new DateTime(2023, 4, 2, 20,46,18)
  ),
  new ExpenseDto(
    "8",
    "House Owner",
    "Housing",
    new Money(695),
    new DateTime(2023, 3, 1, 9,40,00)
  ),
};

app.MapGet("api/expenses/recent", () => expenses.Take(5).OrderByDescending(o => o.DateIncurred));
app.MapGet("api/expenses", async (SnarBankDbClient snarBankDbClient) => await snarBankDbClient.GetAsync()).WithName("GetExpenses");
app.MapGet("api/expenses/{id}", async (string id, SnarBankDbClient snarBankDbClient) =>
{
  return await snarBankDbClient.GetAsync(id) is Expense expense ?
    Results.Ok(new ExpenseDto(expense.Id, expense.Merchant, expense.Category, expense.TotalPrice, expense.DateIncurred)) :
    Results.NotFound();
}).WithName("GetOneExpense");
app.MapPost("api/expenses", async (ExpenseDto expenseDto, SnarBankDbClient snarBankDbClient) =>
{
  var expense = new Expense(expenseDto.Merchant, expenseDto.Category, expenseDto.TotalPrice, expenseDto.DateIncurred);
  await snarBankDbClient.CreateAsync(expense);
  return Results.Created($"/api/expenses/{expense.Id}", expenseDto);
}).WithName("AddOneExpense");
app.MapDelete("api/expenses/{id}", async (string id, SnarBankDbClient snarBankDbClient) =>
{
  var expense = await snarBankDbClient.GetAsync(id);
  if (expense is null)
  {
    return Results.NotFound();
  }

  await snarBankDbClient.DeleteAsync(id);
  return Results.NoContent();
}).WithName("DeleteOneExpense");

app.Run();

public record Money(double Amount, string Currency = "GBP");
public record ExpenseDto(string Id, string Merchant, string Category, Money TotalPrice, DateTime DateIncurred);

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
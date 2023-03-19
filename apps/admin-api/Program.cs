var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}
app.UseHttpsRedirection();

app.MapGet("/ping", () => Results.NoContent());

var expenses = new List<ExpenseDto>
{
  new ExpenseDto(
    1,
    new Money(10),
    "EE",
    "Subscriptions"
  ),
  new ExpenseDto(
    2,
    new Money(24.99),
    "The Gym Group",
    "Subscriptions"
  ),
  new ExpenseDto(
    3,
    new Money(21.39),
    "Lidl",
    "Groceries"
  ),
  new ExpenseDto(
    4,
    new Money(6),
    "Blue Star Bus",
    "Transportation"
  ),
  new ExpenseDto(
    5,
    new Money(17.98),
    "Domino's Pizza",
    "Food"
  ),
  new ExpenseDto(
    6,
    new Money(30.38),
    "Wise",
    "Miscellaneous"
  ),
  new ExpenseDto(
    7,
    new Money(10),
    "Education",
    "Courses"
  ),
  new ExpenseDto(
    8,
    new Money(695),
    "House Owner",
    "Housing"
  ),
};
app.MapGet("api/expenses", () => expenses).WithName("GetExpenses");
app.MapGet("api/expenses/{id}", (int id) =>
{
  return expenses.SingleOrDefault(s => s.id == id) is var expense ?
    Results.Ok(expense) :
    Results.NotFound();
}).WithName("GetOneExpense");

app.Run();

internal record Money(double Amount, string Currency = "GBP")
{

}
internal record ExpenseDto(long id, Money TotalPrice, string Merchant, string Category)
{

}

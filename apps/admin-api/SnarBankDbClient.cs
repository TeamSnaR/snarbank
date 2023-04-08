using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
public class MongoDbSettings
{
  public string ConnectionURI { get; set; } = default!;
  public string DatabaseName { get; set; } = default!;
  public string CollectionName { get; set; } = default!;
}
public class Expense
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string Id { get; set; } = default!;
  public string Merchant { get; set; } = default!;
  public string Category { get; set; } = default!;
  public Money TotalPrice { get; set; } = default!;
  public DateTime DateIncurred { get; set; } = default!;

  [BsonConstructor]
  public Expense(string merchant, string category, Money totalPrice, DateTime dateIncurred)
  {
    Merchant = merchant;
    Category = category;
    TotalPrice = totalPrice;
    DateIncurred = dateIncurred;
  }
}
public class SnarBankDbClient
{
  private readonly IMongoCollection<Expense> _expenseCollection;
  public SnarBankDbClient(IOptions<MongoDbSettings> mongoDbSettings)
  {
    var mongoClient = new MongoClient(mongoDbSettings.Value.ConnectionURI);
    IMongoDatabase database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
    _expenseCollection = database.GetCollection<Expense>(mongoDbSettings.Value.CollectionName);
  }

  public async Task<List<Expense>> GetAsync() => await _expenseCollection.Find(_ => true).ToListAsync().ConfigureAwait(false);

  public async Task CreateAsync(Expense expense) => await _expenseCollection.InsertOneAsync(expense).ConfigureAwait(false);

  public async Task<Expense?> GetAsync(string id) =>
        await _expenseCollection.Find(x => x.Id == id).FirstOrDefaultAsync().ConfigureAwait(false);
}
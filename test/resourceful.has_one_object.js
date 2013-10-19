describe('Resourceful.HasOneObject', function() {
  var supplier, accountA, accountB, GLOBAL = {};

  before(function() {
    Ember.lookup = GLOBAL;

    GLOBAL.Account = Resourceful.Resource.extend();

    GLOBAL.Account.reopenClass({
      resourceCollectionPath: 'accounts'
    });

    GLOBAL.Supplier = Resourceful.Resource.extend({
      account: Resourceful.hasOne('Account', { key: 'supplier_id' })
    });
  });

  after(function() {
    Ember.lookup = window;
  });

  beforeEach(function() {
    GLOBAL.accounts = Resourceful.ResourceCollection.create({
      resourceClass: GLOBAL.Account
    });

    supplier = GLOBAL.Supplier.create({ id: 3 });

    accountA = GLOBAL.Account.create({ id: 1, supplier_id: 3 });
    accountB = GLOBAL.Account.create({ id: 4, supplier_id: 5 });

    GLOBAL.accounts.pushObjects([accountA, accountB]);
  });

  it('intializes with the related resource', function() {
    expect(supplier.get('account.content')).to.be(accountA);
  });

  it('updates if the foreign key changes', function() {
    accountA.set('supplier_id', 6);
    expect(supplier.get('account.content')).to.be(undefined);
  });

  it('updates if the primary key changes', function() {
    supplier.set('id', 5);
    expect(supplier.get('account.content')).to.be(accountB);
  });
});
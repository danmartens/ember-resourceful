describe('Resourceful', function() {
  var GLOBAL = {};

  before(function() {
    Ember.lookup = GLOBAL;

    GLOBAL.Person = Resourceful.Resource.extend();

    GLOBAL.Person.reopenClass({
      resourceCollectionPath: 'people'
    });
  });

  after(function() {
    Ember.lookup = window;
  });

  describe('#collectionFor', function() {
    beforeEach(function() {
      GLOBAL.people = Resourceful.ResourceCollection.create({
        resourceClass: GLOBAL.Person
      });
    });

    it("should use '.resourceCollectionPath' to look up the ResourceCollection instance", function () {
      var collection = Resourceful.collectionFor(GLOBAL.Person);
      expect(collection).to.be(GLOBAL.people);
    });
  });
});

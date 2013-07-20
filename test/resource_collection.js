describe('Resourceful.ResourceCollection', function() {
  var Person, PersonCollection, people;

  Person = Resourceful.Resource.extend({
    resourceProperties: ['firstName', 'lastName', 'age']
  });

  PersonCollection = Resourceful.ResourceCollection.extend({
    resourceClass: Person
  });

  beforeEach(function() {
    people = PersonCollection.create();
  });

  describe('#_resourceIndex', function() {
    it('should be updated when a resource is added', function() {
      var person = Person.create({ id: 1 });

      people.pushObject(person);

      expect(people._resourceIndex[1]).to.be(person);
    });

    it('should be updated when a resource is removed', function() {
      var person = Person.create({ id: 1 });

      people.pushObject(person);
      people.removeObject(person);

      expect(people._resourceIndex[1]).to.be(undefined);
    });
  });
});
describe('Resourceful.ResourceCollection', function() {
  var Person, PersonCollection, people;

  Person = Resourceful.Resource.extend({
    firstName: Resourceful.attr(),
    lastName: Resourceful.attr(),
    age: Resourceful.attr()
  });

  Person.reopenClass({
    resourceUrl: 'people'
  });

  PersonCollection = Resourceful.ResourceCollection.extend({
    resourceClass: Person
  });

  beforeEach(function() {
    people = PersonCollection.create();
  });

  describe('AJAX functionality', function() {
    var adapter, xhr, requests, respond;

    respond = function(request, status, response) {
      if (typeof status !== 'number') {
        response = status;
        status = 200;
      }

      Ember.run(function() {
        request.respond(status, {
          "Content-Type": "application/json"
        }, JSON.stringify(response));
      });
    };

    beforeEach(function() {
      adapter = Resourceful.ResourceAdapter.create();

      people.set('resourceAdapter', adapter);
      Person.reopen({ resourceAdapter: adapter });

      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];

      xhr.onCreate = function(request) {
        requests.push(request);
      };
    });

    afterEach(function() {
      xhr.restore();
    });

    describe('#findResource', function() {
      it('returns a promise that resolves with the resource', function(done) {
        var promise = people.findResource();

        promise.then(function(person) {
          expect(person instanceof Person).to.be(true);
          expect(person.get('id')).to.be(1);
          done();
        });

        respond(requests[0], {
          id: 1,
          firstName: 'John',
          lastName: 'Smith'
        });
      });

      it('returns the resource if it exists', function(done) {
        var person = Person.create({
          id: 1,
          firstName: 'John',
          lastName: 'Smith'
        });

        Ember.run(people, 'pushObject', person);

        Ember.run(function() {
          people.findResource(1).then(function(resource) {
            expect(resource).to.be(person);
            done();
          });
        });
      });

      it('fetches the resource if it doesn\'t exist', function() {
        people.findResource(1);

        respond(requests[0], {
          id: 1,
          firstName: 'John',
          lastName: 'Smith'
        });

        expect(people.content[0].id).to.be(1);
      });
    });
  });
});

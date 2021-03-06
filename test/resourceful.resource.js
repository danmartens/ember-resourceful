describe('Resourceful.Resource', function() {
  var Person, person;

  Person = Resourceful.Resource.extend({
    firstName: Resourceful.attr(),
    lastName: Resourceful.attr(),

    age: Resourceful.attr({
      deserialize: function(value) {
        return parseInt(value, 10);
      },

      serialize: function(value) {
        return (value) ? value.toString() : null;
      }
    })
  });

  Person.reopenClass({
    resourceUrl: 'people'
  });

  beforeEach(function() {
    person = Person.create();
  });

  describe('#serialize()', function() {
    it('serializes properties correctly', function() {
      var serialized;

      person.setProperties({
        firstName: 'John',
        lastName: 'Smith'
      });

      serialized = person.serialize();

      expect(serialized.firstName).to.be('John');
      expect(serialized.lastName).to.be('Smith');
    });

    it('uses a serializer for the property if one exists', function() {
      var serialized;

      person.set('age', 30);

      serialized = person.serialize();

      expect(serialized.age).to.be('30');
    });
  });

  describe('#deserialize()', function() {
    it('deserializes properties correctly', function() {
      person.deserialize({
        firstName: 'John',
        lastName: 'Smith'
      });

      expect(person.get('firstName')).to.be('John');
      expect(person.get('lastName')).to.be('Smith');
    });

    it('uses a deserializer for the property if one exists', function() {
      person.deserialize({
        age: '30'
      });

      expect(person.get('age')).to.be(30);
    });

    it('should indicate that the record is persisted', function() {
      expect(person.get('isPersisted')).to.be(false);

      person.deserialize({
        firstName: 'John'
      });

      expect(person.get('isPersisted')).to.be(true);
    });
  });

  describe('#isDirty', function() {
    it('is true if a property has been changed', function() {
      person.deserialize({ firstName: 'John' });

      expect(person.get('isDirty')).to.be(false);

      person.set('firstName', 'Jane');

      expect(person.get('isDirty')).to.be(true);
    });

    it('is false if a property is changed via #deserialize()', function() {
      person.set('firstName', 'Jane');

      expect(person.get('isDirty')).to.be(true);

      person.deserialize({ lastName: 'John' });

      expect(person.get('isDirty')).to.be(false);
    });
  });

  describe('#revertAttributes()', function() {
    var person;

    beforeEach(function() {
      person = Person.create().deserialize({
        firstName: 'John',
        lastName: 'Smith'
      });
    });

    it('will revert specific attributes', function() {
      person.set('firstName', 'Jane');

      person.revertAttributes('firstName');

      expect(person.get('firstName')).to.be('John');
      expect(person._dirtyAttributes.contains('firstName')).to.be(false);
    });

    it('will revert all attributes', function() {
      person.set('firstName', 'Jane');
      person.set('lastName', 'Doe');

      person.revertAttributes();

      expect(person.get('firstName')).to.be('John');
      expect(person.get('lastName')).to.be('Smith');

      expect(person._dirtyAttributes.contains('firstName')).to.be(false);
      expect(person._dirtyAttributes.contains('lastName')).to.be(false);
    });
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

    before(function() {
      adapter = Resourceful.ResourceAdapter.create();
      xhr = sinon.useFakeXMLHttpRequest();

      xhr.onCreate = function(request) {
        requests.push(request);
      };

      Person.reopen({ resourceAdapter: adapter });
    });

    beforeEach(function() {
      requests = [];
    });

    after(function() {
      xhr.restore();
    });

    describe('#deleteResource()', function() {
      it('sets `isDeleting` to true and then back to false', function(done) {
        var promise = person.deleteResource();

        expect(person.isDeleting).to.be(true);

        promise.then(function() {
          expect(person.isDeleting).to.be(false);
        }, function() {
          expect().fail();
        }).then(done, done);

        respond(requests[0], {});
      });

      it('sets `isDeleted` to true if it\'s successful', function(done) {
        person.deleteResource()
          .then(function() {
            expect(person.isDeleted).to.be(true);
          }, function() {
            expect().fail();
          }).then(done, done);

        respond(requests[0], {});
      });
    });

    describe('#_request()', function() {
      it('it only sends one request at a time', function() {
        var firstPromise = person._request('read', { url: '/people/1' });
        var secondPromise = person._request('read', { url: '/people/1' });

        expect(requests.length).to.be(1);

        respond(requests[0], {});

        expect(requests.length).to.be(2);

        respond(requests[1], {});
      });
    });
  });
});

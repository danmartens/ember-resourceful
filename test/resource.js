describe('Resourceful.Resource', function() {
  var Person, person;
  
  Person = Resourceful.Resource.extend({
    resourceProperties: ['firstName', 'lastName', 'age'],
    
    deserializers: {
      age: function(value) {
        return parseInt(value, 10);
      }
    },
    
    serializers: {
      age: function(value) {
        return (value) ? value.toString() : null;
      }
    }
  });
  
  beforeEach(function() {
    person = Person.create();
  });
  
  describe('#deserialize()', function() {
    it('deserializes properties correctly', function() {
      person.deserialize({
        firstName: 'John',
        lastName: 'Smith'
      });
    
      expect(person.firstName).to.be('John');
      expect(person.lastName).to.be('Smith');
    });
    
    it('uses a deserializer for the property if one exists', function() {
      person.deserialize({
        age: '30'
      });
      
      expect(person.age).to.be(30);
    });
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
  
  describe('#revert()', function() {    
    it('will revert a changed property', function() {
      var person = Person.create().deserialize({ firstName: 'John' });
      
      person.set('firstName', 'Jane');
      person.revert('firstName');
      
      expect(person.firstName).to.be('John');
    });
  });
  
  describe('#revertAll()', function() {    
    it('will revert all changed properties', function() {
      var person = Person.create().deserialize({ firstName: 'Jane', lastName: 'Doe' });
      
      person.set('firstName', 'John');
      person.set('lastName', 'Smith');
      
      person.revertAll();
      
      expect(person.firstName).to.be('Jane');
      expect(person.lastName).to.be('Doe');
    });
  });
});
var slice = Array.prototype.slice;

window.Resourceful = {};

Resourceful.hasMany = function(resourceClass, options) {
  return Ember.computed(function(){
    var resourceCollection;

    if (Ember.typeOf(resourceClass) === 'string') {
      resourceClass = Ember.get(resourceClass);
    }

    resourceCollection = Ember.get(resourceClass.resourceCollectionPath);

    return Resourceful.HasManyArray.create({
      resource: this,
      resourceCollection: resourceCollection,
      foreignKey: options.key
    });
  });
};

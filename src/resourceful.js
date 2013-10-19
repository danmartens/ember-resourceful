var slice = Array.prototype.slice;

window.Resourceful = {};

Resourceful.hasMany = function(foreignResourceClass, options) {
  return Ember.computed(function(){
    var resourceCollection;

    if (Ember.typeOf(foreignResourceClass) === 'string') {
      foreignResourceClass = Ember.get(foreignResourceClass);
    }

    return Resourceful.HasManyArray.create({
      primaryResource: this,
      foreignResourceClass: foreignResourceClass,
      foreignKey: options.key,
      nested: options.nested
    });
  });
};

Resourceful.belongsTo = function(primaryResourceClass, options) {
  return Ember.computed(function(){
    var resourceCollection;

    if (Ember.typeOf(primaryResourceClass) === 'string') {
      primaryResourceClass = Ember.get(primaryResourceClass);
    }

    return Resourceful.BelongsToObject.create({
      foreignResource: this,
      primaryResourceClass: primaryResourceClass,
      foreignKey: options.key
    });
  });
};

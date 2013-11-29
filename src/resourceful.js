var slice = Array.prototype.slice;

window.Resourceful = {};

Resourceful.attr = function(type) {
  return Ember.computed(function(key, value) {
    if (!this._data) { this.setupData(); }

    var data = this.get('_data'),
        persistedData = this.get('_persistedData'),
        dirtyAttributes = this.get('_dirtyAttributes');

    if (arguments.length === 2) {
      this.set('_data.' + key, value);

      if (data[key] === persistedData[key]) {
        dirtyAttributes.removeObject(key);
      } else if (!dirtyAttributes.contains(key)) {
        dirtyAttributes.pushObject(key);
      }
    }

    return this.get('_data.' + key);
  }).property('_data').meta({ type: type });
};

Resourceful.hasOne = function(foreignResourceClass, options) {
  return Ember.computed(function(){
    var resourceCollection;

    if (Ember.typeOf(foreignResourceClass) === 'string') {
      foreignResourceClass = Ember.get(foreignResourceClass);
    }

    return Resourceful.HasOneObject.create({
      primaryResource: this,
      foreignResourceClass: foreignResourceClass,
      foreignKey: options.key
    });
  });
};

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
      embedded: options.embedded
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

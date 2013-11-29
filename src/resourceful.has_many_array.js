Resourceful.HasManyArray = Ember.ArrayProxy.extend({
  primaryResource: null,
  foreignResourceClass: null,
  primaryKey: 'id',
  foreignKey: null,
  embedded: false,

  init: function() {
    this.set('content', Ember.A());
    this._super();

    this.addObserver('_foreignResourceArray.@each.' + this.get('foreignKey'), this._updateContent);
    this.addObserver('primaryResource.' + this.get('primaryKey'), this._updateContent);

    this._updateContent();
  },

  // FIXME: this shouldn't be neccessary
  removeObject: function() {
    return this.content.removeObject.apply(this.content, arguments);
  },

  _updateContent: function() {
    var _this = this;

    this.get('_foreignResourceArray').forEach(function(resource) {
      if (resource.get(_this.get('foreignKey')) === _this._primaryKeyValue()) {
        if (!_this.contains(resource)) {
          _this.pushObject(resource);
        }
      } else {
        _this.removeObject(resource);
      }
    });
  },

  _foreignResourceArray: function() {
    return Ember.get(this.get('foreignResourceClass').resourceCollectionPath);
  }.property('foreignResourceClass'),

  _primaryKeyValue: function() {
    return this.get('primaryResource.' + this.get('primaryKey'));
  }
});

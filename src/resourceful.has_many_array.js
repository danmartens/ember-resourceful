Resourceful.HasManyArray = Ember.ArrayProxy.extend({
  primaryResource: null,
  foreignResourceClass: null,
  primaryKey: 'id',
  foreignKey: null,

  init: function() {
    this.set('content', Ember.A());
    this._super();

    this.set('foreignResourceArray', Ember.get(this.get('foreignResourceClass').resourceCollectionPath));
    this.addObserver('foreignResourceArray.@each.' + this.get('foreignKey'), this._updateArrayContent);

    this._updateArrayContent();
  },

  _updateArrayContent: function() {
    var _this = this;

    this.get('foreignResourceArray').forEach(function(resource) {
      if (resource.get(_this.get('foreignKey')) === _this._primaryKeyValue()) {
        if (!_this.contains(resource)) {
          _this.pushObject(resource);
        }
      } else {
        _this.removeObject(resource);
      }
    });
  },

  _primaryKeyValue: function() {
    return this.get('primaryResource.' + this.get('primaryKey'));
  }
});

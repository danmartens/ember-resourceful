Resourceful.HasManyArray = Ember.ArrayProxy.extend({
  resource: null,
  resourceCollection: null,
  foreignKey: null,

  init: function() {
    this.set('content', Ember.A());
    this.addObserver('resourceCollection.@each.' + this.get('foreignKey'), this._updateArrayContent);
    this._super();
    this._updateArrayContent();
  },

  _updateArrayContent: function() {
    var _this = this;

    this.get('resourceCollection').forEach(function(resource) {
      if (resource.get(_this.get('foreignKey')) === _this.get('resource.id')) {
        if (!_this.contains(resource)) {
          _this.pushObject(resource);
        }
      } else {
        _this.removeObject(resource);
      }
    });
  }
});

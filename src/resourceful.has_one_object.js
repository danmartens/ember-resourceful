Resourceful.HasOneObject = Ember.ObjectProxy.extend({
  primaryResource: null,
  foreignResourceClass: null,
  primaryKey: 'id',
  foreignKey: null,

  init: function() {
    this.set('content', {});

    this._super();

    this.addObserver('_foreignResourceArray.@each.' + this.get('foreignKey'), this._updateContent);
    this.addObserver('primaryResource.' + this.get('primaryKey'), this._updateContent);

    this._updateContent();
  },

  _updateContent: function() {
    var foreignKey, primaryKeyValue, foreignResource, _this = this;

    foreignKey = this.get('foreignKey');
    primaryKeyValue = this._primaryKeyValue();

    foreignResource = this.get('_foreignResourceArray').findProperty(foreignKey, primaryKeyValue);

    this.set('content', foreignResource);
  },

  _foreignResourceArray: function() {
    return Resourceful.collectionFor(this.get('foreignResourceClass'));
  }.property('foreignResourceClass'),

  _primaryKeyValue: function() {
    return this.get('primaryResource.' + this.get('primaryKey'));
  }
});

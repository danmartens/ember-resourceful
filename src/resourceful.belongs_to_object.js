Resourceful.BelongsToObject = Ember.ObjectProxy.extend({
  primaryResourceClass: null,
  foreignResource: null,
  primaryKey: 'id',
  foreignKey: null,

  init: function() {
    this.set('content', {});

    this._super();

    this.addObserver('_primaryResourceArray.@each.' + this.get('primaryKey'), this._updateContent);
    this.addObserver('foreignResource.' + this.get('foreignKey'), this._updateContent);

    this._updateContent();
  },

  _updateContent: function() {
    var primaryKey, foreignKeyValue, primaryResource, _this = this;

    primaryKey = this.get('primaryKey');
    foreignKeyValue = this._foreignKeyValue();

    primaryResource = this.get('_primaryResourceArray').findProperty(primaryKey, foreignKeyValue);

    this.set('content', primaryResource);
  },

  _primaryResourceArray: function() {
    return Ember.get(this.get('primaryResourceClass').resourceCollectionPath);
  }.property('primaryResourceClass'),

  _foreignKeyValue: function() {
    return this.get('foreignResource.' + this.get('foreignKey'));
  }
});

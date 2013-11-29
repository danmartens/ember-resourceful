Resourceful.Resource = Ember.Object.extend({
  resourceAdapter: null,

  isFetching: false,
  isFetched: false,
  isSaving: false,
  isDeleting: false,
  isDeleted: false,

  isNew: Ember.computed.equal('id', undefined),
  isDirty: Ember.computed.bool('_dirtyAttributes.length'),

  init: function() {
    if (!this._data) { this.setupData(); }
    this._super();
  },

  setupData: function() {
    this.setProperties({
      _data: {},
      _persistedData: {},
      _dirtyAttributes: []
    });
  },

  serialize: function() {
    var serialized = {},
        data = this.get('_data'),
        _this = this;

    Ember.keys(data).forEach(function(key) {
      serialized[key] = _this._serializeAttr(key, data[key]);
    });

    if (this.resourceName) {
      var s = {}; s[this.resourceName] = serialized;
      return s;
    } else {
      return serialized;
    }
  },

  deserialize: function(json) {
    var _this = this;

    Ember.beginPropertyChanges(this);

    Ember.keys(json).forEach(function(key) {
      var value = json[key];

      if (_this.get(key + '.nested')) {
        collection = Ember.get(_this.get(key + '.foreignResourceClass').resourceCollectionPath);
        collection.loadAll(value);
      } else {
        _this.set(key, _this._deserializeAttr(key, json[key]));
      }
    });

    Ember.endPropertyChanges(this);

    this._updatePersistedData();

    return this;
  },

  fetchResource: function(options) {
    var _this = this;

    this.set('isFetching', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    return this.resourceAdapter.request('read', options)
      .then(function(data, textStatus, jqXHR) {
        _this.deserialize(data);
        _this._updatePersistedProperties();
        _this.set('isFetching', false);
      }, function() {
        _this.set('isFetching', false);
      });
  },

  saveResource: function(options) {
    var success, method, _this = this;

    this.set('isSaving', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    if (!options.data) {
      options.data = this.serialize();
    }

    method = this.get('isNew') ? 'create' : 'update';

    return this.resourceAdapter.request(method, options)
      .then(function(data, textStatus, jqXHR) {
        _this.deserialize(data);
        _this._updatePersistedProperties();

        _this.set('isSaving', false);
      });
  },

  deleteResource: function(options) {
    var _this = this;

    this.set('isDeleting', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    return this.resourceAdapter.request('delete', options)
      .then(function() {
        _this.set('isDeleting', false);
        _this.set('isDeleted', true);
      }, function() {
        _this.set('isDeleting', false);
      });
  },

  revert: function(key) {
    this.set(key, this._persistedData[key]);
    this._dirtyAttributes.removeObject(key);
  },

  revertAll: function() {
    var _this = this;

    Ember.beginPropertyChanges(this);

    Ember.keys(this._persistedData).forEach(function(key) {
      _this.set(key, _this._persistedData[key]);
    });

    this._dirtyAttributes.clear();

    Ember.endPropertyChanges(this);
  },

  _serializeAttr: function(key, value) {
    var descs = Ember.meta(this.constructor.proto()).descs;

    if (descs[key] && descs[key]._meta.type && descs[key]._meta.type.serialize) {
      return descs[key]._meta.type.serialize(value);
    } else {
      return value;
    }
  },

  _deserializeAttr: function(key, value) {
    var descs = Ember.meta(this.constructor.proto()).descs;

    if (descs[key] && descs[key]._meta.type && descs[key]._meta.type.deserialize) {
      return descs[key]._meta.type.deserialize(value);
    } else {
      return value;
    }
  },

  _updatePersistedData: function() {
    var _this = this;

    this._dirtyAttributes.clear();

    Ember.keys(this.get('_data')).forEach(function(key) {
      _this.set('_persistedData.' + key, _this.get('_data.' + key));
    });
  },

  _resourceUrl: function() {
    var url = this.resourceAdapter.namespace + this.constructor.resourceUrl;

    if (!this.get('isNew')) {
      url += '/' + this.get('id');
    }

    return url;
  }
});

Resourceful.Resource.reopenClass({
  find: function(id) {
    if (this.resourceCollectionPath) {
      return Ember.get(this.resourceCollectionPath).findById(id);
    } else {
      Ember.assert('You cannot use `find()` without specifying a `resourceCollectionPath` on the Resource\'s prototype!');
    }
  },

  findAll: function() {
    var collection;

    if (this.resourceCollectionPath) {
      collection = Ember.get(this.resourceCollectionPath);

      if (!collection.get('isFetched')) {
        collection.fetchAll();
      }

      return collection.get('content');
    } else {
      Ember.assert('You cannot use `findAll()` without specifying a `resourceCollectionPath` on the Resource\'s prototype!');
    }
  }
});

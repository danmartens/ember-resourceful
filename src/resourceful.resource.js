Resourceful.Resource = Ember.Object.extend({
  resourceAdapter: null,
  resourceProperties: null,
  resourceUrl: null,
  serializers: null,
  deserializers: null,

  isFetching: false,
  isFetched: false,
  isSaving: false,

  init: function() {
    var _this = this;

    this.persistedProperties = {};
    this.dirtyProperties = [];

    this._super();

    if (this.resourceProperties) {
      this.resourceProperties.forEach(function(key) {
        _this.addObserver(key, function() {
          if (_this.get(key) !== _this.persistedProperties[key]) {
            if (!_this.dirtyProperties.contains(key)) {
              _this.dirtyProperties.pushObject(key);
            }
          } else {
            _this.dirtyProperties.removeObject(key);
          }
        });
      });
    }
  },

  isNew: Ember.computed.equal('id', undefined),

  isDirty: Ember.computed.bool('dirtyProperties.length'),

  serialize: function() {
    var serialized, _this = this;

    serialized = {};

    this.resourceProperties.forEach(function(key) {
      var _ref;
      if ((_ref = _this.serializers) != null ? _ref[key] : void 0) {
        serialized[key] = _this.serializers[key].call(this, _this.get(key));
      } else {
        serialized[key] = _this.get(key);
      }
    });

    if (this.resourceName) {
      var s = {}; s[this.resourceName] = serialized;
      return s;
    } else {
      return serialized;
    }
  },

  deserialize: function(json) {
    var key, value, _ref;

    Ember.beginPropertyChanges(this);

    for (key in json) {
      value = json[key];

      if ((_ref = this.deserializers) != null ? _ref[key] : void 0) {
        value = this.deserializers[key].call(this, value);
      }

      this.set(key, value);
    }

    this.set('isFetched', true);

    Ember.endPropertyChanges(this);

    this._updatePersistedProperties();

    return this;
  },

  fetch: function(options) {
    var _this = this;

    this.set('isFetching', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    return this.resourceAdapter.request('read', options)
      .done(function(data, textStatus, jqXHR) {
        _this.deserialize(data);
        _this._updatePersistedProperties();

        _this.set('isFetching', false);
      });
  },

  save: function(options) {
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
      .done(function(data, textStatus, jqXHR) {
        _this.deserialize(data);
        _this._updatePersistedProperties();

        _this.set('isSaving', false);
      });
  },

  destroy: function(options) {
    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    return this.resourceAdapter.request('delete', options);
  },

  revert: function(key) {
    this.set(key, this.persistedProperties[key]);
    this.dirtyProperties.removeObject(key);
  },

  revertAll: function() {
    var _this = this;

    Ember.beginPropertyChanges(this);

    this.dirtyProperties.forEach(function(key) {
      _this.set(key, _this.persistedProperties[key]);
    });

    this.dirtyProperties.clear();

    Ember.endPropertyChanges(this);
  },

  _updatePersistedProperties: function() {
    if (Array.isArray(this.resourceProperties)) {
      var persisted, _this = this;

      persisted = {};

      this.resourceProperties.forEach(function(key) {
        persisted[key] = _this.get(key);
      });

      this.set('persistedProperties', persisted);

      this.dirtyProperties.clear();
    }
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
      throw new Error('You cannot use `find()` without specifying a `resourceCollectionPath` on the Resource\'s prototype!');
    }
  },

  all: function() {
    var collection;

    if (this.resourceCollectionPath) {
      collection = Ember.get(this.resourceCollectionPath);

      if (!collection.get('isFetched')) {
        collection.fetchAll();
      }

      return collection.get('content');
    } else {
      throw new Error('You cannot use `all()` without specifying a `resourceCollectionPath` on the Resource\'s prototype!');
    }
  }
});

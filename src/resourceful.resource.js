/**
* @class Resourceful.Resource
* @constructor
*/
Resourceful.Resource = Ember.Object.extend({
  resourceAdapter: null,

  isPersisted: false,

  isFetching: false,
  isFetched: false,
  isSaving: false,
  isDeleting: false,
  isDeleted: false,

  isDirty: Ember.computed.bool('_dirtyAttributes.length'),

  _lastRequest: null,

  init: function() {
    if (!this._data) this.setupData();
    this._super();
  },

  /**
  * @method setupData
  */
  setupData: function() {
    this.setProperties({
      _data: {},
      _persistedData: {},
      _dirtyAttributes: []
    });
  },

  /**
  * Serializes the resource's data so it's ready to be sent to the server.
  *
  * @method serialize
  * @return {Object} Serialized data object
  */
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

  /**
  * Deserializes the passed data and adds it to the resource.
  *
  * @method deserialize
  * @param {Object} data The data to be deserialized
  * @return {Object} Serialized data object
  */
  deserialize: function(data) {
    var _this = this;

    Ember.beginPropertyChanges(this);

    Ember.keys(data).forEach(function(key) {
      var collection, value = data[key];

      if (_this.get(key + '.embedded')) {
        collection = Resourceful.collectionFor(_this.get(key + '.foreignResourceClass'));
        collection.loadAll(value);
      } else {
        _this.set(key, _this._deserializeAttr(key, data[key]));
      }
    });

    this.set('isPersisted', true);

    Ember.endPropertyChanges(this);

    this._updatePersistedData();

    return this;
  },

  /**
  * Loads the resource from the server.
  *
  * @method findResource
  * @param {Object} options Options to be passed to `ResourceAdapter#request()`
  * @return {RSVP.Promise} The promise returned from the ResourceAdapter
  */
  findResource: function(options) {
    var resolved, rejected, _this = this;

    this.set('isFetching', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    resolved = function(data) {
      _this.deserialize(data);
      _this.set('isFetching', false);
    };

    rejected = function() {
      _this.set('isFetching', false);
    }

    return this._request('read', options).then(resolved, rejected);
  },

  /**
  * Persists the resource to the server.
  *
  * @method saveResource
  * @param {Object} options Options to be passed to `ResourceAdapter#request()`
  * @return {RSVP.Promise} The promise returned from the ResourceAdapter
  */
  saveResource: function(options) {
    var method, resolved, promise, _this = this;

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

    method = this.get('isPersisted') ? 'create' : 'update';

    resolved = function(data) {
      _this.deserialize(data);
      _this.set('isSaving', false);
    };

    rejected = function() {
      _this.set('isSaving', false);
    };

    return this._request(method, options).then(resolved, rejected);
  },

  /**
  * Deletes the resource from the server.
  *
  * @method deleteResource
  * @param {Object} options Options to be passed to `ResourceAdapter#request()`
  * @return {RSVP.Promise} The promise returned from the ResourceAdapter
  */
  deleteResource: function(options) {
    var resolved, rejected, _this = this;

    this.set('isDeleting', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    resolved = function() {
      _this.set('isDeleting', false);
      _this.set('isDeleted', true);
    };

    rejected = function() {
      _this.set('isDeleting', false);
    };

    return this._request('delete', options).then(resolved, rejected);
  },

  /**
  * Reverts the passed attributes to their previous values (or all attributes if nothing is passed).
  *
  * @method revertAttributes
  * @param {Array} keys Attributes to be reverted
  */
  revertAttributes: function(keys) {
    var keys, _this = this;

    if (Ember.typeOf(keys) == 'string' && arguments.length > 0) {
      keys = Array.prototype.slice.call(arguments, 0);
    }

    if (!keys) {
      keys = Ember.keys(this._persistedData);
    }

    Ember.beginPropertyChanges(this);

    keys.forEach(function(key) {
      _this.set(key, _this._persistedData[key]);
      _this._dirtyAttributes.removeObject(key);
    });

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

    Ember.beginPropertyChanges(this);

    this._dirtyAttributes.clear();

    Ember.keys(this.get('_data')).forEach(function(key) {
      _this.set('_persistedData.' + key, _this.get('_data.' + key));
    });

    Ember.endPropertyChanges(this);
  },

  _resourceUrl: function() {
    var url, adapter = this.get('resourceAdapter');

    url = adapter.buildURI(this.constructor.resourceUrl);

    if (!this.get('isPersisted')) {
      url += '/' + this.get('id');
    }

    return url;
  },

  _request: function() {
    var args, adapter, request;

    args = arguments;
    adapter = this.resourceAdapter;

    request = function() {
      return adapter.request.apply(adapter, args);
    };

    this._lastRequest = (this._lastRequest) ? this._lastRequest.then(request, request) : request();

    return this._lastRequest;
  }
});

Resourceful.Resource.reopenClass({
  find: function(id, options) {
    var collection = Resourceful.collectionFor(this);

    if (!id || Ember.typeOf(id) === 'object') {
      return collection.findAllResources(id);
    } else {
      return collection.findResource(id, options);
    }
  }
});

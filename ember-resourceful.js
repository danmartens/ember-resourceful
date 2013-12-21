/* Ember Resourceful v0.1 */

(function() {

var slice = Array.prototype.slice;

window.Resourceful = {};

Resourceful.collectionFor = function(resourceClass) {
  if (resourceClass.resourceCollectionPath) {
    return Ember.get(resourceClass.resourceCollectionPath);
  } else {
    Ember.assert("Could not find a collection for this Resource. You must set `resourceCollectionPath` on the Resource's prototype.");
  }
};

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

Resourceful.ResourceCollection = Ember.ArrayProxy.extend({
  resourceClass: null,
  resourceAdapter: null,

  isFetching: false,
  isFetched: false,

  init: function() {
    var _this = this;

    if (!this.get('content')) {
      this.set('content', Ember.A());
    }

    this._super();
  },

  findResource: function(id, options) {
    var promise, resource, _this = this;

    resource = this.findProperty('id', id);

    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      if (resource) {
        resolve(resource);
      } else {
        resource = _this.resourceClass.create({ id: id });

        resource.findResource(options).then(function() {
          _this.pushObject(resource);
          resolve(resource);
        }, reject);
      }
    });

    return promise;
  },

  findAllResources: function(options) {
    var promise, _this = this;

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      _this.resourceAdapter.request('read', options)
        .then(function(data) {
          _this.loadAll(data);
          _this.set('isFetching', false);
          _this.set('isFetched', true);
          resolve(_this.get('content'));
        }, reject);
    });

    return promise;
  },

  load: function(json) {
    var resource;

    resource = this.findProperty('id', json.id);

    if (!resource) {
      resource = this.resourceClass.create();
    }

    resource.deserialize(json);

    if (!this.contains(resource)) {
      this.pushObject(resource);
    }
  },

  loadAll: function(json) {
    var _this = this;

    json.forEach(function(j) {
      _this.load(j);
    });
  },

  _resourceUrl: function() {
    var adapter = this.get('resourceAdapter');
    return adapter.buildURI(this.resourceClass.resourceUrl);
  }
});

Resourceful.ResourceAdapter = Ember.Object.extend({
  namespace: '',

  request: function(method, options) {
    var crud, promise, jqXHR, _this = this;

    crud = {
      'create': 'POST',
      'update': 'PUT',
      'read': 'GET',
      'delete': 'DELETE'
    };

    if (!options) {
      options = {};
    }

    options = this.prepareRequest(jQuery.extend({
      dataType: 'json',
      type: crud[method]
    }, options));

    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var done = function(data) {
        resolve(_this.prepareResponse(data));
      };

      var fail = function(jqXHR, textStatus, errorThrown) {
        reject(errorThrown);
      };

      jqXHR = $.ajax(options).done(done).fail(fail);
    });

    promise.xhr = {
      abort: jqXHR.abort
    };

    return promise;
  },

  buildURI: function(parts) {
    if (arguments.length > 1) {
      parts = slice.call(arguments, 0);
    } else if (typeof parts === 'string') {
      parts = [parts];
    }

    return encodeURI((this.namespace + '/' + parts.join('/')).replace(/\/+/g, '/'));
  },

  prepareRequest: function(options) {
    return options;
  },

  prepareResponse: function(json) {
    return json;
  }
});

}).call(this);
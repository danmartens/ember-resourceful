/*
 *   Ember Resourceful 0.0.1
 *
 *   Copyright (c) 2012-2013 Dan Martens
 *   http://danmartens.com
 *
 *   Permission is hereby granted, free of charge, to any person obtaining 
 *   a copy of this software and associated documentation files (the 
 *   "Software"), to deal in the Software without restriction, including 
 *   without limitation the rights to use, copy, modify, merge, publish, 
 *   distribute, sublicense, and/or sell copies of the Software, and to 
 *   permit persons to whom the Software is furnished to do so, subject to 
 *   the following conditions:
 *
 *   The above copyright notice and this permission notice shall be 
 *   included in all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
 *   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
 *   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 *   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 *   LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
 *   OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
 *   WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
 */

(function() {
  window.Resourceful = {};

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
      this.persistedProperties = {};
      this.dirtyProperties = [];
      return this._super();
    },

    isNew: function() {
      return this.get('id') === undefined;
    }.property('id'),

    isDirty: function() {
      return this.get('dirtyProperties.length') !== 0;
    }.property('dirtyProperties.length'),

    set: function(key, value) {
      if (this.resourceProperties.contains(key) && (this.get(key) !== value)) {
        if (!this.dirtyProperties.contains(key)) {
          this.dirtyProperties.pushObject(key);
        }
      }

      return this._super(key, value);
    },

    serialize: function() {
      var serialized, _this = this;

      serialized = {};

      this.resourceProperties.forEach(function(key) {
        var _ref;
        if ((_ref = _this.serializers) != null ? _ref[key] : void 0) {
          return serialized[key] = _this.serializers[key](_this.get(key));
        } else {
          return serialized[key] = _this.get(key);
        }
      });

      return serialized;
    },

    deserialize: function(json) {
      var key, value, _ref;

      Ember.beginPropertyChanges(this);

      for (key in json) {
        value = json[key];

        if ((_ref = this.deserializers) != null ? _ref[key] : void 0) {
          value = this.deserializers[key](value);
        }

        this.set(key, value);
      }

      Ember.endPropertyChanges(this);

      return this;
    },

    fetch: function(options) {
      var success, _this = this;

      this.set('isFetching', true);

      if (!options) {
        options = {};
      } else if (options.success) {
        success = options.success;
      }

      options.success = function(data, textStatus, jqXHR) {
        _this.deserialize(data);
        _this._updatePersistedProperties();

        _this.set('isFetching', false);
        _this.set('isFetched', false);

        return (typeof success === "function") ? success(data, textStatus, jqXHR) : void 0;
      };

      this.resourceAdapter.request('read', this, options);

      return this;
    },

    save: function(options) {
      var success,
        _this = this;

      this.set('isSaving', true);

      if (!options) {
        options = {};
      }

      if (options.success) {
        success = options.success;
      }

      options.success = function(data, textStatus, jqXHR) {
        _this.deserialize(data);
        _this._updatePersistedProperties();

        _this.set('isSaving', false);

        return typeof success === "function" ? success(data, textStatus, jqXHR) : void 0;
      };

      options.data || (options.data = this.serialize());

      this.resourceAdapter.request('create', this, options);

      return this;
    },

    destroy: function(options) {
      if (!options) {
        options = {};
      }

      this.resourceAdapter.request('delete', this, options);

      return this;
    },

    revert: function(key) {
      this.set(key, this.persistedProperties(key));
      this.dirtyProperties.removeObject(key);
    },

    revertAll: function() {
      var _this = this;

      Ember.beginPropertyChanges(this);

      this.dirtyProperties.forEach(function(key) {
        _this.revertProperty(key);
      });

      this.dirtyProperties.clear();

      Ember.endPropertyChanges(this);
    },

    _updatePersistedProperties: function() {
      var persisted, _this = this;

      persisted = {};

      this.get('resourceProperties').forEach(function(prop) {
        persisted[prop] = _this.get('prop');
      });

      this.set('persistedProperties', persisted);

      this.dirtyProperties.clear();
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
      if (this.resourceCollectionPath) {
        Ember.get(this.resourceCollectionPath).fetchAll();
        return Ember.get(this.resourceCollectionPath).get('content');
      } else {
        throw new Error('You cannot use `all()` without specifying a `resourceCollectionPath` on the Resource\'s prototype!');
      }
    }
  });

  Resourceful.ResourceCollection = Ember.ArrayController.extend({
    resourceClass: null,
    resourceAdapter: null,

    findById: function(id) {
      var resource;

      resource = this.findProperty('id', json.id);

      if (!resource) {
        resource = this.resourceClass.create({ id: id });

        resource.fetch();

        this.pushObject(resource);
      }

      return resource;
    },

    fetch: function(id, options) {
      var resource;

      if (!options) {
        options = {};
      }

      resource = this.resourceClass.create({
        id: id
      });

      resource.fetch(options);

      this.pushObject(resource);

      return resource;
    },

    fetchAll: function(options) {
      var success,
        _this = this;

      if (!options) {
        options = {};
      }

      if (options.success) {
        success = options.success;
      }

      options.success = function(data, textStatus, jqXHR) {
        _this.loadAll(data);

        return (typeof success === "function") ? success(data, textStatus, jqXHR) : void 0;
      };

      options.url || (options.url = this.resourceClass.resourceUrl);

      return this.resourceAdapter.request('read', options);
    },

    loadAll: function(json) {
      var _this = this;

      return json.forEach(function(j) {
        return _this.load(j);
      });
    },

    load: function(json) {
      var resource;

      resource = this.findProperty('id', json.id);

      if (!resource) {
        resource = this.resourceClass.create();
      }

      resource.deserialize(json);

      return resource._updatePersistedProperties();
    }
  });

  Resourceful.ResourceAdapter = Ember.Object.extend({
    namespace: '',
    extension: '',

    request: function(method, resource, options) {
      var crud, success, _this = this;

      crud = {
        'create': 'POST',
        'update': 'PUT',
        'read': 'GET',
        'delete': 'DELETE'
      };

      if ((options != null) && !(options.url != null)) {
        options.url = this.namespace + '/' + resource.constructor.resourceUrl;

        if (!resource.get('isNew')) {
          options.url += resource.get('id');
        }

        options.url += this.extension;
      } else {
        options = resource;
      }

      if (options.success) {
        success = options.success;

        options.success = function(data, textStatus, jqXHR) {
          return success(_this.prepareResponse(data), textStatus, jqXHR);
        };
      }

      options = this.prepareRequest(jQuery.extend({
        dataType: 'json',
        type: crud[method]
      }, options));

      return jQuery.ajax(options);
    },

    prepareRequest: function(options) {
      return options;
    },

    prepareResponse: function(json) {
      return json;
    }
  });

}).call(this);
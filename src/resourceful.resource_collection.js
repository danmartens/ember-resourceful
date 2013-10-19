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

    this._resourceIndex = {};

    this.addArrayObserver(Ember.Object.create({
      arrayWillChange: function(observedObj, start, removeCount, addCount) {
        var removed;

        if (removeCount > 0) {
          observedObj.slice(start, start + removeCount).forEach(function(resource) {
            if (_this._resourceIndex[resource.id]) {
              delete _this._resourceIndex[resource.id];
            }
          });
        }
      },
      arrayDidChange: function(observedObj, start, removeCount, addCount) {
        var added, filtered;

        if (addCount > 0) {
          observedObj.slice(start, start + addCount).forEach(function(resource) {
            _this._resourceIndex[resource.id] = resource;
          });
        }
      }
    }));
  },

  findById: function(id) {
    var resource;

    resource = this._resourceIndex[id];

    if (!resource) {
      resource = this.resourceClass.create({ id: id });

      resource.fetchResource();

      this.pushObject(resource);
    }

    return resource;
  },

  fetch: function(id, options) {
    var resource, _this = this;

    if (!options) {
      options = {};
    }

    resource = this.resourceClass.create({ id: id });

    return resource.fetchResource(options)
      .then(function() {
        _this.pushObject(resource);
      });
  },

  fetchAll: function(options) {
    var success, _this = this;

    this.set('isFetching', true);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    return this.resourceAdapter.request('read', options)
      .then(function(data, textStatus, jqXHR) {
        _this.loadAll(data);
        _this.set('isFetching', false);
        _this.set('isFetched', true);
      });
  },

  loadAll: function(json) {
    var _this = this;

    json.forEach(function(j) {
      _this.load(j);
    });
  },

  load: function(json) {
    var resource;

    resource = this._resourceIndex[json.id];

    if (!resource) {
      resource = this.resourceClass.create();
    }

    resource.deserialize(json);

    if (!this.contains(resource)) {
      this.pushObject(resource);
    }
  },

  _resourceUrl: function() {
    return this.resourceAdapter.namespace + this.resourceClass.resourceUrl;
  }
});

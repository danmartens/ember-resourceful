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
    var resource = this.findProperty('id', id);

    if (!options) {
      options = {};
    }

    if (!options.url) {
      options.url = this._resourceUrl();
    }

    if (!resource) {
      resource = this.resourceClass.create({ id: id });
      resource.fetchResource(options);

      this.pushObject(resource);
    }

    return resource;
  },

  findAllResources: function(options) {
    if (!this.get('isFetched')) {
      this.fetchAllResources(options);
    }

    return this.get('content');
  },

  fetchResource: function(id, options) {
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

  fetchAllResources: function(options) {
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

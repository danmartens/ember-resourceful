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

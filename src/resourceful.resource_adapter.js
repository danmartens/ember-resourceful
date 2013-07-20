Resourceful.ResourceAdapter = Ember.Object.extend({
  namespace: '',

  request: function(method, options) {
    var crud, deferred, jqXHR, _this = this;

    crud = {
      'create': 'POST',
      'update': 'PUT',
      'read': 'GET',
      'delete': 'DELETE'
    };

    deferred = $.Deferred();

    if (!options) {
      options = {};
    }

    options.success = function(data, textStatus, jqXHR) {
      deferred.resolve(_this.prepareResponse(data), textStatus, jqXHR);
    };

    options.error = function(jqXHR, textStatus, errorThrown) {
      deferred.reject(jqXHR, textStatus, errorThrown);
    };

    options = this.prepareRequest(jQuery.extend({
      dataType: 'json',
      type: crud[method]
    }, options));

    jqXHR = $.ajax(options);

    ['abort'].forEach(function(method) {
      deferred[method] = jqXHR[method];
    });

    return deferred;
  },

  buildURI: function(parts) {
    if (arguments.length > 1) {
      parts = slice.call(arguments, 0)
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

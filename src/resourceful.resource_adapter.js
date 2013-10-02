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

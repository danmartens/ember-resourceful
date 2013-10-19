describe('Resourceful.ResourceAdapter', function() {
  describe('#buildURI()', function() {
    var adapter;

    beforeEach(function() {
      adapter = Resourceful.ResourceAdapter.create({
        namespace: '/api/1'
      });
    });

    it('can build a URI from multiple parts', function() {
      expect(adapter.buildURI('resource')).to.be('/api/1/resource');
      expect(adapter.buildURI('resource', 4, 'edit')).to.be('/api/1/resource/4/edit');
      expect(adapter.buildURI('/resource/', '/endpoint')).to.be('/api/1/resource/endpoint');
      expect(adapter.buildURI(['from', 'an', 'array'])).to.be('/api/1/from/an/array');
    });
  });

  describe('#request()', function() {
    var adapter, xhr, requests, respond;

    respond = function(request, status, response) {
      if (typeof status !== 'number') {
        response = status;
        status = 200;
      }

      Ember.run(function() {
        request.respond(status, {
          "Content-Type": "application/json"
        }, JSON.stringify(response));
      });
    };

    before(function() {
      adapter = Resourceful.ResourceAdapter.create();
      xhr = sinon.useFakeXMLHttpRequest();

      xhr.onCreate = function(request) {
        requests.push(request);
      };
    });

    beforeEach(function() {
      requests = [];
    });

    after(function() {
      xhr.restore();
    });

    it('resolves the returned promise if the request is succesful', function(done) {
      var promise = adapter.request('read', { url: '/test.json' });

      promise.then(function() {
        expect(true).ok(); done();
      }, function() {
        expect().fail(); done();
      });

      respond(requests[0], {});
    });

    it('rejects the returned promise if the request is unsuccesful', function(done) {
      var promise = adapter.request('read', { url: '/test.json' });

      promise.then(function() {
        expect().fail(); done();
      }, function() {
        expect(true).ok(); done();
      });

      respond(requests[0], 500, {});
    });
  });
});
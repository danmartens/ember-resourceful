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
    var adapter, server;

    beforeEach(function() {
      server = sinon.fakeServer.create();
      adapter = Resourceful.ResourceAdapter.create();
    });

    afterEach(function() {
      server.restore();
    });

    it('resolves the returned promise if the request is succesful', function(done) {
      server.respondWith('GET', '/test.json',
        [200, { 'Content-Type': 'application/json' }, '{}']);

      var promise = adapter.request('read', { url: '/test.json' });

      server.respond();

      promise.then(function() {
        expect(true).ok();
      }, function() {
        expect().fail();
      }).then(done, done);
    });

    it('rejects the returned promise if the request is unsuccesful', function(done) {
      server.respondWith('GET', '/test.json',
        [500, { 'Content-Type': 'application/json' }, '{}']);

      var promise = adapter.request('read', { url: '/test.json' });

      server.respond();

      promise.then(function() {
        expect().fail();
      }, function() {
        expect(true).ok();
      }).then(done, done);
    });
  });
});
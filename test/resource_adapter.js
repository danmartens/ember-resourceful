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
});
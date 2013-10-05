describe('Resourceful.HasManyArray', function() {
  var App, post, comment, GLOBAL = {};

  Ember.lookup = GLOBAL;
  App = GLOBAL.App = Ember.Application.create();

  App.setupForTesting();

  App.Comment = Resourceful.Resource.extend();

  App.Comment.reopenClass({
    resourceCollectionPath: 'App.comments'
  });

  App.Post = Resourceful.Resource.extend({
    comments: Resourceful.hasMany('App.Comment', { key: 'post_id' })
  });

  beforeEach(function() {
    App.comments = Resourceful.ResourceCollection.create({
      resourceClass: App.Comment
    });

    post = App.Post.create({ id: 1 });
    comment = App.Comment.create({ id: 1, post_id: 1 });

    App.comments.pushObject(comment);
  });

  it('intializes with related resources', function() {
    expect(post.get('comments.content.length')).to.be(1);
  });

  it('adds new resources if related', function() {
    App.comments.pushObject(App.Comment.create({ id: 2, post_id: 1 }));
    expect(post.get('comments.content.length')).to.be(2);
  });

  it('removes changed resources if no longer related', function() {
    comment.set('post_id', 2);
    expect(post.get('comments.content.length')).to.be(0);
  });
});
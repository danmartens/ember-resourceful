describe('Resourceful.HasManyArray', function() {
  var post, comment, GLOBAL = {};

  before(function() {
    Ember.lookup = GLOBAL;

    GLOBAL.Comment = Resourceful.Resource.extend();

    GLOBAL.Comment.reopenClass({
      resourceCollectionPath: 'comments'
    });

    GLOBAL.Post = Resourceful.Resource.extend({
      comments: Resourceful.hasMany('Comment', { key: 'post_id', nested: true })
    });
  });

  after(function() {
    Ember.lookup = window;
  });

  beforeEach(function() {
    GLOBAL.comments = Resourceful.ResourceCollection.create({
      resourceClass: GLOBAL.Comment
    });

    post = GLOBAL.Post.create({ id: 1 });
    comment = GLOBAL.Comment.create({ id: 1, post_id: 1 });

    GLOBAL.comments.pushObject(comment);
  });

  it('intializes with related resources', function() {
    expect(post.get('comments.content.length')).to.be(1);
  });

  it('adds new resources if related', function() {
    GLOBAL.comments.pushObject(GLOBAL.Comment.create({ id: 2, post_id: 1 }));
    expect(post.get('comments.content.length')).to.be(2);
  });

  it('removes changed resources if no longer related', function() {
    expect(post.get('comments.content.length')).to.be(1);
    comment.set('post_id', 2);
    expect(post.get('comments.content.length')).to.be(0);
  });

  it('updates the content if the primary key changes', function() {
    expect(post.get('comments.content.length')).to.be(1);
    post.set('id', 2);
    expect(post.get('comments.content.length')).to.be(0);
  });

  it('deserializes nested resources', function() {
    post.deserialize({
      title: 'A Test Post',
      comments: [
        {
          id: 2,
          body: 'This is a nested comment.'
        }
      ]
    });

    expect(GLOBAL.comments.findProperty('id', 2).get('body')).to.be('This is a nested comment.');
  });
});
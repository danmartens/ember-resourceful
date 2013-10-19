describe('Resourceful.BelongsToObject', function() {
  var post1, post2, comment, GLOBAL = {};

  before(function() {
    Ember.lookup = GLOBAL;

    GLOBAL.Post = Resourceful.Resource.extend();

    GLOBAL.Post.reopenClass({
      resourceCollectionPath: 'posts'
    });

    GLOBAL.Comment = Resourceful.Resource.extend({
      post: Resourceful.belongsTo('Post', { key: 'post_id' })
    });
  });

  after(function() {
    Ember.lookup = window;
  });

  beforeEach(function() {
    GLOBAL.posts = Resourceful.ResourceCollection.create({
      resourceClass: GLOBAL.Post
    });

    post1 = GLOBAL.Post.create({ id: 1 });
    post2 = GLOBAL.Post.create({ id: 2 });
    comment = GLOBAL.Comment.create({ id: 4, post_id: 1 });

    GLOBAL.posts.pushObjects([post1, post2]);
  });

  it('intializes with the related resource', function() {
    expect(comment.get('post.content')).to.be(post1);
  });

  it('updates if the foreign key changes', function() {
    comment.set('post_id', 2);
    expect(comment.get('post.content')).to.be(post2);
  });

  it('updates if the primary key changes', function() {
    post1.set('id', 3);
    expect(comment.get('post.content')).to.be(undefined);
  });
});
'use strict';
const request = require('supertest');
const app = require('../app');
const assert = require('assert');
const passportStub = require('passport-stub');
const User = require('../models/user');
const Review = require('../models/review');
const deleteReviewAggregate = require('../routes/reviews').deleteReviewAggregate;

describe('/login', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('ログインのためのリンクが含まれる', (done) => {
    request(app)
      .get('/login')
      .expect('Content-type', 'text/html; charset=utf-8')
      .expect(/<a href="\/auth\/github"/)
      .expect(200, done)
  });

  it('ログイン時はユーザー名が表示される', (done) => {
    request(app)
      .get('/login')
      .expect(/testuser/)
      .expect(200, done);
  });  
});

describe('/logout', () => {
  it('ログアウトにアクセスした際に/にリダイレクトされる', (done) => {
    request(app)
    .get('/logout')
    .expect('Location', '/')
    .expect(302, done);
  });
});

describe('/reviews', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });
  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('記録が作成でき、表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/reviews')
        .send({ reviewName: 'テスト記録1', author: 'テストauthor', publisher: 'テストpublisher', memo: 'テストメモ１\r\nテストメモ２', format: 0})
        .expect('Location', /reviews/)
        .expect(302)
        .end((err, res) => {
          const createdReviewPath =res.header.location;
          request(app)
            .get(createdReviewPath)
            .expect(/テスト記録1/)
            .expect(/テストauthor/)
            .expect(/テストpublisher/)
            .expect(/テストメモ１/)
            .expect(/テストメモ２/)
            .expect(/0/)
            .expect(200)
            .end((err, res) => {
              deleteReviewAggregate(createdReviewPath.split('/reviews/')[1], done, err);
            });
          });
        });
    });
  });

describe('/reviews/:reviewId?edit=1', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('記録が更新できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/reviews')
        .send({ reviewName: 'テスト更新記録1', author: 'テスト更新author１', publisher: 'テスト更新publisher１', memo: 'テスト更新メモ１', format: 0 })
        .end((err, res) => {
          const createdReviewPath = res.headers.location;
          const reviewId = createdReviewPath.split('/reviews/')[1];
          //更新がされることをテスト
          request(app)
            .post(`/reviews/${reviewId}?edit=1`)
            .send({ reviewName: 'テスト更新記録２', author: 'テスト更新author２', publisher: 'テスト更新publisher２', memo: 'テスト更新メモ２', format: 1 })
            .end((err, res) => {
              Review.findByPk(reviewId).then((r) => {
                assert.equal(r.reviewName, 'テスト更新記録２');
                assert.equal(r.author, 'テスト更新author２');
                assert.equal(r.publisher, 'テスト更新publisher２');
                assert.equal(r.memo, 'テスト更新メモ２');
                assert.equal(r.format, 1);
                deleteReviewAggregate(reviewId, done, err);
              });
            });
        });
    });
  });
});



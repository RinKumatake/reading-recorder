'use strict';
const express =require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Review = require('../models/review');
const User = require('../models/user');
const moment = require('moment-timezone');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  const reviewId = uuid.v4();
  const updatedAt = new Date();
  const updatedYear = updatedAt.getFullYear();
  Review.create({
    reviewId: reviewId,
    reviewName: req.body.reviewName.slice(0, 255) || '(未設定)',
    author: req.body.author.slice(0, 255) || '(未設定)',
    publisher: req.body.publisher.slice(0, 255) || '(未設定)',
    memo: req.body.memo,
    createdBy: req.user.id,
    updatedAt: updatedAt,
    updatedYear: updatedYear,
    format: req.body.format || '(未設定)',
    category: req.body.category || '(未設定)'
  }).then((review) => {
    res.redirect('/reviews/' + review.reviewId);
  });  
});

router.get('/:reviewId', authenticationEnsurer, (req, res, next) => {
  Review.findOne({
    include: [
      {
        model: User,
        attributes: ['userId', 'username']
      }],
    where: {
      reviewId: req.params.reviewId
    },
    order: [['"updatedAt"', 'DESC']]
  }).then((review) => {    
    if(review) {
    review.formattedUpdatedAt = moment(review.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    res.render('review', {
      review: review
    });
  } else {
      const err = new Error('指定された記録は見つかりません');
      err.status = 404;
      next(err);
  }
  });
});

router.get('/:reviewId/edit', authenticationEnsurer, (req, res, next) => {
  Review.findOne({
    where: {
      reviewId: req.params.reviewId
    }
  }).then((review) => {
    if (isMine(req, review)) {
      res.render('edit', {
        user: req.user,
        review: review
      });
    } else {
      const err = new Error('指定された記録がない、または記録に対する権限がありません');
      err.status = 404;
      next(err);
     }
  });
});

function isMine(req, review) {
  return review && parseInt(review.createdBy) === parseInt(req.user.id);
}

router.post('/:reviewId', authenticationEnsurer, (req, res, next) => {
  Review.findOne({
    where: {
      reviewId: req.params.reviewId
    }
  }).then((review) => {
    if(review && isMine(req, review)) {
      if(parseInt(req.query.edit)===1) {
        const updatedAt = new Date();
        const updatedYear = updatedAt.getFullYear();
        review.update({
          reviewId: review.reviewId,
          reviewName: req.body.reviewName.slice(0, 255) || '(未設定)',
          author: req.body.author.slice(0, 255) || '(未設定)',
          publisher: req.body.publisher.slice(0, 255) || '(未設定)',
          memo: req.body.memo,
          createdBy: req.user.id,
          updatedAt: updatedAt,
          updatedYear: updatedYear,
          format: req.body.format || '(未設定)',
          category: req.body.category || '(未設定)'
        }).then((review) => {
          res.redirect('/reviews/' + review.reviewId);
        });
      } else if (parseInt(req.query.delete) === 1) {
        deleteReviewAggregate(req.params.reviewId, () => {
          res.redirect('/');
        });
      } else {
        const err = new Error('不正なリクエストです');
      }
    } else {
      const err = new Error('指定された記録がない、または記録に対する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

function deleteReviewAggregate(reviewId, done, err) {
  Review.findByPk(reviewId).then((s) => {
    s.destroy().then(() => {
      if (err) return done(err);
      done();
    });
  });
}

router.deleteReviewAggregate = deleteReviewAggregate;

module.exports = router;
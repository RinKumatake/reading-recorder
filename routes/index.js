const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const moment = require('moment-timezone');


/* GET home page. */
router.get('/', (req, res, next) => {  
  const title = 'りーでぃんぐれこーだー';
  if (req.user) {
    Review.findAll({
      where: {
        createdBy: req.user.id
      },
      order: [['"updatedAt"', 'DESC']],
      limit: 10
    }).then((reviews) => {
      reviews.forEach((review) => {
        review.formattedUpdatedAt = moment(review.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      });
      res.render('index', {
        title: title,
        user: req.user,
        reviews: reviews
      });
    });
  } else {
    res.render('index', { title: title, user: req.user });
  }  
});

module.exports = router;

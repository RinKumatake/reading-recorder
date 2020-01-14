var express = require('express');
var router = express.Router();
var Review = require('../models/review');

/* GET home page. */
router.get('/', (req, res, next) => {
  const title = 'りーでぃんぐれこーだー';
  if (req.user) {
    Review.findAll({
      where: {
        createdBy: req.user.id
      },
      order: [['"updatedAt"', 'DESC']]
    }).then((reviews) => {
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

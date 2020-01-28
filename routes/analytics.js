'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Review = require('../models/review');
const moment = require('moment-timezone');

router.get('/', authenticationEnsurer, (req, res, next) => {    
  Review.findAll({ 
    where: {
      createdBy: req.user.id
    }   
  }).then((reviews) => {
     var set = new Set();     
     reviews.forEach((y) => {
       set.add(y.updatedYear);       
      }); 
      for (var yearList of set) {
        var reportedYear = new Array();
        reportedYear.push(yearList);        
      }        
      res.render('analytics', 
        {
          user: req.user,          
          reviews: reviews,
          reportedYear: reportedYear
        });
    }); 
});  

router.get('/:updatedYear', authenticationEnsurer, (req, res, next) => { 
  Review.findAll({ 
    where: {
      createdBy: req.user.id,
      updatedYear: req.params.updatedYear
    },
    order: [['"updatedAt"', 'DESC']]
  }).then((reviews) => { 
    reviews.forEach((review) => {
      review.formattedUpdatedAt = moment(review.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    })   
    var countFormatPaper = 0;
    var countFormatElectronic = 0;
    var countFormatDefault = 0;
    var countCategoryStudy = 0;
    var countCategoryEntertainment = 0;
    var countCategoryDefault = 0;
      reviews.forEach((a) => {      
        if(a.format === '紙') {
          countFormatPaper = countFormatPaper + 1;
        } else if (a.format === '電子') {
          countFormatElectronic = countFormatElectronic + 1;
        } else {
          countCategoryDefault = countFormatDefault + 1;
        }
      });
      reviews.forEach((b) => {
        if(b.category === '学習') {
          countCategoryStudy = countCategoryStudy + 1;
        } else if (b.category === '娯楽') {
          countCategoryEntertainment = countCategoryEntertainment + 1;
        } else {
          countCategoryDefault = countCategoryDefault + 1;
        }
      });
      res.render('annual-analytics', 
        {
          user: req.user, 
          reviews: reviews,          
          countFormatPaper: countFormatPaper,
          countFormatElectronic: countFormatElectronic,
          countFormatDefault: countFormatDefault,
          countCategoryStudy : countCategoryStudy,
          countCategoryEntertainment: countCategoryEntertainment,
          countCategoryDefault: countCategoryDefault,
          updatedYear: req.params.updatedYear
        });
        });
});

module.exports = router;

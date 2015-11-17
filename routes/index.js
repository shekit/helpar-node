var express = require('express');
var router = express.Router();

/* GET home page. */


router.get('/helper', function(req, res, next) {
  res.render('helper');
});

router.get('/helpee', function(req,res,next){
  res.render('helpee')
})

router.get('/rooms', function(req,res,next){
	res.render('rooms')
})

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

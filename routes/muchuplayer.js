'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var moment=require('moment');

var result={
  status:200,
  message:"",
  data:false,
  server_time:new Date()
};

router.get('/text', function(req, res, next) {
    let query=new AV.Query('_File');
    query.equalTo('name','muchu_cn.text');
    query.first().then(function(data){
        result['data']=data.get('url');
        res.jsonp(result);
    });
});

module.exports = router;
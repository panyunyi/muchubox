'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var moment=require('moment');

var Apps=AV.Object.extend('Apps');
var result={
  status:200,
  message:"",
  data:false,
  server_time:new Date()
};

router.get('/ranklist', function(req, res, next) {
    var query=new AV.Query('Apps');
    query.select(['name','release_date','versionName','iamge']);
    query.ascending('seq');
    query.find().then(function(apps){
        apps.forEach(function(app){
            app.set('appId',app.get('id'));
            app.set('image',app.get('iamge'));
            app.set('release_date',new moment(app.get('release_date')).format('L'));
        });
        result['data']=apps;
        res.jsonp(result);
    });
});

router.get('/category/:code', function(req, res, next) {
    var categoryQuery=new AV.Query('Category');
    categoryQuery.equalTo('code',req.params.code*1);
    categoryQuery.first().then(function(category){
        if(typeof(category)=="undefined"){
            result['data']="";
            result['message']="此类别无app";
            return res.jsonp(result);
        }
        var query=new AV.Query('Apps');
        query.select(['icon','name','release_date','versionName']);
        query.equalTo('category',category);
        query.find().then(function(apps){
            apps.forEach(function(app){
                app.set('appId',app.get('id'));
                app.set('release_date',new moment(app.get('release_date')).format('L'));
            });
            result['data']=apps;
            res.jsonp(result);
        });
    });
});

router.get('/query/:name', function(req, res, next) {
    var query=new AV.Query('Apps');
    query.select(['icon','name','release_date','versionName']);
    query.contains('name',req.params.name);
    query.find().then(function(apps){
        apps.forEach(function(app){
            app.set('appId',app.get('id'));
            app.set('release_date',new moment(app.get('release_date')).format('L'));
        });
        result['data']=apps;
        res.jsonp(result);
    });
});

router.get('/get/:id', function(req, res, next) {
    var query=new AV.Query('Apps');
    query.include('category');
    query.select(['category','packageName','release_data','images','name','versionName',
    'icon','similars','introduce','downloadCount','versionCode','url','image',
    'whatIsNew']);
    query.get(req.params.id).then(function(app){
        if(typeof(app)=="undefined"){
            return res.jsonp(result);
        }
        app.set('category',app.get('category').get('name'));
        app.set('appId',app.get('id'));
        app.set('release_date',new moment(app.get('release_data')).format('L'));
        result['data']=app;
        return res.jsonp(result);
    });
});

router.get('/count/:id', function(req, res, next) {
    var query=new AV.Query('Apps');
    query.get(req.params.id).then(function (app) {
        if(typeof(app)=="undefined"){
            return res.jsonp(result);
        }
        app.increment('downloadCount',1);
        app.save();
        result['data']=true;
        return res.jsonp(result);
    }, function (error) {
        result['message']=error;
        return res.jsonp(result);
    });
});

module.exports = router;

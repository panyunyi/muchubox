'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var AV = require('leanengine');

var app = express();
var Box = AV.Object.extend('Box');
// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/*
app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() });
});*/
app.get('/ad', function(req, res) {
  var query = new AV.Query('Ad');
  query.find().then(function (ads) {
      var data=[];
      ads.forEach(function(ad){
        var json={"id":ad.get('objectId'),"title":ad.get('title'),"imgUrl":ad.get('imgUrl'),"startTime":ad.get('startTime'),"expireTime":ad.get('expireTime'),
              "howLong":ad.get('howLong'),"type":ad.get('type'),"seq":ad.get('seq')};
        data.push(json);
     });
      res.json({
        status:200,
        message:"",
        data:data,
        server_time: new Date()
      });
    }, function (error) {

    });
});

app.get('/version/:tag/:code',function(req,res){
  var query=new AV.Query('Version');
  query.equalTo('tag',req.params.tag);
  query.greaterThan('version_code', req.params.code*1);
  query.first().then(function (data) {
    if(data==null){
      data="";
    }
    res.json({
      status:200,
      message:"",
      data:data,
      server_time: new Date()
    });
  }, function (error) {

  });
});

app.post('/box',function(req,res){
    var box=new Box();
    box.set('mac',req.body.mac);
    box.set('ip',req.body.ip);
    box.save().then(function (box){
        console.log(box.id);
        res.json({
          status:200,
          message:"",
          data:box,
          server_time: new Date()
        });
    },function (error){
        console.error(error.message);
    });
});
// 可以将一类的路由单独保存在一个文件中
//app.use('/todos', todos);

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if(statusCode === 500) {
    console.error(err.stack || err);
  }
  if(req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;

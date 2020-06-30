var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'My App that Integrates with Okta', oktaURL: process.env.OKTA_URL, oktaClientID: process.env.OKTA_CLIENT_ID, oktaIDPID: process.env.OKTA_IDP_ID });
});

module.exports = router;

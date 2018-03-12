const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookiee = require('cookie-encryption');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const saml = require('express-saml2');

const port = process.env.PORT || 8080;

// Public Files
let publicPath = 'public';

// sso
var COOKIE_CODE = 'w450n8... MAKE UP YOUR OWN ...qqvbv07';
var ServiceProvider = saml.ServiceProvider;
var IdentityProvider = saml.IdentityProvider;
var SPMetadata = './server/config/COMPANY_SP_metadata.xml';
var IdPMetadata = './server/config/COMPANY_IDP_metadata.xml';
var sp = ServiceProvider({
        privateKeyFile: './server/config/private-key.pem',
        privateKeyFilePass: '',
        requestSignatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
    }, SPMetadata);
var idp = IdentityProvider({
        isAssertionEncrypted: false
    }, IdPMetadata);

// get encrypted cookie
const cookieHoursMaxAge = 12;
var cookieVault = cookiee(COOKIE_CODE, {
        cipher: 'aes-256-cbc',
        encoding: 'base64',
        cookie: 'ssohist',
        maxAge: cookieHoursMaxAge*60*60*1000,
        httpOnly: true
    });

// Express
const app = express();

// Middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(morgan('dev'));
app.disable('x-powered-by');

// Serve our static stuff like index.css
app.use(express.static(path.join(__dirname, publicPath)));

app.use(passport.initialize());

app.use(cors());

// call the IdP for login.
app.get('/sso/login', function(req, res) {
    sp.sendLoginRequest(idp, 'redirect', function(url) {
        res.redirect(url);
    });
});

// Clear the cookie if a user is directed here (could be from IdP)
app.get('/sso/logout', function(req, res) {
  sp.parseLogoutRequest(idp, 'post', req, function (parseResult) {
      cookieVault.write(req, '');
      sp.sendLogoutResponse(idp, parseResult, 'redirect', req.body.relayState, function (url) {
          res.redirect(url);
      });
  });
})

// if parsing the response results in a nameid being present then they logged in
// store the cookie and proceed, otherwise redirect back to login
app.post('/sso/acs', function (req, res, next) {
    sp.parseLoginResponse(idp, 'post', req, function (parseResult) {
        if (parseResult.extract.nameid) {
            cookieVault.write(req, COOKIE_CODE);
            res.redirect("/");
        } else {
            res.redirect('/sso/login');
        }
    });
});

// Routes

// Send all requests to index.html so browserHistory works
app.get('*', function (req, res) {
    if (cookieVault.read(req) === COOKIE_CODE) {
        res.sendFile(path.join(__dirname, publicPath, 'index.html'))
    } else {
        if (!req.url.includes('favicon'))
            res.redirect('/sso/login');
    }
})

// Start Server on Port 3000
app.listen(port, function() {
    console.log('Express server running at localhost:' + port)
})

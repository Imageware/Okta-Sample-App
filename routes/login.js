const express = require('express');
const router = express.Router();
const request = require('request');
const jwt = require('jsonwebtoken');

function rsaPublicKeyPem(modulus_b64, exponent_b64) {

    let modulus = new Buffer(modulus_b64, 'base64');
    let exponent = new Buffer(exponent_b64, 'base64');

    let modulus_hex = modulus.toString('hex');
    let exponent_hex = exponent.toString('hex');

    modulus_hex = prepadSigned(modulus_hex);
    exponent_hex = prepadSigned(exponent_hex);

    let modlen = modulus_hex.length/2;
    let explen = exponent_hex.length/2;

    let encoded_modlen = encodeLengthHex(modlen);
    let encoded_explen = encodeLengthHex(explen);
    let encoded_pubkey = '30' +
        encodeLengthHex(
            modlen +
            explen +
            encoded_modlen.length/2 +
            encoded_explen.length/2 + 2
        ) +
        '02' + encoded_modlen + modulus_hex +
        '02' + encoded_explen + exponent_hex;

    let der_b64 = new Buffer(encoded_pubkey, 'hex').toString('base64');

    return '-----BEGIN RSA PUBLIC KEY-----\n'
        + der_b64.match(/.{1,64}/g).join('\n')
        + '\n-----END RSA PUBLIC KEY-----\n';

}

function prepadSigned(hexStr) {
    let msb = hexStr[0];
    if (msb < '0' || msb > '7') {
        return '00'+hexStr;
    } else {
        return hexStr;
    }
}

function toHex(number) {
    let nstr = number.toString(16);
    if (nstr.length%2) return '0'+nstr;
    return nstr;
}

// encode ASN.1 DER length field
// if <=127, short form
// if >=128, long form
function encodeLengthHex(n) {
    if (n<=127) return toHex(n);
    else {
        let n_hex = toHex(n);
        let length_of_length_byte = 128 + n_hex.length/2; // 0x80+numbytes
        return toHex(length_of_length_byte)+n_hex
    }
}

function exchangeCodeForToken(code) {
    return new Promise((resolve, reject) => {
        let options = {
            method: 'POST',
            url: process.env.OKTA_URL + '/oauth2/v1/token',
            headers: {
                accept: 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
                authorization: `Basic ${Buffer.from(`${process.env.OKTA_CLIENT_ID}:${process.env.OKTA_CLIENT_SECRET}`).toString('base64')}`
            },
            form: {
                grant_type: 'authorization_code',
                redirect_uri:'http://localhost:9999/login',
                code:code
            }
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error(error);
            } else {
                try {
                    let bodyObj = JSON.parse(body);
                    if (bodyObj && bodyObj.error) {
                        reject(bodyObj.error_description);
                    } else {
                        resolve(bodyObj);
                    }
                } catch(err) {
                    reject(err);
                }
            }
        });
    });
}

function verifyToken(token, publicKey) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, publicKey, function(err, decoded) {
            if(err)
                reject(err);
            else
                resolve(decoded)
        });
    });
}

function getPublicKey() {
    return new Promise((resolve, reject) => {
        let options = {
            method: 'GET',
            url: process.env.OKTA_URL + '/oauth2/v1/keys',
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error(error);
            } else {
                try {
                    let bodyObj = JSON.parse(body);
                    if (bodyObj && bodyObj.error) {
                        reject(bodyObj.error_description);
                    } else {
                        let publicKey = rsaPublicKeyPem(bodyObj.keys[0].n, bodyObj.keys[0].e);
                        resolve(publicKey);
                    }
                } catch(err) {
                    reject(err);
                }
            }
        })
    });
}

router.get('/', function(req, res) {
    let saveToken;
    exchangeCodeForToken(req.query.code)
        .then(JWT => {
            saveToken = JWT;
            return getPublicKey();
        })
        .then(publicKey => {
            return verifyToken(saveToken.id_token, publicKey);
        })
        .then(decoded => {
            res.render('login', {title: 'My App that Integrates with Okta', decoded: JSON.stringify(decoded, null, 4), accessToken: saveToken.access_token});
        })
        .catch(err => {
            console.error(err);
            res.render('login', {title: err});
        })
});

module.exports = router;

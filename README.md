# Okta Sample App
ImageWare/Okta Integration.

This app will test the ImageWare/Okta integration. This assumes that you have already set up ImageWare IdP in Okta and create an application in Okta.

First you will need Node.js. We recomment installing Node Version Manager. Installation instructions are here.

Once you have Node and NPM set up. You need to add file names .env to the root of the cloned directory.

The .env file will have the following format:

```
OKTA_URL={URL to your Okta account}
OKTA_CLIENT_ID={The client ID created when you create app in Okta}
OKTA_CLIENT_SECRET={The client ID created when you create app in Okta}
OKTA_IDP_ID={The ImageWare IdP ID from Okta}
```
When you have this configured, run the following commands:

```
npm install
```

```
node index.js
```

Now you can navigate to localhost:9999 and test your integration!

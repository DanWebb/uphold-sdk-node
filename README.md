# uphold-sdk-node
[![Travis](https://travis-ci.org/DanWebb/uphold-sdk-node.svg)](https://travis-ci.org/DanWebb/uphold-sdk-node)
[![Codecov](https://img.shields.io/codecov/c/github/DanWebb/uphold-sdk-node.svg)](https://codecov.io/github/DanWebb/uphold-sdk-node)
[![Version](https://img.shields.io/npm/v/uphold-sdk-node.svg)](https://www.npmjs.com/package/uphold-sdk-node)

The Node.js Uphold SDK provides an easy way to get started using the [Uphold API](https://uphold.com/en/developer/api/documentation/) with Node.

## No longer maintained
This library is no longer maintained in favor of the [official Uphold SDK](https://github.com/uphold/uphold-sdk-javascript)

## Table of contents

* [Getting Started](#gettingStarted)
    * [Installation](#installation)
    * [Authentication](#authentication)
    * [Basic Usage](#basicUsage)
* [Methods](#methods)
    * [buildAuthURL(scope, state)](#buildAuthURL)
    * [createToken(code, callback)](#createToken)
    * [addToken(token)](#addToken)
    * [createPAT(username, password, description, otp, callback)](#createPAT)
    * [revokePAT(pat, callback)](#revokePAT)
    * [addPAT(pat)](#addPAT)
    * [tickers(callback)](#tickers)
    * [tickersForCurrency(currency, callback)](#tickersForCurrency)
    * [cards(callback)](#cards)
    * [card(id, callback)](#card)
    * [createCard(label, currency, callback)](#createCard)
    * [updateCard(label, settings, callback)](#updateCard)
    * [transactions(range, callback)](#transactions)
    * [userTransactions(range, callback)](#userTransactions)
    * [cardTransactions(card, range, callback)](#cardTransactions)
    * [transaction(id, callback)](#transaction)
    * [prepareTransaction(card, currency, amount, destination, callback)](#prepareTransaction)
    * [commitTransaction(card, transaction, message, callback)](#commitTransaction)
    * [createTransaction(options, callback)](#createTransaction)
    * [cancelTransaction(card, transaction, callback)](#cancelTransaction)
    * [resendTransaction(card, transaction, callback)](#resendTransaction)
    * [contacts(callback)](#contacts)
    * [contact(id, callback)](#contact)
    * [createContact(options, callback)](#createContact)
    * [user(callback)](#user)
    * [userPhones(callback)](#userPhones)
    * [reserveStatistics(callback)](#reserveStatistics)
    * [reserveLedger(range, callback)](#reserveLedger)
* [Contributing](#contributing)

<a name="gettingStarted"></a>
## Getting Started

To begin follow the [Uphold sandbox getting started guide](https://uphold.com/en/developer/sandbox) to get your test Uphold account and application set up.

In order to learn more about the Uphold API, make sure you also look over the [API documentation.](https://uphold.com/en/developer/api/documentation/)

<a name="installation"></a>
### Installation

Make sure you have node & npm installed then run:


```shell
npm install uphold-sdk-node
```

Once this has finished installing the SDK may be initialized with this line of javascript:

```js
var Uphold = require('uphold-sdk-node')(config);
```

The `config` object passed in here can contain any of the following properties:

<table>
    <thead>
        <tr>
            <td>Property</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>config.host</td>
            <td><code>string</code></td>
            <td>optional Uphold API domain, will default to "api.uphold.com"</td>
        </tr>
        <tr>
            <td>config.version</td>
            <td><code>string</code></td>
            <td>optional Uphold API version, example: "v1". Will default to latest stable</td>
        </tr>
        <tr>
            <td>config.key</td>
            <td><code>string</code></td>
            <td>application API key (Client ID)</td>
        </tr>
        <tr>
            <td>config.secret</td>
            <td><code>string</code></td>
            <td>application secret</td>
        </tr>
        <tr>
            <td>config.scope</td>
            <td><code>string</code></td>
            <td>comma separated list of permissions to request</td>
        </tr>
        <tr>
            <td>config.bearer</td>
            <td><code>string</code></td>
            <td>Uphold API token</td>
        </tr>
        <tr>
            <td>config.pat</td>
            <td><code>string</code></td>
            <td>Uphold API Personal Access Token, config.bearer will overwrite this.</td>
        </tr>
    </tbody>
</table>

<a name="authentication"></a>
### Authentication

The Uphold Node SDK supports the [Web Application Flow](https://uphold.com/en/developer/api/documentation/#web-application-flow) Oauth2 method of authentication which is the only recommended method of authentication for public facing web applications. For private scripts and tools [Personal Access Token (PAT)](https://uphold.com/en/developer/api/documentation/#personal-access-tokens-pat) authentication is also available.

#### Web Application Flow

To authenticate a user and retrieve a bearer token to access their account the user must first be redirected to the Uphold auth URL to accept the application permissions requested in `scope`. A bearer token can then be created using the code parameter provided by Uphold while redirecting the user back to your application. A simplified example of how you might do this with the Uphold Node SDK can be seen below:

```js
var Uphold = require('uphold-sdk-node')({
    "key": "<your applications api key>",
    "secret": "<your applications secret>",
    "scope": "accounts:read,cards:read,cards:write,contacts:read,contacts:write,transactions:deposit,transactions:read,transactions:transfer:application,transactions:transfer:others,transactions:transfer:self,transactions:withdraw,user:read"
});

var auth = Uphold.buildAuthURL();
// store the state to validate against
var storedState = auth.state;
// redirect the user to the Uphold auth url
res.redirect(auth.url);
```

Once Upholds redirected the user back to your applications redirect url:

```js
var Uphold = require('uphold-sdk-node')({
    "key": "<your applications api key>",
    "secret": "<your applications secret>"
});

// check the stored state equals the state returned
if(req.params.state!==storedState) return false;
// create the bearer token using the code param from the url
Uphold.createToken(req.params.code, function(err, token) {
    if(err) return customErrorHandler(err);
    // store the token for later use
    var storedBearer = token;
    // add the token to the current uphold-sdk-node configs bearer property and make authenticated calls
    Uphold.addToken(storedBearer.access_token).user(function(err, user) {
        if(err) return customErrorHandler(err);
        console.log(user);
    });
});
```

#### Personal Access Token (PAT)

Once created a PAT provides full access to your user account and bypasses Two Factor Authentication. An example of how to create and use a PAT with the Uphold Node SDK can be found below:

```js
var Uphold = require('uphold-sdk-node');

Uphold.createPAT('username', 'password', 'PAT description', false, function(err, res) {
    if(err) return customErrorHandler(err);
    // if two factor authentication is enabled on the account a One Time Password (OTP) will be required
    // once retrieved this method can be called again with the OTP like so
    // Uphold.createPAT('username', 'password', 'PAT description', 'OTP', function(err, res) {});
    if(res.otp) return getOTP();

    // add the PAT to the current uphold-sdk-node configs pat property and make authenticated calls
    Uphold.addPAT(res.accessToken).user(function(err, user) {
        if(err) return customErrorHandler(err);
        console.log(user);
    });
});
```

<a name="basicUsage"></a>
### Basic Usage

Once authenticated the Uphold bearer token can be passed into the config within the `config.bearer` property and API calls can be made using methods of the Uphold Node SDK as the example below. Alternatively a PAT can be passed into the config with the `config.pat` property:

```js
var Uphold = require('uphold-sdk-node')({
    "host": "api-sandbox.uphold.com",
    "bearer": "<bearer token>"
});

Uphold.user(function(err, user) {
    if(err) return customErrorHandler(err);
    console.log(user);
});
```

Note: by making the `config.host` property equal to "api-sandbox.uphold.com" we will be using the Uphold sandbox environment, simply omit `config.host` to use the live environment instead.

<a name="methods"></a>
## Methods

<a name="buildAuthURL"></a>
### buildAuthURL(scope, state)
Retrieve the auth URL where the user can give application permissions

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>scope</td>
            <td><code>string</code></td>
            <td>comma separated list of permissions to request, will default to <code>config.scope</code></td>
        </tr>
        <tr>
            <td>state</td>
            <td><code>string</code></td>
            <td>a secure random string, will be automatically provided if none is given</td>
        </tr>
    </tbody>
</table>

<a name="createToken"></a>
### createToken(code, callback)
Exchange a temporary code for a bearer token.

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>code</td>
            <td><code>string</code></td>
            <td>code param provided from the Uphold auth URL</td>
        </tr>
        <tr>
            <td>callback(err, token)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing access_token</td>
        </tr>
    </tbody>
</table>

<a name="addToken"></a>
### addToken(token)
Add or overwrite the configs bearer property.

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>token</td>
            <td><code>string</code></td>
            <td>a bearer token</td>
        </tr>
    </tbody>
</table>

Note: this method is chain-able.

<a name="createPAT"></a>
### createPAT(username, password, description, otp, callback)
Create a Personal Access Token.

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>username</td>
            <td><code>string</code></td>
            <td>account holders username</td>
        </tr>
        <tr>
            <td>password</td>
            <td><code>string</code></td>
            <td>account holders password</td>
        </tr>
        <tr>
            <td>description</td>
            <td><code>string</code></td>
            <td>a human-readable description of this PAT</td>
        </tr>
        <tr>
            <td>otp</td>
            <td><code>string</code></td>
            <td>One Time Password, applicable if two factor authentication is enabled on the account</td>
        </tr>
        <tr>
            <td>callback(err, token)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing accessToken</td>
        </tr>
    </tbody>
</table>

Note: this will respond with `{ otp: true }` if OTP is not provided but two factor authentication is enabled on the account.

<a name="revokePAT"></a>
### revokePAT(pat, callback)
Revoke a Personal Access Token

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>pat</td>
            <td><code>string</code></td>
            <td>the PAT to revoke</td>
        </tr>
        <tr>
            <td>callback(err, res)</td>
            <td><code>callback</code></td>
            <td></td>
        </tr>
    </tbody>
</table>

<a name="addPAT"></a>
### addPAT(pat)
Add or overwrite the configs pat property

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>pat</td>
            <td><code>string</code></td>
            <td>a Personal Access Token</td>
        </tr>
    </tbody>
</table>

Note: this method is chain-able.

<a name="tickers"></a>
### tickers(callback)
Get all tickers

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>callback(err, tickers)</td>
            <td><code>callback</code></td>
            <td>responds with an array containing the current rates Uphold has on record for all currency pairs</td>
        </tr>
    </tbody>
</table>

<a name="tickersForCurrency"></a>
### tickersForCurrency(currency, callback)
Get tickers for a currency

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>currency</td>
            <td><code>string</code></td>
            <td>currency to return rates for</td>
        </tr>
        <tr>
            <td>callback(err, tickers)</td>
            <td><code>callback</code></td>
            <td>responds with an array containing the current rates Uphold has on record for the currency specified</td>
        </tr>
    </tbody>
</table>

<a name="cards"></a>
### cards(callback)
Get all cards

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>callback(err, cards)</td>
            <td><code>callback</code></td>
            <td>responds with an array of the current user’s cards</td>
        </tr>
    </tbody>
</table>

<a name="card"></a>
### card(id, callback)
Get details of a single card

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>id</td>
            <td><code>string</code></td>
            <td>card ID or its bitcoin address</td>
        </tr>
        <tr>
            <td>callback(err, card)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the card</td>
        </tr>
    </tbody>
</table>

<a name="createCard"></a>
### createCard(label, currency, callback)
Create a card

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>label</td>
            <td><code>string</code></td>
            <td>display name of the card</td>
        </tr>
        <tr>
            <td>currency</td>
            <td><code>string</code></td>
            <td>the cards currency</td>
        </tr>
        <tr>
            <td>callback(err, card)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the card created</td>
        </tr>
    </tbody>
</table>

<a name="updateCard"></a>
### updateCard(label, settings, callback)
Update a card

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>label</td>
            <td><code>string</code></td>
            <td>display name of the card</td>
        </tr>
        <tr>
            <td>settings</td>
            <td><code>object</code></td>
            <td>an optional object with the card’s position and whether it is starred</td>
        </tr>
        <tr>
            <td>callback(err, card)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the updated card</td>
        </tr>
    </tbody>
</table>

<a name="transactions"></a>
### transactions(range, callback)
Requests the public view of all transactions

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>range</td>
            <td><code>string</code></td>
            <td>optional how many items to retrieve example: 0-5</td>
        </tr>
        <tr>
            <td>callback(err, transactions)</td>
            <td><code>callback</code></td>
            <td>responds with an array of transactions</td>
        </tr>
    </tbody>
</table>

<a name="userTransactions"></a>
### userTransactions(range, callback)
Requests a list of user transactions

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>range</td>
            <td><code>string</code></td>
            <td>optional how many items to retrieve example: 0-5</td>
        </tr>
        <tr>
            <td>callback(err, transactions)</td>
            <td><code>callback</code></td>
            <td>responds with an array of transactions</td>
        </tr>
    </tbody>
</table>

<a name="cardTransactions"></a>
### cardTransactions(card, range, callback)
Requests a list of transactions for a card

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>card</td>
            <td><code>string</code></td>
            <td>the id of the card to transfer value from</td>
        </tr>
        <tr>
            <td>range</td>
            <td><code>string</code></td>
            <td>optional how many items to retrieve example: 0-5</td>
        </tr>
        <tr>
            <td>callback(err, transactions)</td>
            <td><code>callback</code></td>
            <td>responds with an array of transactions</td>
        </tr>
    </tbody>
</table>

<a name="transaction"></a>
### transaction(id, callback)
Requests the public view of a single transaction

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>id</td>
            <td><code>string</code></td>
            <td>the id of the card to transfer value from</td>
        </tr>
        <tr>
            <td>callback(err, transaction)</td>
            <td><code>callback</code></td>
            <td>responds with a transaction object</td>
        </tr>
    </tbody>
</table>

<a name="prepareTransaction"></a>
### prepareTransaction(card, currency, amount, destination, callback)
Prepare a transaction

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>card</td>
            <td><code>string</code></td>
            <td>the id of the card to transfer value from</td>
        </tr>
        <tr>
            <td>currency</td>
            <td><code>string</code></td>
            <td>the currency to denominate the transaction by</td>
        </tr>
        <tr>
            <td>amount</td>
            <td><code>string</code></td>
            <td>the amount of value to send in the denominated currency</td>
        </tr>
        <tr>
            <td>destination</td>
            <td><code>string</code></td>
            <td>a card id, bitcoin address, email address or Uphold username</td>
        </tr>
        <tr>
            <td>callback(err, transaction)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the transaction</td>
        </tr>
    </tbody>
</table>

<a name="commitTransaction"></a>
### commitTransaction(card, transaction, message, callback)
Commit a transaction

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>card</td>
            <td><code>string</code></td>
            <td>the id of the card to transfer value from</td>
        </tr>
        <tr>
            <td>transaction</td>
            <td><code>string</code></td>
            <td>the id of the transaction that is going to be committed</td>
        </tr>
        <tr>
            <td>message</td>
            <td><code>string</code></td>
            <td>an optional custom message for the transaction</td>
        </tr>
        <tr>
            <td>callback(err, transaction)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the transaction</td>
        </tr>
    </tbody>
</table>

<a name="createTransaction"></a>
### createTransaction(options, callback)
Create & commit a transaction at once

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>options.card</td>
            <td><code>string</code></td>
            <td>the id of the card to transfer value from</td>
        </tr>
        <tr>
            <td>options.currency</td>
            <td><code>string</code></td>
            <td>the currency to denominate the transaction by</td>
        </tr>
        <tr>
            <td>options.amount</td>
            <td><code>string</code></td>
            <td>the amount of value to send in the denominated currency</td>
        </tr>
        <tr>
            <td>options.destination</td>
            <td><code>string</code></td>
            <td>a card id, bitcoin address, email address or Uphold username</td>
        </tr>
        <tr>
            <td>options.message</td>
            <td><code>string</code></td>
            <td>an optional custom message for the transaction</td>
        </tr>
        <tr>
            <td>callback(err, transaction)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the transaction</td>
        </tr>
    </tbody>
</table>

<a name="cancelTransaction"></a>
### cancelTransaction(card, transaction, callback)
Cancel a transaction that has not yet been redeemed

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>card</td>
            <td><code>string</code></td>
            <td>the id of the card the transaction was created for</td>
        </tr>
        <tr>
            <td>transaction</td>
            <td><code>string</code></td>
            <td>the id of the transaction that is going to be cancelled</td>
        </tr>
        <tr>
            <td>callback(err, transaction)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the transaction</td>
        </tr>
    </tbody>
</table>

<a name="resendTransaction"></a>
### resendTransaction(card, transaction, callback)
Triggers a reminder for a transaction that hasn’t been redeemed yet

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>card</td>
            <td><code>string</code></td>
            <td>the id of the card the transaction was created for</td>
        </tr>
        <tr>
            <td>transaction</td>
            <td><code>string</code></td>
            <td>the id of the transaction that is going to be resent</td>
        </tr>
        <tr>
            <td>callback(err, transaction)</td>
            <td><code>callback</code></td>
            <td>responds with an object containing details of the transaction</td>
        </tr>
    </tbody>
</table>

<a name="contacts"></a>
### contacts(callback)
Get all contacts

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>callback(err, contacts)</td>
            <td><code>callback</code></td>
            <td>responds with an array of contacts objects</td>
        </tr>
    </tbody>
</table>

<a name="contact"></a>
### contact(id, callback)
Get a single contact

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>id</td>
            <td><code>string</code></td>
            <td>the id of the contact to be retrieved</td>
        </tr>
        <tr>
            <td>callback(err, contact)</td>
            <td><code>callback</code></td>
            <td>responds with a contact object</td>
        </tr>
    </tbody>
</table>

<a name="createContact"></a>
### createContact(options, callback)
Create a contact

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>options.firstName</td>
            <td><code>string</code></td>
            <td>contact’s first name (max: 255 chars)</td>
        </tr>
        <tr>
            <td>options.lastName</td>
            <td><code>string</code></td>
            <td>contact’s last name (max: 255 chars)</td>
        </tr>
        <tr>
            <td>options.company</td>
            <td><code>string</code></td>
            <td>optional contact’s company name (max: 255 chars)</td>
        </tr>
        <tr>
            <td>options.emails</td>
            <td><code>array</code></td>
            <td>list of email addresses</td>
        </tr>
        <tr>
            <td>options.addresses</td>
            <td><code>array</code></td>
            <td>optional list of bitcoin addresses</td>
        </tr>
        <tr>
            <td>callback(err, contact)</td>
            <td><code>callback</code></td>
            <td>responds with a contact object</td>
        </tr>
    </tbody>
</table>

<a name="user"></a>
### user(callback)
Get the current user

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>callback(err, user)</td>
            <td><code>callback</code></td>
            <td>responds with a user object</td>
        </tr>
    </tbody>
</table>

<a name="userPhones"></a>
### userPhones(callback)
Get the current users phone numbers

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>callback(err, phones)</td>
            <td><code>callback</code></td>
            <td>responds with an array of phone number objects</td>
        </tr>
    </tbody>
</table>

<a name="reserveStatistics"></a>
### reserveStatistics(callback)
Get statistics from the Uphold reserve

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>callback(err, statistics)</td>
            <td><code>callback</code></td>
            <td>responds with an array of statistic objects</td>
        </tr>
    </tbody>
</table>

<a name="reserveLedger"></a>
### reserveLedger(range, callback)
Get entries for the Uphold reserve ledger

<table>
    <thead>
        <tr>
            <td>Param</td>
            <td>Type</td>
            <td>Description</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>range</td>
            <td><code>string</code></td>
            <td>optional how many items to retrieve example: 0-5</td>
        </tr>
        <tr>
            <td>callback(err, statistics)</td>
            <td><code>callback</code></td>
            <td>responds with an array of ledger entry objects</td>
        </tr>
    </tbody>
</table>

<a name="contributing"></a>
## Contributing

All submissions are welcome. To submit a change, fork this repo, make your changes, run the tests (`npm run test:single`), commit your changes (`npm run commit`), and send a pull request.

Alternatively if you've found a bug that doesn't already have an issue or just want to suggest something that hasn't already been suggested [submit an issue](https://github.com/DanWebb/uphold-sdk-node/issues/new)

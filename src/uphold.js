var request = require('request');

/**
 * Uphold node sdk - pass in a config object to initialise
 * @param {string} config.host - optional Uphold API domain, will default to "api.uphold.com"
 * @param {string} config.version - optional Uphold API version, will default to latest stable
 * @param {string} config.key - application API key (Client ID)
 * @param {string} config.secret - application secret
 * @param {string} config.bearer - Uphold API token
 */
module.exports = function(config) {

    config.host = config.host || 'api.uphold.com';
    config.version = config.version || 'v0';

    function responseHandler(err, res, body, callback) {
        var error = null;
        body = JSON.parse(body);

        if(body.errors || body.error || parseInt(res.statusCode)>=400) {
            message = body.errors || body.error || res.statusMessage;
            // morph Upholds error object into a string
            if(typeof message === 'object') {
                var tempMessage = '';
                Object.keys(message).forEach(function(prop) {
                    tempMessage += prop+': '+message[prop].map(function(val) { return val.message; }).join(', ');
                });
                message = res.statusMessage+' - '+tempMessage;
            }
            error = new Error(message);
            error.status = res.statusCode;
        }

        return callback(error, body);
    }

    function sendRequest(options, callback) {
        options.url = options.url || 'https://'+config.host+'/'+config.version+options.resource;
        options.method = options.method || 'GET';
        options.headers = options.headers || {};
        options.headers['content-type'] = 'application/x-www-form-urlencoded';
        if(config.bearer && !options.headers.Authorization) options.headers.Authorization = 'Bearer ' + config.bearer;

        request(options, function(err, res, body) {
            return responseHandler(err, res, body, callback);
        });
    }

    return {

        // AUTHENTICATION

        /**
         * Retrieve the auth URL where the user can give application permissions
         * @param {string} scope - comma separated list of permissions to request, will default to config.scope
         * @param {string} state - a secure random string, will be automatically provided if none is given
         * @returns {Object}
         */
        buildAuthURL: function(scope, state) {
            var host = 'uphold.com';
            scope = scope || config.scope;
            state = state || require('crypto').randomBytes(48).toString('hex');

            if(config.host==='api-sandbox.uphold.com') host = 'sandbox.uphold.com';

            return {
                'url': 'https://'+host+'/authorize/'+config.key+'?state='+state+'&scope='+scope,
                'state': state,
                'scope': scope
            };
        },

        /**
         * Exchange a temporary code for a bearer token.
         * @param {string} code - code provided from the Uphold auth URL
         * @param callback - responds with an object containing access_token & expires_in
         */
        createToken: function(code, callback) {
            return sendRequest({
                url: 'https://'+config.host+'/oauth2/token',
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + new Buffer(config.key+':'+config.secret).toString('base64')
                },
                form: {
                    'code': code,
                    'grant_type': 'authorization_code'
                }
            }, callback);
        },

        /**
         * Add or overwrite the configs bearer property
         * @param {string} token - a bearer token
         */
        addToken: function(token) {
            config.bearer = token;
        },

        // TICKERS

        /**
         * Get all tickers
         * @param callback - responds with an array containing the current rates Uphold has on record for all currency pairs
         */
        tickers: function(callback) {
            return sendRequest({ resource: '/ticker' }, callback);
        },

        /**
         * Get tickers for a currency
         * @param {string} currency - currency to return rates for
         * @param callback - responds with an array containing the current rates Uphold has on record for the currency specified
         */
        tickersForCurrency: function(currency, callback) {
            return sendRequest({ resource: '/ticker/'+currency }, callback);
        },

        // CARDS

        /**
         * Get all cards
         * @param callback - responds with an array of the current user’s cards
         */
        cards: function(callback) {
            return sendRequest({ resource: '/me/cards' }, callback);
        },

        /**
         * Get details of a single card
         * @param {string} id - card ID or its bitcoin address
         * @param callback - responds with an object containing details of the card
         */
        card: function(id, callback) {
            return sendRequest({ resource: '/me/cards/'+id }, callback);
        },

        /**
         * Create a card
         * @param {string} label - display name of the card
         * @param {string} currency - the cards currency
         * @param callback - responds with an object containing details of the card created
         */
        createCard: function(label, currency, callback) {
            return sendRequest({
                resource: '/me/cards',
                method: 'POST',
                form: {
                    'label': label,
                    'currency': currency
                }
            }, callback);
        },

        /**
         * Update a card
         * @param {string} label - display name of the card
         * @param {object} settings - an optional object with the card’s position and whether it is starred
         * @param callback - responds with an object containing details of the updated card
         */
        updateCard: function(id, label, settings, callback) {
            return sendRequest({
                resource: '/me/cards/'+id,
                method: 'PATCH',
                form: {
                    'label': label,
                    'settings': settings
                }
            }, callback);
        },

        // TRANSACTIONS

        /**
         * Requests the public view of all transactions
         * @param {string} range - optional how many items to retrieve example: 0-5
         * @param callback - responds with an array of transactions
         */
        transactions: function(range, callback) {
            var headers = {};

            if(range) headers.Range = 'items='+range;

            return sendRequest({
                resource: '/reserve/transactions',
                headers: headers
            }, callback);
        },

        /**
         * Requests a list of user transactions
         * @param {string} range - optional how many items to retrieve example: 0-5
         * @param callback - responds with an array of transactions
         */
        userTransactions: function(range, callback) {
            var headers = {};

            if(range) headers.Range = 'items='+range;

            return sendRequest({
                resource: '/me/transactions',
                headers: headers
            }, callback);
        },

        /**
         * Requests a list of transactions for a card
         * @param {string} card - the id of the card to transfer value from
         * @param {string} range - optional how many items to retrieve example: 0-5
         * @param callback - responds with an array of transactions
         */
        cardTransactions: function(card, range, callback) {
            var headers = {};

            if(range) headers.Range = 'items='+range;

            return sendRequest({
                resource: '/me/cards/'+card+'/transactions',
                headers: headers
            }, callback);
        },

        /**
         * Requests the public view of a single transaction
         * @param {string} id - the id of the transaction to be retrieved
         * @param callback - responds with a transaction object
         */
        transaction: function(id, callback) {
            return sendRequest({ resource: '/reserve/transactions/'+id }, callback);
        },

        /**
         * Create a transaction
         * @param {string} card - the id of the card to transfer value from
         * @param {string} currency - the currency to denominate the transaction by
         * @param {string} amount - the amount of value to send in the denominated currency
         * @param {string} destination - a card id, bitcoin address, email address or Uphold username
         * @param callback - responds with an object containing details of the transaction
         */
        createTransaction: function(card, currency, amount, destination, callback) {
            return sendRequest({
                resource: '/me/cards/'+card+'/transactions',
                method: 'POST',
                form: {
                    'denomination': {
                        'currency': currency,
                        'amount': amount
                    },
                    'destination': destination
                }
            }, callback);
        },

        /**
         * Commit a transaction
         * @param {string} card - the id of the card the transaction was created for
         * @param {string} transaction - the id of the transaction that is going to be committed
         * @param {string} message - an optional custom message for the transaction
         * @param callback - responds with an object containing details of the transaction
         */
        commitTransaction: function(card, transaction, message, callback) {
            var form = {};

            if(message) form = { 'message': message };

            return sendRequest({
                resource: '/me/cards/'+card+'/transactions/'+transaction+'/commit',
                method: 'POST',
                form: form
            }, callback);
        },

        /**
         * Convenience method for creating & committing a transaction at once
         * @param {string} options.card - the id of the card to transfer value from
         * @param {string} options.currency - the currency to denominate the transaction by
         * @param {string} options.amount - the amount of value to send in the denominated currency
         * @param {string} options.destination - a card id, bitcoin address, email address or Uphold username
         * @param {string} options.message - an optional custom message for the transaction
         * @param callback - responds with an object containing details of the transaction
         */
        createAndCommitTransaction: function(options, callback) {
            var self = this;

            self.createTransaction(options.card, options.currency, options.amount, options.destination, function(err, transaction) {
                if(err) return callback(err, null);

                self.commitTransaction(options.card, transaction.id, options.message, callback);
            });
        },

        /**
         * Cancel a transaction that has not yet been redeemed
         * @param {string} card - the id of the card the transaction was created for
         * @param {string} transaction - the id of the transaction that is going to be cancelled
         * @param callback - responds with an object containing details of the transaction
         */
        cancelTransaction: function(card, transaction, callback) {
            return sendRequest({
                resource: '/me/cards/'+card+'/transactions/'+transaction+'/cancel',
                method: 'POST'
            }, callback);
        },

        /**
         * Triggers a reminder for a transaction that hasn’t been redeemed yet
         * @param {string} card - the id of the card the transaction was created for
         * @param {string} transaction - the id of the transaction that is going to be resent
         * @param callback - responds with an object containing details of the transaction
         */
        resendTransaction: function(card, transaction, callback) {
            return sendRequest({
                resource: '/me/cards/'+card+'/transactions/'+transaction+'/resend',
                method: 'POST'
            }, callback);
        },

        // CONTACTS

        /**
         * Get all contacts
         * @param callback - responds with an array of contacts objects
         */
        contacts: function(callback) {
            return sendRequest({ resource: '/me/contacts' }, callback);
        },

        /**
         * Get a single contact
         * @param {string} id - the id of the contact to be retrieved
         * @param callback - responds with a contact object
         */
        contact: function(id, callback) {
            return sendRequest({ resource: '/me/contacts/'+id }, callback);
        },

        /**
         * Create a contact
         * @param {string} options.firstName - contact’s first name (max: 255 chars)
         * @param {string} options.lastName - contact’s last name (max: 255 chars)
         * @param {string} options.company - optional contact’s company name (max: 255 chars)
         * @param {array} options.emails - list of email addresses
         * @param {array} options.addresses - optional list of bitcoin addresses
         * @param callback - responds with a contact object
         */
        createContact: function(options, callback) {
            return sendRequest({
                resource: '/me/contacts',
                method: 'POST',
                form: options
            }, callback);
        },

        // USERS

        /**
         * Get the current user
         * @param callback - responds with a user object
         */
        user: function(callback) {
            return sendRequest({ resource: '/me' }, callback);
        },

        /**
         * Get the current users phone numbers
         * @param callback - responds with an array of phone number objects
         */
        userPhones: function(callback) {
            return sendRequest({ resource: '/me/phones' }, callback);
        },

        // TRANSPARENCY

        /**
         * Get statistics from the Uphold reserve
         * @param callback - responds with an array of statistic objects
         */
        reserveStatistics: function(callback) {
            return sendRequest({ resource: '/reserve/statistics' }, callback);
        },

        /**
         * Get entries for the Uphold reserve ledger
         * @param {string} range - optional how many items to retrieve, example: 0-5
         * @param callback - responds with an array of ledger entry objects
         */
        reserveLedger: function(range, callback) {
            var headers = {};

            if(range) headers.Range = 'items='+range;

            return sendRequest({
                resource: '/reserve/ledger',
                headers: headers
            }, callback);
        },

    };

};

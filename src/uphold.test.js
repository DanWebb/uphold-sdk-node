var config = {
    "uphold": {
        "host": "api-sandbox.uphold.com",
        "key": "9a8368e09726435cb2e00401b6bb045ded5318a8",
        "secret": "f5cd1ff19edd62c680efec1e456efa406ebb925f",
        "scope": "cards:read,cards:write,contacts:read,contacts:write,transactions:read,transactions:write,user:read",
        "bearer": "bea93d3c41718d86cb7aee225a78fec99a77f487"
    },
    "cards": {
        "newCard": {
            "label": "Test Card",
            "currency": "GBP",
            "settings": {
                "position": "5"
            }
        },
        "moneyCard": {
            "id": "bf07a5a7-ccd9-434d-8a19-497ef65f924e"
        }
    },
    "contact": {
        "id": "2928aa7b-6bef-43ad-8a79-cfe6a8009cf6",
        "firstName": "Dan",
        "lastName": "Webb"
    }
};

var expect = require('chai').expect;
var Uphold = require('./uphold')(config.uphold);

describe('Uphold', function() {
    this.timeout(10000);

    function isError(err) {
        expect(err).to.not.equal(null);
        expect(err.message).to.be.a('string');
        expect(err.status).to.exist;
    }

    // create a new card to test with
    before(function(done) {
        Uphold.createCard(config.cards.newCard.label, config.cards.newCard.currency, function(err, card) {
            config.cards.newCard.id = card.id;
            done();
        });
    });

    // AUTHENTICATION

    describe('buildAuthURL', function() {
        it('Should return an object containing an Uphold auth url, state and scope', function() {
            var res = Uphold.buildAuthURL('cards:read,cards:write', 'abc123');
            expect(res).to.be.a('object');
            expect(res).to.have.all.keys('url', 'state', 'scope');
            expect(res.url).to.be.a('string');
            expect(res.url).to.contain('state').and.to.contain('scope').and.to.contain(config.uphold.key);
            expect(res.state).to.be.a('string');
            expect(res.scope).to.be.a('string');
        });

        it('Should automatically provide the scope from config & generate a random state if none is provided', function() {
            var res = Uphold.buildAuthURL();
            expect(res.state).to.be.a('string');
            expect(res.scope).to.be.a('string');
            expect(res.scope).to.equal(config.uphold.scope);
            var res2 = Uphold.buildAuthURL();
            expect(res2.state).to.not.equal(res.state);
        });
    });

    describe('createToken', function() {
        // visit this url to generate a new code and test this method
        // https://sandbox.uphold.com/authorize/9a8368e09726435cb2e00401b6bb045ded5318a8?state=be248437557d577f2deb97457036d7fbf4e346e663ca1c6bd4878af382f38346954051e600662a5e4406b161a2cd9805&scope=cards:read,cards:write,contacts:read,contacts:write,transactions:read,transactions:write,user:read
        // it('Should respond with an access token if the code provided is valid', function(done) {
        //     Uphold.createToken('01278c9221d06d4fe51fa38ce010179034e7b5a8', function(err, res) {
        //         expect(err).to.equal(null);
        //         expect(res).to.be.a('object');
        //         expect(res.access_token).to.be.a('string');
        //         done();
        //     });
        // });

        it('Should error if no code is provided', function(done) {
            Uphold.createToken('', function(err, res) {
                isError(err);
                done();
            });
        });

        it('Should error if an invalid code is provided', function(done) {
            Uphold.createToken('abc123', function(err, res) {
                isError(err);
                done();
            });
        });
    });

    // TICKERS

    function isTicker(ticker) {
        expect(ticker).to.be.a('object');
        expect(ticker).to.have.all.keys('ask', 'bid', 'currency', 'pair');
    }

    describe('tickers', function() {
        it('Should return an array containing the current rates Uphold has on record for all currency pairs', function(done) {
            Uphold.tickers(function(err, tickers) {
                expect(err).to.equal(null);
                expect(tickers).to.be.an('array');
                tickers.forEach(isTicker);
                done();
            });
        });
    });

    describe('tickersForCurrency', function() {
        it('Should return an array containing the current rates Uphold has on record for a single currency', function(done) {
            Uphold.tickersForCurrency('GBP', function(err, tickers) {
                expect(err).to.equal(null);
                expect(tickers).to.be.an('array');
                tickers.forEach(isTicker);
                done();
            });
        });
    });

    // CARDS

    function isCard(card) {
        expect(card).to.be.a('object');
        expect(card).to.have.any.keys('id', 'address', 'label', 'currency', 'balance', 'available');
    }

    describe('cards', function() {
        it('Should return an array of the current user’s cards', function(done) {
            Uphold.cards(function(err, cards) {
                expect(err).to.equal(null);
                expect(cards).to.be.an('array');
                cards.forEach(isCard);
                done();
            });
        });
    });

    describe('card', function() {
        it('Should return the details of a single card', function(done) {
            Uphold.card(config.cards.newCard.id, function(err, card) {
                expect(err).to.equal(null);
                isCard(card);
                expect(card.id).to.equal(config.cards.newCard.id);
                expect(card.label).to.equal(config.cards.newCard.label);
                expect(card.currency).to.equal(config.cards.newCard.currency);
                done();
            });
        });

        it('Should error if an incorrect card id is used', function(done) {
            Uphold.card('abc123', function(err, card) {
                isError(err);
                done();
            });
        });
    });

    describe('createCard', function() {
        it('Should create a card and return the newly created cards details', function(done) {
            Uphold.createCard(config.cards.newCard.label, config.cards.newCard.currency, function(err, card) {
                expect(err).to.equal(null);
                isCard(card);
                expect(card.label).to.equal(config.cards.newCard.label);
                expect(card.currency).to.equal(config.cards.newCard.currency);
                done();
            });
        });

        it('Should error if no currency is passed', function(done) {
            Uphold.createCard(config.cards.newCard.label, '', function(err, card) {
                isError(err);
                done();
            });
        });
    });

    describe('updateCard', function() {
        it('Should update the "config.cards.newCard" and return it with it\s newly updated details', function(done) {
            Uphold.updateCard(config.cards.newCard.id, 'Test label update', config.cards.newCard.settings, function(err, card) {
                expect(err).to.equal(null);
                isCard(card);
                expect(card.id).to.equal(config.cards.newCard.id);
                expect(card.label).to.equal('Test label update');
                config.cards.newCard.label = card.label;
                expect(card.currency).to.equal(config.cards.newCard.currency);
                expect(card.settings.position).to.equal(config.cards.newCard.settings.position);
                done();
            });
        });

        it('Should error if an incorrect card id is used', function(done) {
            Uphold.updateCard('abc123', 'Test label', config.cards.newCard.settings, function(err, card) {
                isError(err);
                done();
            });
        });

        it('Should error if the new label is more than 140 characters', function(done) {
            Uphold.updateCard(config.cards.newCard.id, 'I am 150 characters long I am 150 characters long I am 150 characters long I am 150 characters long I am 150 characters long I am 150 characters long ', config.cards.newCard.settings, function(err, card) {
                isError(err);
                done();
            });
        });
    });

    // TRANSACTIONS
    // note: only transactions with a waiting status can be cancelled or resent so tests for these aren't present

    function isTransaction(transaction) {
        expect(transaction).to.be.a('object');
        expect(transaction).to.have.any.keys('id', 'params', 'status', 'type', 'origin', 'destination');
    }

    describe('transactions', function() {
        it('Should return an array of transactions', function(done) {
            Uphold.transactions('', function(err, transactions) {
                expect(err).to.equal(null);
                isTransaction(transactions[0]);
                done();
            });
        });

        it('Should return the number of transactions designated in "range"', function(done) {
            Uphold.transactions('0-3', function(err, transactions) {
                expect(err).to.equal(null);
                expect(transactions.length).to.equal(4);
                transactions.forEach(isTransaction);
                done();
            });
        });
    });

    describe('userTransactions', function() {
        it('Should return an array of the users transactions', function(done) {
            Uphold.userTransactions('', function(err, transactions) {
                expect(err).to.equal(null);
                isTransaction(transactions[0]);
                done();
            });
        });

        it('Should return the number of transactions designated in "range"', function(done) {
            Uphold.userTransactions('0-3', function(err, transactions) {
                expect(err).to.equal(null);
                expect(transactions.length).to.equal(4);
                transactions.forEach(isTransaction);
                done();
            });
        });
    });

    describe('cardTransactions', function() {
        it('Should return an array of the users transactions', function(done) {
            Uphold.cardTransactions(config.cards.moneyCard.id, '', function(err, transactions) {
                expect(err).to.equal(null);
                isTransaction(transactions[0]);
                done();
            });
        });

        it('Should return the number of transactions designated in "range"', function(done) {
            Uphold.cardTransactions(config.cards.moneyCard.id, '0-3', function(err, transactions) {
                expect(err).to.equal(null);
                expect(transactions.length).to.equal(4);
                transactions.forEach(isTransaction);
                done();
            });
        });
    });

    describe('prepareTransaction', function() {
        it('Should create a transaction without committing it then return it', function(done) {
            Uphold.prepareTransaction(config.cards.moneyCard.id, 'GBP', '0.01', config.cards.newCard.id, function(err, transaction) {
                expect(err).to.equal(null);
                isTransaction(transaction);
                expect(transaction.origin.CardId).to.equal(config.cards.moneyCard.id);
                expect(transaction.destination.amount).to.equal('0.01');
                expect(transaction.destination.currency).to.equal('GBP');
                expect(transaction.destination.CardId).to.equal(config.cards.newCard.id);
                done();
            });
        });
    });

    describe('commitTransaction', function() {
        it('Should commit the transaction and return it with a status of "completed" & the message provided', function(done) {
            Uphold.prepareTransaction(config.cards.moneyCard.id, 'GBP', '0.01', config.cards.newCard.id, function(err, transaction) {
                expect(err).to.equal(null);
                Uphold.commitTransaction(config.cards.moneyCard.id, transaction.id, 'Test transaction', function(err, transaction) {
                    expect(err).to.equal(null);
                    isTransaction(transaction);
                    expect(transaction.status).to.equal('completed');
                    expect(transaction.message).to.equal('Test transaction');
                    done();
                });
            });
        });
    });

    describe('createTransaction', function() {
        it('Should return with a completed transaction object', function(done) {
            Uphold.createTransaction({
                card: config.cards.moneyCard.id,
                currency: 'GBP',
                amount: '0.01',
                destination: config.cards.newCard.id,
                message: ''
            }, function(err, transaction) {
                expect(err).to.equal(null);
                isTransaction(transaction);
                expect(transaction.status).to.equal('completed');
                done();
            });
        });
    });

    // CONTACTS

    describe('contacts', function() {
        it('Should return an array of contacts', function(done) {
            Uphold.contacts(function(err, contacts) {
                expect(err).to.equal(null);
                expect(contacts[0]).to.be.a('object');
                expect(contacts[0]).to.have.any.keys('id', 'firstName', 'lastName', 'emails');
                done();
            });
        });
    });

    describe('contact', function() {
        it('Should return details of the contact specified', function(done) {
            Uphold.contact(config.contact.id, function(err, contact) {
                expect(err).to.equal(null);
                expect(contact).to.be.a('object');
                expect(contact.id).to.equal(config.contact.id);
                expect(contact.firstName).to.equal(config.contact.firstName);
                expect(contact.lastName).to.equal(config.contact.lastName);
                done();
            });
        });
    });

    describe('createContact', function() {
        it('Should create a contact and return it', function(done) {
            Uphold.createContact({
                firstName: 'Test',
                lastName: 'Contact',
                emails: ['support@larsmoisturefarm.com'],
            }, function(err, contact) {
                expect(err).to.equal(null);
                expect(contact).to.be.a('object');
                expect(contact.firstName).to.equal('Test');
                expect(contact.lastName).to.equal('Contact');
                expect(contact.emails[0]).to.equal('support@larsmoisturefarm.com');
                done();
            });
        });

        it('Should error if firstName lastName or company is more than 255 characters', function(done) {
            Uphold.createContact({
                firstName: 'vPY3fAX867ncC2xpEWuZAYPIVHvulsGfurwA7T8m6ZwDmz9vZQrD2BVsf0e9wQGPDogiK69p4UZreZLEp7gZ22qnihhGPEuTSWSAB5gOEwic6GDaSNjlObhGA5khstw90c2KN69JEFDy0WbHGcx96BGJqfQ7a7sLfv4WEGA4iAa3YwDgUSo8j7VCXW8FavfmJw7GRnC67AqiAKszABJIBa4Y0N3vWa6eT8GNkABNHbuiI6wTXUJVMDLCNQXh2bxiDQvl',
                lastName: 'CvPY3fAX867ncC2xpEWuZAYPIVHvulsGfurwA7T8m6ZwDmz9vZQrD2BVsf0e9wQGPDogiK69p4UZreZLEp7gZ22qnihhGPEuTSWSAB5gOEwic6GDaSNjlObhGA5khstw90c2KN69JEFDy0WbHGcx96BGJqfQ7a7sLfv4WEGA4iAa3YwDgUSo8j7VCXW8FavfmJw7GRnC67AqiAKszABJIBa4Y0N3vWa6eT8GNkABNHbuiI6wTXUJVMDLCNQXh2bxiDQvl',
                company: 'tvPY3fAX867ncC2xpEWuZAYPIVHvulsGfurwA7T8m6ZwDmz9vZQrD2BVsf0e9wQGPDogiK69p4UZreZLEp7gZ22qnihhGPEuTSWSAB5gOEwic6GDaSNjlObhGA5khstw90c2KN69JEFDy0WbHGcx96BGJqfQ7a7sLfv4WEGA4iAa3YwDgUSo8j7VCXW8FavfmJw7GRnC67AqiAKszABJIBa4Y0N3vWa6eT8GNkABNHbuiI6wTXUJVMDLCNQXh2bxiDQvl',
            }, function(err, contact) {
                isError(err);
                done();
            });
        });
    });

    // USERS

    describe('user', function() {
        it('Should return details of the current user', function(done) {
            Uphold.user(function(err, user) {
                expect(err).to.equal(null);
                expect(user).to.be.a('object');
                expect(user.firstName).to.equal('Dan');
                expect(user.lastName).to.equal('Webb');
                expect(user.username).to.equal('danwebb');
                expect(user).to.have.any.keys('cards', 'settings', 'phones', 'currencies');
                done();
            });
        });
    });

    // TRANSPARENCY

    describe('reserveStatistics', function() {
        it('Should return an array of objects containing stats from the Uphold reserve', function(done) {
            Uphold.reserveStatistics(function(err, stats) {
                expect(err).to.equal(null);
                expect(stats[0]).to.be.a('object');
                done();
            });
        });
    });

    describe('reserveLedger', function() {
        it('Should return an array of reserve ledger entries based on the range passed', function(done) {
            Uphold.reserveLedger('0-3', function(err, entries) {
                expect(err).to.equal(null);
                expect(entries.length).to.equal(4);
                expect(entries[0]).to.be.a('object');
                done();
            });
        });
    });

});

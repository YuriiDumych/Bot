const chai = require('chai')
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('chai-as-promised'))

const DB = require('./app/mongodb');
const BestBuy = require('./app/bestbuy');

const bby = new BestBuy();
const database = new DB();

require('dotenv').config()

const logger = require('./utils/logger');

const mongoose = require('mongoose');
const User = require('./app/models/user');
const Cron = require('./app/models/cron');
const Favorite = require('./app/models/favorite');
const Rating = require('./app/models/rating');
const Purchase = require('./app/models/purchase');

describe('bestbuy', () => {
    describe('getCatalog', () => {
        it('should return object', () => {
            bby.getCatalog(1)
                .then(data => {
                    assert.isObject(data)
                })
        })
        it('should be called once', () => {
            sinon.spy(bby, 'getCatalog');
            bby.getCatalog(1);
            assert(bby.getCatalog.calledOnce)
        })
        it('should return error', () => {
            const promise = bby.getCatalog('foo');
            assert.isRejected(promise);
        })
        it('should be fulfilled', () => {
            const promise = bby.getCatalog(1);
            assert.isFulfilled(promise)
        })
        it('should have property "categories"', () => {
            bby.getCatalog()
                .then(res => assert.property(res, 'categories'))
        })

    })
    describe('getProductsFromCatalog', () => {
        it('should have property "products"', () => {
            bby.getProductsFromCatalog('abcat0101000', 1)
                .then(res => assert.property(res, 'products'))
        })  
        it('should return array of products', () => {
            bby.getProductsFromCatalog('abcat0101000', 1)
                .then(data => assert(Array.isArray(data.products)))
        })
        it('should return empty array', () => {
            bby.getProductsFromCatalog('foo', 1)
                .then(data => assert.equal(data.products.length, 0))
        })
        it('should be called once', () => {
            sinon.spy(bby, 'getProductsFromCatalog')
            bby.getProductsFromCatalog()
            assert(bby.getProductsFromCatalog.calledOnce)
        })
        it('should be fulfilled', () => {
            const promise = bby.getProductsFromCatalog('abcat0101000', 1)
            assert.isFulfilled(promise)
        });

    })
    describe('getProductDetales', () => {
        it('should return object', () => {
            bby.getProductDetales(4617200)
                .then(data => {
                    assert.isObject(data)
                })
        })
        it('should be called once', () => {
            sinon.spy(bby, 'getProductDetales')
            bby.getProductDetales(4617200)
            assert(bby.getProductDetales.calledOnce)
        })
        it('should be fulfilled', () => {
            const promise = bby.getProductDetales(4617200)
            assert.isFulfilled(promise)
        })
        it('should return error', () => {
            const promise = bby.getProductDetales(1234567890);
            assert.isRejected(promise);
        })
    })
})

describe('database', () => {
    before(done => {
        mongoose.connect(process.env.MONGO_DB_URI, {
            useNewUrlParser: true
        });
        const db = mongoose.connection;
        db.on('error', error => logger.error(error.name));
        db.once('open', () => {
            logger.info('connected to mongoDB');
            db.db.dropDatabase((err, res) => {
                done()
            })
        });
    })

    describe('users', () => {
        it('should add new user', () => {
            database.saveNewUser('12345')
                .then(obj => assert.exists(obj))
                .catch(err => assert.notExists(err))
        });
        it('should return error', () => {
            database.areYouReferralFirstTime('foo')
                .then(obj => assert.notExists(obj))
                .catch(err => assert.exists(err))
        });
        it('should return user', () => {
            database.areYouReferralFirstTime('12345')
                .then(obj => assert.exists(obj))
                .catch(err => assert.notExists(err))
        });
        it('should return empty array of referrals', () => {
            database.getReferrals('12345')
                .then(res => assert.isEmpty(res.referrals))
                .catch(err => assert.notExists(err))
        });
        it('should push new referral id to user', () => {
            database.pushToReferrals('54321','12345')
                .then(res => assert.exists(res))
                .catch(err => assert.notExists(err))
        });
    })
    describe('favorite', () => {
        it('should add new favorite', () =>{
            database.addNewFavorite('12345', '123&name&image', new Date())
                .then(res => assert.exists(res))
                .catch(err => assert.notExists(err))
        })
        it('should return favorite by user id and sku', () => {
            database.checkFavorite('12345', '123&name&image')
                .then(res => assert.propertyVal(res, 'sku', 123))
                .catch(err => assert.notExists(err))
        })
        it("should return array of user's favorites", () => {
            database.getFavorites('12345')
                .then(res => assert.propertyVal(res[0], 'sku', 123))
                .catch(err => assert.notExists(err))
        })
        it('should delete favorite', () => {
            database.deleteFavotire('12345', 123)
                .then(res => assert.propertyVal(res, 'sku', 123))
                .catch(err => assert.notExists(err))
        })
    })
    describe('purchase', () => {
        it('should save purchase', () => {
            const product = {
                sku: 123,
                phone: '+380936507444',
                userId: '12345',
                timestap: new Date(),
                coordinates: {
                    lat: 10,
                    long: 20
                }
            }
            database.savePurchase(product)
                .then(res => assert.propertyVal(res, 'sku', product.sku))
                .catch(err => assert.notExists(err))        
        })
        it('should return purchase by user id', () => {
            database.getPurchases('12345', 0)
                .then(res => {
                    assert.propertyVal(res[0], 'sku', 123)
                    assert.propertyVal(res[0], 'userId', '12345')
                })
                .catch(err => assert.notExists(err))        
        })
    })
    describe('cron', () => {
        it('should add new cron', () => {
            database.addCron('12345', new Date().getTime())
                .then(res => assert.propertyVal(res, 'userId', '12345'))
                .catch(err => assert.notExists(err))        
        })
        it('should return all crons', () => {
            database.getCrons()
                .then(res => assert.propertyVal(res[0], 'userId', '12345'))
                .catch(err => assert.notExists(err))        
        })
        it('should delete cron', () => {
            database.deleteCron('12345')
            .then(res => assert.propertyVal(res, 'userId', '12345'))
            .catch(err => assert.notExists(err))        
        })
    })
    describe('rating', () => {
        it('should add rating', () => {
            database.addRate('12345', 1)
                .then(res => {
                    assert.propertyVal(res, 'userId', '12345')
                    assert.propertyVal(res, 'rate', 1)
                })
                .catch(err => assert.notExists(err))        
        })
        it('should return user rating', () => {
            database.checkRate('12345')
                .then(res => {
                    assert.propertyVal(res, 'userId', '12345')
                    assert.propertyVal(res, 'rate', 1)
                })
                .catch(err => assert.notExists(err))        
        })
        it('should not return user rating', () => {
            database.checkRate('54321')
                .then(res => assert.notExists(res))
        })
        it("should update user's rating", () => {
            database.updateRate('12345', 5)
                .then(res => assert.propertyVal(res, 'nModified', 1))
                .catch(err => assert.notExists(err))
        })
    })

    after(done => {
            mongoose.disconnect()
            done()
    })
})
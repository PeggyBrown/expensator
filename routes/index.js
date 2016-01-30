var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Expensator' });
});


/* GET New Expense page. */
router.get('/addexpense', function(req, res) {

    var db = req.db;
    var collection = db.get('categories');

    collection.find({},{_id:0, "name":1},function(e,docs) {
        res.render('addexpense', {
            title: 'Add New Entry',
            "categories" : docs
        });
    });
});

/* GET Expenselist page. */
router.get('/expenses', function(req, res) {
    var db = req.db;
    var collection = db.get('expensecollection');

    collection.find({},{},function(e,docs){

    var _ = require("underscore");
    
    function sum(numbers) {
        return _.reduce(numbers, function(result, current) {
            return result + parseFloat(current);
        }, 0);
    }
    var result = _.chain(docs)
        .groupBy("category")
        .map(function(value, key) {
            return {
                name: key,
                sum: sum(_.pluck(value, "price"))
            }
        })
        .value();

        res.render('expenses', {
            "expenses" : docs,
            "categories" : result
        });
    });
});

/* GET Expenses by caterogies page. */
router.get('/categories', function(req, res) {
    var db = req.db;
    var collection = db.get('expensecollection');

    collection.col.aggregate(
        [
            { "$group": { 
            "_id": "$category", 
            "sum": { $sum: "$price" } 
            }}
        ],
        function(e,docs) {
            res.render('categories', {
                "categories" : docs
            });
        }
    );
});

/* GET Expense details page. */
router.get('/expense/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('expensecollection');

    collection.findOne({ '_id': req.params.id },function(e,docs){
        res.render('expense', {
            'expense' : docs
        });
    })
});

/* GET Expense edit page. */
router.get('/expense/edit/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('expensecollection');
    var categories = db.get('categories');

    collection.findOne({ '_id': req.params.id },function(e,docs){
        categories.find({},{_id:0, "name":1},function(e2,cats) {
            res.render('editexpense', {
                'expense' : docs,
                "categories" : cats
            });
        });
    })
});

/* GET Expense remove page. */
router.get('/expense/remove/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('expensecollection');
    var events = db.get('events');

    collection.remove({ '_id': req.params.id }, function (err) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem removing expense.");
            events.insert({
                "type" : "CannotRemoveExpense",
                "message": err,
                "date": new Date()
            });
        }
        else {
            // And forward to success page
            res.redirect("/expenses");
            events.insert({
                "type" : "ExpenseRemoved",
                "message": "Removed expense with ID " + req.params.id,
                "date": new Date()
            });
        }
    });

});

/* POST to Add Expense Service */
router.post('/addexpense', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var expenseName = req.body.expensename;
    var expensePrice = parseInt(req.body.expenseprice);
    var expenseCategory = req.body.expensecategory;
    var expenseDate = req.body.expensedate;

    // Set our collection
    var collection = db.get('expensecollection');
    var events = db.get('events');

    // Submit to the DB
    collection.insert({
        "name" : expenseName,
        "price" : expensePrice,
        "category" : expenseCategory,
        "date" : expenseDate
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
            events.insert({
                "type" : "CannotAddExpense",
                "message": err,
                "date": new Date()
            });
        }
        else {
            // And forward to success page
            res.redirect("expenses");
            events.insert({
                "type" : "ExpenseAdded",
                "message": "Added expense " + expenseName + " with price " + expensePrice + 
                        " to category " + expenseCategory + " with id " + doc._id,
                "date": new Date()
            });
        }
    });
});

/* POST to Add Category Service */
router.post('/addcategory', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var categoryName = req.body.categoryname;
    

    // Set our collection
    var collection = db.get('categories');
    var events = db.get('events');

    // Submit to the DB
    collection.insert({
        "name" : categoryName
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
            events.insert({
                "type" : "CannotAddCategory",
                "message": err,
                "date": new Date()
            });
        }
        else {
            // And forward to success page
            res.redirect("back");
            events.insert({
                "type" : "CategoryAdded",
                "message": "Added category " + categoryName + " with id " + doc._id,
                "date": new Date()
            });
        }
    });
});

/* POST to Edit Expense Service */
router.post('/updateexpense', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var expenseName = req.body.expensename;
    var expensePrice = parseInt(req.body.expenseprice);
    var expenseCategory = req.body.expensecategory;
    var expenseDate = req.body.expensedate;

    // Set our collection
    var collection = db.get('expensecollection');
    var events = db.get('events');

    // Submit to the DB
    collection.update({
        '_id': req.body._id 
    },{
        "name" : expenseName,
        "price" : expensePrice,
        "category" : expenseCategory,
        "date" : expenseDate
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem updating the information in the database.");
            events.insert({
                "type" : "CannotAddExpense",
                "message": err,
                "date": new Date()
            });
        }
        else {
            // And forward to success page
            res.redirect("expenses");
            events.insert({
                "type" : "ExpenseUpdated",
                "message": "Updated expense with ID "+ req.body._id + ". Name: " + expenseName + ", price: " + expensePrice + ", category: " + expenseCategory,
                "date": new Date()
            });
        }
    });
});

module.exports = router;

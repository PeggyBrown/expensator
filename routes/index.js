var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET New Expense page. */
router.get('/newexpense', function(req, res) {
    res.render('newexpense', { title: 'Add New Expense' });
});

/* GET Expenselist page. */
router.get('/expenses', function(req, res) {
    var db = req.db;
    var collection = db.get('expensecollection');
    collection.find({},{},function(e,docs){
        res.render('expenses', {
            "expenses" : docs
        });
    });
});

/* POST to Add Expense Service */
router.post('/addexpense', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var expenseName = req.body.expensename;
    var expensePrice = req.body.expenseprice;

    // Set our collection
    var collection = db.get('expensecollection');

    // Submit to the DB
    collection.insert({
        "name" : expenseName,
        "price" : expensePrice
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
            res.redirect("expenses");
        }
    });
});

module.exports = router;

var express = require('express');
var MongoClient = require('mongodb').MongoClient;

var app = express();

var port = Number(process.env.PORT || 53535);

app.listen(port);
console.log("Listening on port: "+port);

var connectQuery = process.env.DBCONNECT;

MongoClient.connect(connectQuery, function(err, db) {
  if(err) {
    console.log("error connecting to the database");
    console.log(err);
    return;
  }
  var collection = db.collection('pio-api-collection');
});


app.get('/api', function(req, res) {
  res.send({name:req.query.name});
});

/**
 * A new user consists of an email, a password, and a type all encoded to protect the user's data
 *
 * ex. pio-api.heroku.com/api/newUser?email=kusdkdjfgskjdgfjxg&pass=skaskdjhkdjhksjdjhf&type=yuegjhbn
 */
app.get('/api/users/new', function(req, res) {
  
  if(!(req.query.email && req.query.pass && req.query.type)) {
    // invalid user post
    var badData = undefined;
    if(!req.query.email) {
      badData = "email";
    } else if(!req.query.pass) {
      badData = "pass";
    } else if(!req.query.type) {
      badData = "type";
    }
    // 400: Bad Data
    res.status(400).send({
      code : 400,
      msg : "bad data: "+badData
    });
    return;
  }
  
  // create a user object to be stored in the database
  var user = {
    email: req.query.email,
    pass: req.query.pass,
    type: req.query.type
  };
  
  // connect to the database
  MongoClient.connect(connectQuery, function(err, db) {
    if (err) {
      console.log("error connecting to the database for: "+req.ip);
      console.log(err);
      // 500: internal server error
      res.status(500).send({
        code : 500,
        msg : "Could not connect to database, see server logs or contact admin"
      });
      return;
    }
    
    // get the collection
    var collection = db.collection('pio-api-collection');
    
    // update the collection by adding the user object to the profiles array
    collection.update({'name':'profiles'}, {$push:{profiles:user}}, function(err, result) {
      if(err) {
        console.log("couldnt save user data for "+JSON.stringify(user));
        console.log(err);
        // 500: internal server error
        res.status(500).send({
          code : 500,
          msg : "Could not connect to database, see server logs or contact admin"
        });
        return    
      }
      // it worked
      res.status(200).send({
        code : 200,
        msg : "success"
      });
    });
  });
});


app.get('/api/users/exist', function(req, res) 
{
  var email = req.query.email;
  
  MongoClient.connect(connectQuery, function(err, db) {
    if(err) {
      console.log("error connecting to the database");
      console.log(err);
      res.status(500).send({
        code : 500,
        msg : "Could not connect to database, see server logs or contact admin"
      });
      return;
    }
    var collection = db.collection('pio-api-collection');
    var emailCollection = collection.findOne(
      {
        'name':'profiles',
        'profiles.email':email
      }, function(err, doc) {
        if(err) {
          console.log("could not find profiles");
          console.log(err);
          res.status(500).send({
            code : 500,
            msg : "Could not find profiles"
          });
          return;
        }

        if(doc!=null){
          res.status(200).send({
            code : 200,
            msg : "true"
          });
          return;
        }
        else{
          res.status(200).send({
            code : 200,
            msg : "false"
          });
          return;
        }
      }
    );
  });
});

app.get('/api/users/login', function(req,res)
{
  var email = req.query.email;
  var pass = req.query.pass;

  MongoClient.connect(connectQuery, function(err, db) {
    if(err) {
      console.log("error connecting to the database");
      console.log(err);
      res.status(500).send({
        code : 500,
        msg : "Could not connect to database, see server logs or contact admin"
      });
      return;
    }
    var collection = db.collection('pio-api-collection');
      var emailCollection = collection.findOne(
      {
        'name':'profiles',
        'profiles.email':email,
        'profiles.pass': pass,
      }, function(err, doc) {
        if(err) {
          console.log("could not find profiles");
          console.log(err);
          res.status(500).send({
            code : 500,
            msg : "Could not find profiles"
          });
          return;
        }

        if(doc!=null){
          res.status(200).send({
            code : 200,
            msg : "true"
          });
          return;
        }
        else{
          res.status(200).send({
            code : 200,
            msg : "false"
          });
          return;
         }
      }
    );
  });
});
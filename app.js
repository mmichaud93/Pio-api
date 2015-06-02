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
    res.status(400).send({
      error:"bad data: "+badData
    });
  }
  
  var user = {
    email: req.query.email,
    pass: req.query.pass,
    type: req.query.type
  };
  
  MongoClient.connect(connectQuery, function(err, db) {
    if (err) {
      console.log("error connecting to the database for: "+req.ip);
      console.log(err);
      res.status(500).send({
        error:"Could not connect to database, see server logs or contact admin"
      });
      return;
    }
    
    var collection = db.collection('pio-api-collection');
    
    collection.update({'name':'profiles'}, {$push:{profiles:user}}, function(err, result) {
      if(err) {
        console.log("couldnt save user data for "+JSON.stringify(user));
        console.log(err);
        res.status(500).send({
          error:"Could not connect to database, see server logs or contact admin"
        });
        return    
      }
      res.status(200).send();
    });
  });
});
  //   var collection = db.collection('profiles');
  //   // get the document for the user
  //   collection.findOne({'user':user}, function(err, item) {
  //     if(err) {
  //       console.log("error getting the document for user "+user);
  //       console.log(err);
  //       return;
  //     }
  //     if(!item) {
  //       item = {'user':user};
  //       collection.insert(item);
  //     }
  //     
  //     if(!item.latlngs) {
  //       item.latlngs = [];
  //     }
  //     
  //     item.latlngs.push({'lat':lat, 'lng':lng, 'timestamp':timestamp});
  //     
  //     collection.update({'user':user}, {$set:{latlngs:item.latlngs}}, function(err, result) {
  //       if(err) {
  //         console.log("couldnt save latlngs for "+user);
  //         return;
  //       }
  //     });
  //   });

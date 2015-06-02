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

app.get('/api/newUser', function(req, res) {
  MongoClient.connect(connectQuery, function(err, db) {
    if(err) {
      console.log("error connecting to the database for: "+req.ip);
      console.log(err);
      return;
    }
    
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
  });
  
  
  
});
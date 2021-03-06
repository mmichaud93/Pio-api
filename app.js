var app = require('express')();
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

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
  res.status(200).send({
    code : 200,
    msg : "all good"
  });
});

/**
 * A new user consists of an email, a password, and a type all encoded to protect the user's data
 *
 * ex. pio-api.heroku.com/api/newUser?email=kusdkdjfgskjdgfjxg&pass=skaskdjhkdjhksjdjhf&type=yuegjhbn
 */
 app.get('/api/users/new', function(req, res) {
   authToken(req.query.access_token || req.headers['x-access-token'], function(valid) {
     if(!valid) {
       res.status(498).send({
         code:498,
         msg: "invalid token"
       });
       return;
     }
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
     var currentTime = Date.now();
     var user = {
       name: "",
       email: req.query.email,
       pass: req.query.pass,
       type: req.query.type,
       facebook: {
         user_id: req.query.fb_user_id
       },
       image: "",
       xp: 0,
       createdAt: currentTime,
       lastUpdated: currentTime,
       premium: false,
       stats: [],
       devices: [],
       monuments: [],
       beta: {
         sessions: []
       }
     };
     if (req.query.device_name && req.query.device_os && req.query.device_app_ver && 
          req.query.device_screen_width && req.query.device_screen_height && req.query.device_screen_ppi) {
       user.devices.push({
         name: req.query.device_name,
         os: req.query.device_os,
         app_version: req.query.device_app_ver,
         addedAt: currentTime,
         screen: {
           width: req.query.device_screen_width,
           height: req.query.device_screen_height,
           ppi: req.query.device_screen_ppi
         }
       });
     }

     // connect to the database
     MongoClient.connect(connectQuery, function(err, db) {
       if (err) {
         sendDbError(res, err);
         return;
       }

       // get the collection
       var collection = db.collection('pio-api-collection');

       // update the collection by adding the user object to the profiles array
       collection.update({'name':'profiles'}, {$push:{profiles:user}}, function(err, result) {
         if(err) {
           sendDbError(res, err);
           return
         }
         // it worked
         res.status(200).send({
           code : 200,
           msg : "success",
           profile: user
         });
       });
     });
   });
 });

app.get('/api/users/exist', function(req, res)
{
  // make this call in each api method to be sure whoever is using our api is on the list
  authToken(req.query.access_token || req.headers['x-access-token'], function(valid) {
    if(!valid) {
      res.status(498).send({
        code: 498,
        msg: "invalid token"
      });
      return;
    }
    var email = req.query.email;

    MongoClient.connect(connectQuery, function(err, db) {
      if(err) {
        sendDbError(res, err);
        return;
      }
      var collection = db.collection('pio-api-collection');
      var emailCollection = collection.findOne(
        {
          'name':'profiles',
          'profiles.email':email
        }, function(err, doc) {
          if(err) {
            sendDbError(res, err);
            return;
          }

          if(doc!=null) {
            res.status(200).send({
              code : 200,
              msg : "true"
            });
            return;
          } else {
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
});

app.get('/api/users/login', function(req,res) {
  authToken(req.query.access_token || req.headers['x-access-token'], function(valid) {
    if(!valid) {
      res.status(498).send({
        code: 498,
        msg: "invalid token"
      });
      return;
    }
    if (!(req.query.email && req.query.pass)) {
      // invalid user post
      var badData = undefined;
      if(!req.query.email) {
        badData = "email";
      } else if(!req.query.pass) {
        badData = "pass";
      }
      // 400: Bad Data
      res.status(400).send({
        code : 400,
        msg : "bad data: "+badData
      });
      return;
    }
    var email = req.query.email;
    var pass = req.query.pass;
    var currentTime = Date.now();
    var device = {
      name: req.query.device_name,
      os: req.query.device_os,
      app_version: req.query.device_app_ver,
      addedAt: currentTime,
      screen: {
        width: req.query.device_screen_width,
        height: req.query.device_screen_height,
        ppi: req.query.device_screen_ppi
      }
    }

    MongoClient.connect(connectQuery, function(err, db) {
      if (err) {
        sendDbError(res, err);
        return;
      }
      var collection = db.collection('pio-api-collection');
      var emailCollection = collection.findOne(
        {
          'name':'profiles',
          'profiles.email':email,
          'profiles.pass': pass,
        }, function(err, doc) {
          if (err) {
            sendDbError(res, err);
            return;
          }

          if (doc!=null) {
            var profiles = doc.profiles.filter(function(obj) {
              if (obj.email==email && obj.pass==pass) {
                return true;
              }
              return false;
            });
            if (profiles.length > 0) {
              // update the devices to include the one used to login with
              if (profiles[0].devices.map(function(e) { return e.name; }).indexOf(device.name) == -1) {
                collection.update({
                  'name':'profiles',
                  'profiles.email':email}, {$push:{"profiles.$.devices":device}}, function(err, result) {
                    if(err) {
                      console.log("could not save device");
                      console.log(err);
                    }
                  });
              } else {
                // already have device on record
              }
              // login successful, return the user profile
              res.status(200).send({
                code : 200,
                msg : "true",
                profile : profiles[0]
              });
            } else {
              res.status(400).send({
                code:400,
                msg: "could not find user"
              });
            }
            return;
          } else {
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
});

// update user profile
app.post('/api/users/push', function(req, res) {
  authToken(req.query.access_token || req.headers['x-access-token'], function(valid) {
    if(!valid) {
      res.status(498).send({
        code: 498,
        msg: "invalid token"
      });
      return;
    }
    
    var profile = req.body;
    
    MongoClient.connect(connectQuery, function(err, db) {
      if(err) {
        sendDbError(res, err);
        return;
      }
      var collection = db.collection('pio-api-collection');
      
      var emailCollection = collection.findOne(
        {
          'name':'profiles',
          'profiles.email':profile.email,
          'profiles.pass': profile.pass,
        }, function(err, doc) {
          if(err) {
            sendDbError(res, err);
            return;
          }

          if(doc!=null) {
            var profiles = doc.profiles.filter(function(obj) {
              if(obj.email==profile.email && obj.pass==profile.pass) {
                return true;
              }
              return false;
            });
            if (profiles.length > 0) {
              collection.update({
                "name":"profiles",
                "profiles.email":profile.email}, {$set:{
                  "profiles.$.monuments":profile.monuments,
                  "profiles.$.xp":profile.xp,
                  "profiles.$.lastUpdated":profile.lastUpdated,
                  "profiles.$.stats":profile.stats
                  }}, function(err, result) {
                if(err) {
                  res.status(500).send({
                    code:500,
                    msg: "could not update user"
                  });
                } else {
                  res.status(200).send({
                    code:200,
                    msg: "success"
                  });
                }
              });
            } else {
              res.status(400).send({
                code:400,
                msg: "could not find user"
              });
            }
            return;
          } else {
            res.status(400).send({
              code:500,
              msg: "could not find user"
            });
            return;
          }
        }
      );
    });
  });
});

// get pio profile from fb user_id
app.get('/api/users/fb/get/:fb_user_id', function(req, res)
{
  authToken(req.query.access_token || req.headers['x-access-token'], function(valid) {
    if(!valid) {
      res.status(498).send({
        code: 498,
        msg: "invalid token"
      });
      return;
    }
    if (!req.params.fb_user_id) {
      // 400: Bad Data
      res.status(400).send({
        code : 400,
        msg : "bad data: fb_user_id"
      });
      return;
    }
    
    MongoClient.connect(connectQuery, function(err, db) {
      if(err) {
        sendDbError(res, err);
        return;
      }
      var collection = db.collection('pio-api-collection');
      var emailCollection = collection.findOne(
        {
          'name':'profiles',
          'profiles.facebook.user_id':req.params.fb_user_id
        }, function(err, doc) {
          if(err) {
            sendDbError(res, err);
            return;
          }

          if(doc!=null) {
            var profiles = doc.profiles.filter(function(obj) {
              if (obj.facebook.user_id==req.params.fb_user_id) {
                return true;
              }
              return false;
            });
            //console.log(profiles);
            if (profiles.length > 0) {
              var friendsProfile = {
                name: profiles[0].name,
                image: profiles[0].image,
                xp: profiles[0].xp,
                monuments: profiles[0].monuments
              };
              res.status(200).send({
                code : 200,
                msg : "true",
                friends_profile : friendsProfile
              });
              return;
            }
          } else {
            res.status(404).send({
                code : 404,
                msg : "could not find profile for user."
              });
            return;
          }
        }
      );
    });  
  });
});
// check to see if a facebook user is already registered
app.get('/api/users/fb/exists', function(req, res)
{
  // make this call in each api method to be sure whoever is using our api is on the list
  authToken(req.query.access_token || req.headers['x-access-token'], function(valid) {
    if(!valid) {
      res.status(498).send({
        code: 498,
        msg: "invalid token"
      });
      return;
    }

    MongoClient.connect(connectQuery, function(err, db) {
      if(err) {
        sendDbError(res, err);
        return;
      }
      var collection = db.collection('pio-api-collection');
      var emailCollection = collection.findOne(
        {
          'name':'profiles',
          'profiles.facebook.user_id':req.query.fb_user_id
        }, function(err, doc) {
          if(err) {
            sendDbError(res, err);
            return;
          }

          if(doc!=null) {
            res.status(200).send({
              code : 200,
              msg : "true"
            });
            return;
          } else {
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
});

app.get('/api/beta/signup_email', function(req,res) {
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
        'name':'beta',
        'signup.emails':email
      }, function(err, doc) {
        if(err) {
          console.log("could not access beta document");
          console.log(err);
          res.status(500).send({
            code : 500,
            msg : "Could not connect to database, see server logs or contact admin"
          });
          return;
        }
        if(!doc) {
          // update the collection by adding the user object to the profiles array
          collection.update({'name':'beta'}, {$push:{"signup.emails":email}}, function(err, result) {
            if(err) {
              console.log("couldnt save email for "+email);
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
        } else {
          res.status(200).send({
            code : 200,
            msg : "email already registered"
          });
        }
      }
    );
  });
});



function authToken(token, callback) {
  if(token) {
    MongoClient.connect(connectQuery, function(err, db) {
      if(err) {
        sendDbError(undefined, err);
        callback(false);
        return;
      }
      db.collection('pio-api-collection').findOne(
        {
          'name':'tokens',
          'tokens.token':token
        }, function(err, doc) {
          if(err) {
            sendDbError(undefined, err);
            return;
          }
          if(doc) {
            callback(true);
          } else {
            console.log("token is not found");
            callback(false);
          }
        }
      );
    });
  } else {
    console.log("token is null");
    callback(false);
  }
}

function sendDbError(res, err) {
  console.log("error connecting to the database");
  console.log(err);
  if(res) {
    res.status(500).send({
      code : 500,
      msg : "internal server error"
    });
  }
}

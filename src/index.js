'use strict';

/**
 * Created by litleleprikon on 13/11/2016.
 *  ___        __    ___           ___                              __
 * /\_ \    __/\ \__/\_ \         /\_ \                          __/\ \
 * \//\ \  /\_\ \ ,_\//\ \      __\//\ \      __   _____   _ __ /\_\ \ \/'\     ___     ___
 *   \ \ \ \/\ \ \ \/ \ \ \   /'__`\\ \ \   /'__`\/\ '__`\/\`'__\/\ \ \ , <    / __`\ /' _ `\
 *    \_\ \_\ \ \ \ \_ \_\ \_/\  __/ \_\ \_/\  __/\ \ \L\ \ \ \/ \ \ \ \ \\`\ /\ \L\ \/\ \/\ \
 *    /\____\\ \_\ \__\/\____\ \____\/\____\ \____\\ \ ,__/\ \_\  \ \_\ \_\ \_\ \____/\ \_\ \_\
 *    \/____/ \/_/\/__/\/____/\/____/\/____/\/____/ \ \ \/  \/_/   \/_/\/_/\/_/\/___/  \/_/\/_/
 *                                                   \ \_\
 *                                                    \/_/
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var auth = require('socketio-auth');
var User = require('./models').User;
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var uid = require('uid-safe');
var crypto = require('crypto');
var redis = require('socket.io-redis');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://mongo/ds_chat');
app.use(bodyParser.json());

io.adapter(redis({ host: 'redis', port: 6379 }));

app.post('/api/register', function (req, res) {
    console.log('New register: request')
    var salt = uid.sync(18);
    new User({
        username: req.body.username,
        passwordHash: crypto.createHash('sha512').update(req.body.password + salt).digest("hex"),
        salt: salt
    }).save(function (err) {
        if (err) {
            res.statusCode = 400;
            return res.send({status: 'error', details: err.message});
        } else {
            return res.send({status: 'success'});
        }
    })
});

auth(io, {
    authenticate: function (socket, data, callback) {
        var username = data.username;
        var password = data.password;

        User.findOne({username: username}, function (err, user) {
            if (err || !user) return callback(new Error("User not found"));
            return callback(null, user.passwordHash === crypto.createHash('sha512').update(password + user.salt).digest("hex"));
        })
    },
    postAuthenticate: function (socket, data) {
        socket.broadcast.emit('service', 'User ' + data.username + ' connected');
        socket.username = data.username;
        socket.on('message', function (message) {
            var clients = socket.server.sockets.connected;
            if (message.message.startsWith('/getUsers')) {
                var usernames = Object.keys(clients).map(function (key) {
                    return clients[key].username;
                });
                return socket.emit('service', 'There are this clients online: ' + usernames.join(', '));
            }

            if (message.message.startsWith('/kick')) {
                var user = message.message.split(' ', 2)[1];
                Object.keys(clients).forEach(function (key) {
                    if (clients[key].username === user) {
                        clients[key].emit('ban');
                        clients[key].disconnect();
                        socket.emit('service', 'User ' + user + ' has been disconnected');
                    }
                    else {
                        socket.emit('service', 'User ' + user + ' not found');
                    }
                });
                return;
            }
            message.username = data.username;
            socket.broadcast.emit('message', message);
            socket.emit('approve', message.id);
        });
    }
});

http.listen(3001, function () {
    console.log('Now app is listening on *:3001');
});
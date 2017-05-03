'use strict';

/**
 * Created by litleleprikon on 02/08/16.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    username: {
        type: String, unique: true, required: [true, 'Login is required field'], validate: {
            validator: function (v) {
                return v !== 'service';
            },
            message: 'You cannot choose username "service"'
        }
    },
    passwordHash: {type: String, required: [true, 'Password is required field']},
    salt: {type: String, required: [true, 'Salt is not set']}
});

exports.User = mongoose.model('User', userSchema);
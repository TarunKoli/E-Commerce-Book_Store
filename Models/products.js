const mongoose = require('mongoose');
const { ObjectID } = require('bson');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    image : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    description: {
        type : String,
        required : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    }
});

module.exports = mongoose.model('Products',ProductSchema);
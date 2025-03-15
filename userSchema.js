const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{type:String,require:true},
    start_date:{type:Date,require:true},
    end_date:{type:String,require:true}
});

module.exports = mongoose.model('userstudent', userSchema);

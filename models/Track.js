const mongoose=require('mongoose');
const TrackSchema=new mongoose.Schema({filename:String,originalName:String,mimetype:String,size:Number,title:String,createdAt:{type:Date,default:Date.now}});
module.exports=mongoose.model('Track',TrackSchema);
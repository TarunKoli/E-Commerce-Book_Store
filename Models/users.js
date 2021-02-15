const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email : {
        type : String,
        required : true
    },
    pass : {
        type : String,
        required : true
    },
    resetToken : String,
    resetTokenExpiration : Date,
    cart : {
        items : [{
            productId : { type : Schema.Types.ObjectId, ref : 'Products', required : true },
            quantity : { type: Number, required : true }
        }]
    }
});

userSchema.methods.addToCart = function(product) {

    const Index = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    let updatedCart = [...this.cart.items];

    if(Index >= 0){
       newQuantity = this.cart.items[Index].quantity+1;
       updatedCart[Index].quantity = newQuantity;
    } else {
        updatedCart.push({
            productId : product._id,
            quantity : newQuantity
        });
    }

    const Updated = {
        items : updatedCart
    };

    this.cart = Updated;
    return this.save();

};

userSchema.methods.removeFromCart = function(Id){
    const updatedItems = this.cart.items.filter(cp => {
        return cp.productId.toString() !== Id.toString();
    });

    this.cart.items = updatedItems;
    return this.save();
};

userSchema.methods.clearCart = function(){
    this.cart.items = [];
    return this.save();
}

module.exports = mongoose.model('Users',userSchema);